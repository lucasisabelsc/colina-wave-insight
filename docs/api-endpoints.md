# API Endpoints para Colina Wave Insight

Este documento descreve todos os endpoints necessários para suportar a aplicação Colina Wave Insight Dashboard.

## Endpoints por Categoria

### 1. Métricas

#### 1.1 GET /metrics/today
**Descrição:** Retorna as métricas principais do dashboard para o dia atual.

**Request:** 
- Não requer parâmetros

**Response:**
```json
{
  "date": "2025-08-05",
  "metrics": {
    "totalMessages": {
      "value": 1247,
      "change": {
        "value": 12,
        "type": "increase"
      }
    },
    "averageResponseTime": {
      "value": 18,
      "unit": "minutes",
      "change": {
        "value": 5,
        "type": "decrease"
      }
    },
    "activeGroups": {
      "value": 23,
      "change": {
        "value": 2,
        "type": "increase"
      }
    },
    "waitingClients": {
      "value": 7,
      "change": {
        "value": 3,
        "type": "increase"
      }
    }
  }
}
```

### 2. Alertas

#### 2.1 GET /alerts
**Descrição:** Retorna os alertas urgentes de mensagens não respondidas ou situações prioritárias.

**Request Parameters:**
```json
{
  "limit": "number (opcional, default: 10)",
  "priority": "string (opcional, enum: high, medium, low)"
}
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "string",
      "groupId": "string",
      "groupName": "string",
      "clientName": "string",
      "lastMessage": {
        "text": "string",
        "timestamp": "ISO-8601 datetime"
      },
      "waitingTime": {
        "value": "number",
        "unit": "minutes"
      },
      "priority": "high | medium | low",
      "messageCount": "number"
    }
  ],
  "total": "number",
  "page": "number",
  "hasMore": "boolean"
}
```

### 3. Atividade

#### 3.1 GET /activity/hourly
**Descrição:** Retorna dados de atividade por hora para o dia atual.

**Request Parameters:**
```json
{
  "date": "string (opcional, YYYY-MM-DD, default: today)"
}
```

**Response:**
```json
{
  "date": "2025-08-05",
  "data": [
    {
      "hour": "string (HH:00)",
      "messages": "number",
      "responseTime": {
        "average": "number",
        "unit": "minutes"
      }
    }
  ],
  "summary": {
    "totalMessages": "number",
    "averageResponseTime": "number"
  }
}
```

#### 3.2 GET /activity/weekly
**Descrição:** Retorna dados de atividade por dia da semana.

**Request Parameters:**
```json
{
  "startDate": "string (YYYY-MM-DD)",
  "endDate": "string (YYYY-MM-DD)",
  "groupId": "string (opcional)"
}
```

**Response:**
```json
{
  "period": {
    "start": "2025-08-01",
    "end": "2025-08-07"
  },
  "data": [
    {
      "date": "2025-08-01",
      "dayOfWeek": "string",
      "messages": "number",
      "responseTime": {
        "average": "number",
        "unit": "minutes"
      }
    }
  ],
  "summary": {
    "totalMessages": "number",
    "averageResponseTime": "number"
  }
}
```

### 4. Grupos

#### 4.1 GET /groups
**Descrição:** Retorna lista de todos os grupos do WhatsApp monitorados.

**Request Parameters:**
```json
{
  "status": "string (opcional, enum: waiting, active, idle)",
  "page": "number (opcional, default: 1)",
  "limit": "number (opcional, default: 20)",
  "sortBy": "string (opcional, enum: name, lastActivity, messageCount)"
}
```

**Response:**
```json
{
  "groups": [
    {
      "id": "string",
      "name": "string",
      "members": {
        "total": "number",
        "active": "number"
      },
      "messages": {
        "today": "number",
        "total": "number"
      },
      "responseTime": {
        "average": "number",
        "unit": "minutes"
      },
      "lastActivity": {
        "timestamp": "ISO-8601 datetime",
        "type": "message | status | member"
      },
      "status": "waiting | active | idle"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "hasMore": "boolean"
  }
}
```

#### 4.2 GET /groups/{groupId}/stats
**Descrição:** Retorna estatísticas detalhadas de um grupo específico.

**Path Parameters:**
- `groupId`: string (required)

**Request Parameters:**
```json
{
  "period": "string (opcional, enum: today, week, month, custom)",
  "startDate": "string (opcional, YYYY-MM-DD)",
  "endDate": "string (opcional, YYYY-MM-DD)"
}
```

**Response:**
```json
{
  "group": {
    "id": "string",
    "name": "string",
    "description": "string",
    "createdAt": "ISO-8601 datetime"
  },
  "metrics": {
    "members": {
      "total": "number",
      "active": "number",
      "admins": "number"
    },
    "messages": {
      "total": "number",
      "today": "number",
      "byType": {
        "text": "number",
        "media": "number",
        "documents": "number"
      }
    },
    "responseTime": {
      "average": "number",
      "best": "number",
      "worst": "number",
      "unit": "minutes"
    }
  },
  "activity": {
    "hourly": [...],
    "daily": [...],
    "monthly": [...]
  },
  "members": [
    {
      "id": "string",
      "name": "string",
      "role": "admin | member",
      "lastActive": "ISO-8601 datetime",
      "messageCount": "number"
    }
  ]
}
```

### 5. Webhooks

#### 5.1 POST /webhook/whatsapp
**Descrição:** Endpoint para receber eventos do WhatsApp em tempo real.

**Headers:**
```json
{
  "X-Webhook-Signature": "string (required)",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "type": "string (enum: message, status, group)",
  "timestamp": "ISO-8601 datetime",
  "data": {
    // Para type: message
    "message": {
      "id": "string",
      "groupId": "string",
      "from": {
        "id": "string",
        "name": "string",
        "phone": "string"
      },
      "content": {
        "type": "text | media | document",
        "text": "string",
        "mediaUrl": "string",
        "documentUrl": "string"
      },
      "timestamp": "ISO-8601 datetime"
    },
    // Para type: status
    "status": {
      "groupId": "string",
      "type": "typing | online | offline",
      "participant": {
        "id": "string",
        "name": "string"
      }
    },
    // Para type: group
    "group": {
      "id": "string",
      "action": "create | update | delete | member_join | member_leave",
      "data": {
        "name": "string",
        "description": "string",
        "members": [
          {
            "id": "string",
            "name": "string",
            "role": "admin | member"
          }
        ]
      }
    }
  }
}
```

**Response:**
```json
{
  "success": "boolean",
  "messageId": "string (opcional)",
  "error": {
    "code": "string (opcional)",
    "message": "string (opcional)"
  }
}
```

## Considerações Técnicas

### DynamoDB Tables Necessárias

1. **Groups**
   - Armazena informações dos grupos
   - Partition Key: groupId
   - GSI: status-lastActivity-index

2. **Messages**
   - Armazena todas as mensagens
   - Partition Key: messageId
   - Sort Key: timestamp
   - GSI: groupId-timestamp-index

3. **Metrics**
   - Armazena métricas agregadas
   - Partition Key: date
   - Sort Key: metricType

4. **Alerts**
   - Armazena alertas ativos
   - Partition Key: alertId
   - GSI: priority-timestamp-index

### Arquitetura Sugerida

- Usar API Gateway com Lambda Integration
- Implementar cache com DynamoDB DAX para queries frequentes
- Utilizar EventBridge para agendamento de agregações
- SQS para processamento assíncrono de eventos do webhook
- CloudWatch para monitoramento de tempos de resposta

### Segurança

- Implementar autenticação via API Key ou JWT
- Rate limiting por IP/cliente
- Encryption em trânsito e em repouso
- IAM Roles com princípio de menor privilégio
- VPC endpoints para acesso ao DynamoDB
