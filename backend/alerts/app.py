## alerts/app.py

import boto3
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import json
from rapidfuzz import fuzz
import unicodedata
import re

dynamodb = boto3.resource('dynamodb')
messages_table = dynamodb.Table('crm-mensagens')
groups_table = dynamodb.Table('crm-groupId')

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE,PATCH",
    "Access-Control-Allow-Headers": "*"
}

IGNORED_MESSAGES = ["ok", "obrigado", "obrigada", "valeu", "vlw", "tks", "thanks"," obrigado(a)", "obrigadão", "tudo certo", "tudo bem", "tudo tranquilo", "tudo ok", "tudo beleza"]

MIN_WAIT_MINUTES = 10

def normalize_text(text):
    text = text.lower().strip()
    text = "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )
    text = re.sub(r"[^\w\s]", "", text)  # remove pontuação
    return text

def is_irrelevant_message(text):
    if not text:
        return True

    norm = normalize_text(text)

    for term in IGNORED_MESSAGES:
        norm_term = normalize_text(term)

        # 1️⃣ Similaridade alta → irrelevante
        if fuzz.ratio(norm, norm_term) > 85:
            return True

        # 2️⃣ Termo presente como palavra isolada → irrelevante
        if re.search(rf"\b{re.escape(norm_term)}\b", norm):
            return True

    return False

def get_priority(waiting_minutes):
    if waiting_minutes >= 120:
        return "high"
    elif waiting_minutes >= 60:
        return "medium"
    else:
        return "low"

def get_group_name(group_id):
    try:
        res = groups_table.get_item(Key={"groupId": group_id})
        return res.get("Item", {}).get("groupName", "")
    except Exception:
        return ""

def lambda_handler(event, context):
    print("🔄 Iniciando execução da Lambda")

    query = event.get("queryStringParameters") or {}
    limit = int(query.get("limit", 10))
    priority_filter = query.get("priority")

    # Carrega todas as mensagens
    response = messages_table.scan(Limit=500)
    items = response["Items"]
    print(f"📥 Total de mensagens recebidas: {len(items)}")

    # Agrupa mensagens por groupId
    grouped_messages = defaultdict(list)
    for msg in items:
        grouped_messages[msg["groupId"]].append(msg)

    alerts = []
    now = datetime.now(timezone.utc) - timedelta(hours=3)  # ajustar para fuso -3

    for group_id, msgs in grouped_messages.items():
        msgs_sorted = sorted(msgs, key=lambda m: m["timestamp"])

        # Última mensagem do cliente
        last_client_msg = None
        for msg in reversed(msgs_sorted):
            if msg.get("direction") == "client":
                client_time = datetime.fromisoformat(msg["timestamp"].replace("Z", "+00:00"))
                diff_minutes = int((now - client_time).total_seconds() / 60)

                text = json.loads(msg["content"]).get("text", "")

                # Se já passou do tempo mínimo, aplicar filtro de relevância
                if diff_minutes >= MIN_WAIT_MINUTES:
                    if not is_irrelevant_message(text):
                        last_client_msg = msg
                        break
                else:
                    # Mensagem recente — sempre entra como relevante
                    last_client_msg = msg
                    break

        if not last_client_msg:
            continue  # nenhuma mensagem do cliente nesse grupo

        # Verifica se houve resposta do time depois da última do cliente
        client_time = datetime.fromisoformat(last_client_msg["timestamp"].replace("Z", "+00:00"))
        responded = any(
            msg.get("direction") == "team" and
            datetime.fromisoformat(msg["timestamp"].replace("Z", "+00:00")) > client_time
            for msg in msgs_sorted
        )

        if responded:
            continue  # já foi respondido

        waiting_minutes = int((now - client_time).total_seconds() / 60)
        priority = get_priority(waiting_minutes)

        if priority_filter and priority != priority_filter:
            continue

        alert = {
            "id": last_client_msg["messageId"],
            "groupId": group_id,
            "groupName": get_group_name(group_id),
            "clientName": json.loads(last_client_msg["from"]).get("name"),
            "lastMessage": {
                "text": json.loads(last_client_msg["content"]).get("text"),
                "timestamp": last_client_msg["timestamp"]
            },
            "waitingTime": {
                "value": waiting_minutes,
                "unit": "minutes"
            },
            "priority": priority,
            "messageCount": len(msgs)
        }

        alerts.append(alert)

    print(f"📦 Total de alertas gerados: {len(alerts)}")

    # Ordenar por prioridade e tempo
    priority_order = {"high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda x: (priority_order[x["priority"]], -x["waitingTime"]["value"]))

    result = {
        "alerts": alerts[:limit],
        "total": len(alerts),
        "page": 1,
        "hasMore": len(alerts) > limit
    }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result)
    }
