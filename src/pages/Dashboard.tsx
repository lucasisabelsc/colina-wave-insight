import { MetricCard } from "@/components/MetricCard";
import { AlertCard } from "@/components/AlertCard";
import { ActivityChart } from "@/components/ActivityChart";
import { GroupsTable } from "@/components/GroupsTable";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Zap
} from "lucide-react";

import { useEffect, useState } from "react";
import { getAlerts } from "@/services/alerts";
import { getTodayMetrics } from "@/services/metricsToday";
import { getGroupsOverview } from "@/services/groups";




// Mock data - Em produção virá do DynamoDB
const mockMetrics = [
  {
    title: "Total de Mensagens Hoje",
    value: "1,247",
    change: { value: 12, type: "increase" as const },
    icon: MessageSquare,
    variant: "success" as const
  },
  {
    title: "Tempo Médio de Resposta",
    value: "18 min",
    change: { value: 5, type: "decrease" as const },
    icon: Clock,
    variant: "warning" as const
  },
  {
    title: "Grupos Ativos",
    value: "23",
    change: { value: 2, type: "increase" as const },
    icon: Users,
    variant: "default" as const
  },
  {
    title: "Clientes Aguardando",
    value: "7",
    change: { value: 3, type: "increase" as const },
    icon: AlertTriangle,
    variant: "destructive" as const
  }
];

const mockHourlyData = [
  { name: "08:00", value: 45, responseTime: 12 },
  { name: "10:00", value: 78, responseTime: 15 },
  { name: "12:00", value: 125, responseTime: 22 },
  { name: "14:00", value: 156, responseTime: 18 },
  { name: "16:00", value: 203, responseTime: 25 },
  { name: "18:00", value: 89, responseTime: 8 },
  { name: "20:00", value: 34, responseTime: 5 }
];

const mockWeeklyData = [
  { name: "Seg", value: 890 },
  { name: "Ter", value: 1240 },
  { name: "Qua", value: 1456 },
  { name: "Qui", value: 1123 },
  { name: "Sex", value: 1678 },
  { name: "Sáb", value: 567 },
  { name: "Dom", value: 234 }
];

const mockGroups = [
  {
    id: "1",
    name: "Cliente Alpha - Projeto Site",
    members: 8,
    todayMessages: 45,
    avgResponseTime: "25 min",
    lastActivity: "há 2h",
    status: "waiting" as const
  },
  {
    id: "2",
    name: "Beta Corp - Campanhas Google",
    members: 5,
    todayMessages: 78,
    avgResponseTime: "12 min",
    lastActivity: "há 15min",
    status: "active" as const
  },
  {
    id: "3",
    name: "Gamma Tech - Social Media",
    members: 6,
    todayMessages: 123,
    avgResponseTime: "8 min",
    lastActivity: "há 5min",
    status: "active" as const
  },
  {
    id: "4",
    name: "Delta Solutions - SEO",
    members: 4,
    todayMessages: 12,
    avgResponseTime: "45 min",
    lastActivity: "há 6h",
    status: "idle" as const
  }
];

type Alert = {
  groupName: string;
  clientName: string;
  lastMessage: {
    text: string;
    timestamp: string;
  };
  waitingTime: {
    value: number;
    unit: string;
  };
  priority: "low" | "medium" | "high";
  messageCount: number;
};


type TodayMetricsResponse = {
  date: string;
  metrics: {
    totalMessages: {
      value: number;
      change: {
        value: number;
        type: "increase" | "decrease";
      };
    };
    averageResponseTime: {
      value: number;
      unit: string;
      change: {
        value: number;
        type: "increase" | "decrease";
      };
    };
    activeGroups: {
      value: number;
      change: {
        value: number;
        type: "increase" | "decrease";
      };
    };
    waitingClients: {
      value: number;
      change: {
        value: number;
        type: "increase" | "decrease";
      };
    };
  };
};

export type GroupOverview = {
  id: string;
  name: string;
  todayMessages: number;
  avgResponseTime: string;
  lastActivity: string;
  status: "active" | "idle" | "waiting";
};

export default function Dashboard() {

const [metrics, setMetrics] = useState<TodayMetricsResponse["metrics"] | null>(null);  

useEffect(() => {
  const fetchMetrics = async () => {
    const res = await getTodayMetrics();
    if (res?.metrics) setMetrics(res.metrics);
  };

  fetchMetrics();
}, []);

const [alerts, setAlerts] = useState<Alert[]>([]);

useEffect(() => {
  const fetchAlerts = async () => {
    const result = await getAlerts();
    setAlerts(result);
  };

  fetchAlerts();
}, []);

const [groups, setGroups] = useState<GroupOverview[]>([]);

useEffect(() => {
  const fetchGroups = async () => {
    const res = await getGroupsOverview();
    setGroups(res);
  };

  fetchGroups();
}, []);

console.log(metrics);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          Dashboard Analytics
        </h1>
        <p className="text-muted-foreground">
          Monitoramento em tempo real dos grupos WhatsApp do Studio Colina
        </p>
      </div>

      {/* Métricas Principais */}
      {metrics && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      title="Total de Mensagens Hoje"
      value={metrics.totalMessages.value.toLocaleString()}
      change={metrics.totalMessages.change}
      icon={MessageSquare}
      variant="success"
    />
    <MetricCard
      title="Tempo Médio de Resposta"
      value={`${metrics.averageResponseTime.value} ${metrics.averageResponseTime.unit}`}
      change={metrics.averageResponseTime.change}
      icon={Clock}
      variant="warning"
    />
    <MetricCard
      title="Grupos Ativos"
      value={metrics.activeGroups.value.toString()}
      change={metrics.activeGroups.change}
      icon={Users}
      variant="default"
    />
    <MetricCard
      title="Clientes Aguardando"
      value={metrics.waitingClients.value.toString()}
      change={metrics.waitingClients.change}
      icon={AlertTriangle}
      variant="destructive"
    />
  </div>
)}

      {/* Alertas e Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertas - 1/3 da tela */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertas Urgentes
          </h2>
          {alerts.map((alert, index) => (
            <AlertCard key={index} {...alert} />
            ))}
        </div>

        {/* Gráficos - 2/3 da tela */}
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart 
            title="Atividade por Horário (Hoje)" 
            data={mockHourlyData} 
            type="area"
          />
          <ActivityChart 
            title="Mensagens por Dia da Semana" 
            data={mockWeeklyData} 
            type="bar"
          />
        </div>
      </div>

      {/* Tabela de Grupos */}
      <GroupsTable groups={groups} />
    </div>
  );
}