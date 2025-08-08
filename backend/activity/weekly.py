import boto3
import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import statistics
import calendar

dynamodb = boto3.resource('dynamodb')
messages_table = dynamodb.Table('crm-mensagens')

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE,PATCH",
    "Access-Control-Allow-Headers": "*"
}

def parse_timestamp(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))

def lambda_handler(event, context):
    query = event.get("queryStringParameters") or {}

    # Datas obrigatórias
    if not query.get("startDate") or not query.get("endDate"):
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Parâmetros startDate e endDate são obrigatórios"})
        }

    start_date = datetime.fromisoformat(query["startDate"])
    end_date = datetime.fromisoformat(query["endDate"])
    group_filter = query.get("groupId")

    # Carrega todas as mensagens (mesmo padrão das outras lambdas)
    items = []
    response = messages_table.scan()
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
        response = messages_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    # Ordena por timestamp
    items.sort(key=lambda m: m["timestamp"])

    # Agrupadores
    counts_per_day = defaultdict(int)
    resp_times_per_day = defaultdict(list)
    all_resp_times = []

    for i in range(len(items)):
        msg = items[i]
        ts = parse_timestamp(msg["timestamp"]) - timedelta(hours=3)  # fuso -3
        if ts.date() < start_date.date() or ts.date() > end_date.date():
            continue
        if group_filter and msg.get("groupId") != group_filter:
            continue

        date_label = ts.date().isoformat()
        counts_per_day[date_label] += 1

        if msg.get("direction") == "client":
            for j in range(i + 1, len(items)):
                nxt = items[j]
                if nxt.get("direction") == "team":
                    t1 = ts
                    t2 = parse_timestamp(nxt["timestamp"]) - timedelta(hours=3)
                    delta_min = (t2 - t1).total_seconds() / 60
                    if 0 < delta_min < 180:
                        resp_times_per_day[date_label].append(delta_min)
                        all_resp_times.append(delta_min)
                    break

    # Monta dados no formato do contrato
    data = []
    total_messages = 0
    for day in sorted(counts_per_day.keys()):
        msgs = counts_per_day.get(day, 0)
        total_messages += msgs
        avg_rt = round(statistics.mean(resp_times_per_day.get(day, [])), 2) if resp_times_per_day.get(day) else 0
        day_of_week = calendar.day_name[datetime.fromisoformat(day).weekday()]
        data.append({
            "date": day,
            "dayOfWeek": day_of_week,
            "messages": msgs,
            "responseTime": {
                "average": avg_rt,
                "unit": "minutes"
            }
        })

    summary = {
        "totalMessages": total_messages,
        "averageResponseTime": round(statistics.mean(all_resp_times), 2) if all_resp_times else 0
    }

    result = {
        "period": {
            "start": start_date.date().isoformat(),
            "end": end_date.date().isoformat()
        },
        "data": data,
        "summary": summary
    }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result)
    }
