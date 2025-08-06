import boto3
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import statistics
import json

dynamodb = boto3.resource('dynamodb')
messages_table = dynamodb.Table('crm-mensagens')
groups_table = dynamodb.Table('crm-groupId')

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE,PATCH",
    "Access-Control-Allow-Headers": "*"
}

def get_priority(waiting_minutes):
    if waiting_minutes >= 120:
        return "high"
    elif waiting_minutes >= 60:
        return "medium"
    else:
        return "low"

def get_group_name(group_id):
    print(f"🔍 Buscando nome do grupo para groupId: {group_id}")
    try:
        res = groups_table.get_item(Key={"groupId": group_id})
        item = res.get("Item", {})
        print(f"✅ Resultado encontrado: {item}")
        return item.get("groupName", "")
    except Exception as e:
        print(f"⚠️ Erro ao buscar groupName para {group_id}: {e}")
        return ""

def lambda_handler(event, context):
    print(f"🚀 Evento recebido: {json.dumps(event)}")
    
    query = event.get("queryStringParameters") or {}
    limit = int(query.get("limit", 10))
    priority_filter = query.get("priority")
    
    print(f"🔎 Parâmetros extraídos - limit: {limit}, priority_filter: {priority_filter}")

    response = messages_table.scan(Limit=500)
    items = response["Items"]
    print(f"📥 Mensagens recuperadas: {len(items)}")

    client_messages = [item for item in items if item.get("direction") == "client"]
    print(f"📨 Mensagens filtradas de clientes: {len(client_messages)}")

    grouped_alerts = defaultdict(list)
    for msg in client_messages:
        group_id = msg.get("groupId")
        grouped_alerts[group_id].append(msg)

    print(f"📦 Grupos identificados: {len(grouped_alerts)}")

    alerts = []
    now = datetime.now(timezone.utc)
    now = now - timedelta(hours=3)  # ✅ Usa UTC corretamente

    for group_id, msgs in grouped_alerts.items():
        sorted_msgs = sorted(msgs, key=lambda m: m["timestamp"])
        first_msg = sorted_msgs[0]

        # ✅ timestamp vem em UTC ("Z"), então mantemos o cálculo em UTC
        msg_time = datetime.fromisoformat(first_msg["timestamp"].replace("Z", "+00:00"))

        waiting_minutes = int((now - msg_time).total_seconds() / 60)
        priority = get_priority(waiting_minutes)

        print(f"🧮 GroupId: {group_id}, Tempo de espera: {waiting_minutes} min, Prioridade: {priority}")

        if priority_filter and priority != priority_filter:
            print(f"⏩ Ignorado por prioridade (esperada: {priority_filter}, atual: {priority})")
            continue

        alert = {
            "id": first_msg["messageId"],
            "groupId": group_id,
            "groupName": get_group_name(group_id),
            "clientName": json.loads(first_msg["from"]).get("name"),
            "lastMessage": {
                "text": json.loads(first_msg["content"]).get("text"),
                "timestamp": first_msg["timestamp"]
            },
            "waitingTime": {
                "value": waiting_minutes,
                "unit": "minutes"
            },
            "priority": priority,
            "messageCount": len(msgs)
        }

        print(f"✅ Alerta adicionado: {json.dumps(alert)}")
        alerts.append(alert)

    priority_order = {"high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: (priority_order[x["priority"]], -x["waitingTime"]["value"]))

    result = {
        "alerts": alerts[:limit],
        "total": len(alerts),
        "page": 1,
        "hasMore": len(alerts) > limit
    }

    print(f"📤 Resultado final: {json.dumps(result)}")

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result)
    }
