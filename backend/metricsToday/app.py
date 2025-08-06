import boto3
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import statistics
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('crm-mensagens')  # Altere aqui

# ==============================
# 📦 Headers de CORS reutilizáveis
# ==============================
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE,PATCH",
    "Access-Control-Allow-Headers": "*"
}

def calcular_variacao(hoje, ontem):
    if ontem == 0:
        return {"value": hoje, "type": "increase"}
    diff = hoje - ontem
    tipo = "increase" if diff >= 0 else "decrease"
    return {"value": abs(diff), "type": tipo}

def extrair_metricas_por_dia(mensagens, data_referencia):
    total = 0
    grupos = set()
    por_grupo = defaultdict(list)

    for msg in mensagens:
        try:
            ts = datetime.fromisoformat(msg['timestamp'].replace("Z", "+00:00"))
            if ts.date() == data_referencia:
                total += 1
                grupo = msg.get('groupId')
                direcao = msg.get('direction')
                grupos.add(grupo)
                por_grupo[grupo].append((ts, direcao))
        except:
            continue

    tempos_resposta = []
    aguardando = 0

    for msgs in por_grupo.values():
        msgs.sort()
        for i in range(len(msgs) - 1):
            if msgs[i][1] == 'client' and msgs[i+1][1] == 'agent':
                delta = (msgs[i+1][0] - msgs[i][0]).total_seconds() / 60
                if 0 < delta < 180:
                    tempos_resposta.append(delta)
        if msgs and msgs[-1][1] == 'client':
            aguardando += 1

    media_resposta = round(statistics.mean(tempos_resposta), 2) if tempos_resposta else 0

    return {
        "totalMessages": total,
        "averageResponseTime": media_resposta,
        "activeGroups": len(grupos),
        "waitingClients": aguardando
    }

def lambda_handler(event, context):
    hoje = datetime.now(timezone.utc).date()
    ontem = hoje - timedelta(days=1)

    response = table.scan()
    mensagens = response.get("Items", [])

    metricas_hoje = extrair_metricas_por_dia(mensagens, hoje)
    metricas_ontem = extrair_metricas_por_dia(mensagens, ontem)

    response_body = {
        "date": hoje.isoformat(),
        "metrics": {
            "totalMessages": {
                "value": metricas_hoje["totalMessages"],
                "change": calcular_variacao(metricas_hoje["totalMessages"], metricas_ontem["totalMessages"])
            },
            "averageResponseTime": {
                "value": metricas_hoje["averageResponseTime"],
                "unit": "minutes",
                "change": calcular_variacao(metricas_hoje["averageResponseTime"], metricas_ontem["averageResponseTime"])
            },
            "activeGroups": {
                "value": metricas_hoje["activeGroups"],
                "change": calcular_variacao(metricas_hoje["activeGroups"], metricas_ontem["activeGroups"])
            },
            "waitingClients": {
                "value": metricas_hoje["waitingClients"],
                "change": calcular_variacao(metricas_hoje["waitingClients"], metricas_ontem["waitingClients"])
            }
        }
    }

    return {
        "statusCode": 200,
        "headers": {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",  # ou coloque seu domínio exato aqui
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*"
    },
        "body": json.dumps(response_body)
    }
