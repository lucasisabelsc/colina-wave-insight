## groupsOverview/app.py

import boto3
import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import statistics

dynamodb = boto3.resource('dynamodb')
messages_table = dynamodb.Table('crm-mensagens')
groups_table = dynamodb.Table('crm-groupId')

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE,PATCH",
    "Access-Control-Allow-Headers": "*"
}

def parse_timestamp(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))

def format_time_diff(past, now):
    diff = now - past
    mins = int(diff.total_seconds() / 60)
    if mins < 60:
        return f"há {mins}min"
    else:
        hours = mins // 60
        return f"há {hours}h"

def lambda_handler(event, context):
    now = datetime.now(timezone.utc) - timedelta(hours=3)
    today = now.date()

    # Paginação completa
    items = []
    response = messages_table.scan()
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
        response = messages_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    # Agrupamento
    grupos = defaultdict(list)
    for msg in items:
        grupos[msg["groupId"]].append(msg)

    # Dados de grupos (nome e membros)
    group_names = {}
    group_members = {}
    gscan = groups_table.scan()
    for g in gscan.get("Items", []):
        group_names[g["groupId"]] = g.get("groupName", g["groupId"])

    # Resumo por grupo
    resultado = []
    for group_id, mensagens in grupos.items():
        mensagens.sort(key=lambda m: m["timestamp"])
        timestamps = [parse_timestamp(m["timestamp"]) for m in mensagens]
        last_activity = max(timestamps)
        ultima_atividade_str = format_time_diff(last_activity, now)

        # Mensagens de hoje
        today_msgs = [m for m in mensagens if parse_timestamp(m["timestamp"]).date() == today]
        total_hoje = len(today_msgs)

        # Tempo médio de resposta
        tempos = []
        aguardando = False
        for i in range(len(mensagens) - 1):
            if mensagens[i]["direction"] == "client" and mensagens[i+1]["direction"] == "team":
                t1 = parse_timestamp(mensagens[i]["timestamp"])
                t2 = parse_timestamp(mensagens[i+1]["timestamp"])
                delta = (t2 - t1).total_seconds() / 60
                if 0 < delta < 180:
                    tempos.append(delta)

        if mensagens[-1]["direction"] == "client":
            t_last_client = parse_timestamp(mensagens[-1]["timestamp"])
            if now - t_last_client > timedelta(minutes=10):
                aguardando = True

        avg_resp = round(statistics.mean(tempos), 2) if tempos else 0
        avg_resp_str = f"{int(avg_resp)} min" if avg_resp else "-"

        # Status
        minutos_desde_ultima = (now - last_activity).total_seconds() / 60
        if aguardando:
            status = "waiting"
        elif minutos_desde_ultima > 300:
            status = "idle"
        else:
            status = "active"

        resultado.append({
            "id": group_id,
            "name": group_names.get(group_id, group_id),
            "todayMessages": total_hoje,
            "avgResponseTime": avg_resp_str,
            "lastActivity": ultima_atividade_str,
            "status": status
        })

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({ "groups": resultado })
    }
