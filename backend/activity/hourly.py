import boto3
import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import statistics

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
    # Data padrão = hoje
    now = datetime.now(timezone.utc) - timedelta(hours=3)
    date_str = query.get("date") or now.date().isoformat()
    date_ref = datetime.fromisoformat(date_str)

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
    counts_per_hour = defaultdict(int)
    resp_times_per_hour = defaultdict(list)
    all_resp_times = []

    for i in range(len(items)):
        msg = items[i]
        ts = parse_timestamp(msg["timestamp"])
        # Fuso -3 aplicado
        local_ts = ts - timedelta(hours=0)  # já ajustamos no now
        if local_ts.date() != date_ref.date():
            continue

        hour_label = f"{local_ts.hour:02d}:00"
        counts_per_hour[hour_label] += 1

        if msg.get("direction") == "client":
            for j in range(i + 1, len(items)):
                nxt = items[j]
                t1 = ts
                t2 = parse_timestamp(nxt["timestamp"])
                if nxt.get("direction") == "team":
                    delta_min = (t2 - t1).total_seconds() / 60
                    if 0 < delta_min < 180:
                        resp_times_per_hour[hour_label].append(delta_min)
                        all_resp_times.append(delta_min)
                    break

    # Monta dados no formato do contrato
    data = []
    total_messages = 0
    for h in range(24):
        label = f"{h:02d}:00"
        msgs = counts_per_hour.get(label, 0)
        total_messages += msgs
        avg_rt = round(statistics.mean(resp_times_per_hour.get(label, [])), 2) if resp_times_per_hour.get(label) else 0
        data.append({
            "hour": label,
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
        "date": date_str,
        "data": data,
        "summary": summary
    }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result)
    }
