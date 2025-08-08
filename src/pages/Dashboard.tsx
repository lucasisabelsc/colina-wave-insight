import { MetricCard } from "@/components/MetricCard";
import { AlertCard } from "@/components/AlertCard";
import { ActivityChart } from "@/components/ActivityChart";
import { GroupsTable } from "@/components/GroupsTable";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  AlertTriangle,
  Zap
} from "lucide-react";

import { useEffect, useState } from "react";
import { getAlerts } from "@/services/alerts";
import { getTodayMetrics } from "@/services/metricsToday";
import { getGroupsOverview } from "@/services/groups";
import { getActivityHourly } from "@/services/hourly";
import { getActivityWeekly } from "@/services/weekly";

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

type GroupOverview = {
  id: string;
  name: string;
  todayMessages: number;
  avgResponseTime: string;
  lastActivity: string;
  status: "active" | "idle" | "waiting";
};

type HourlyActivityItem = {
  hour: string;
  messages: number;
  responseTime: {
    average: number;
    unit: string;
  };
};

type HourlyActivityResponse = {
  date: string;
  data: HourlyActivityItem[];
  summary: {
    totalMessages: number;
    averageResponseTime: number;
  };
};

type WeeklyActivityItem = {
  date: string;
  dayOfWeek: string;
  messages: number;
  responseTime: {
    average: number;
    unit: string;
  };
};

type WeeklyActivityResponse = {
  period: {
    start: string;
    end: string;
  };
  data: WeeklyActivityItem[];
  summary: {
    totalMessages: number;
    averageResponseTime: number;
  };
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<TodayMetricsResponse["metrics"] | null>(null);  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [groups, setGroups] = useState<GroupOverview[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<HourlyActivityResponse | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityResponse | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await getTodayMetrics();
      if (res?.metrics) setMetrics(res.metrics);
    };
    fetchMetrics();
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      const result = await getAlerts();
      setAlerts(result);
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      const res = await getGroupsOverview();
      setGroups(res);
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchHourly = async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await getActivityHourly(today);
      if (res) setHourlyActivity(res);
    };
    fetchHourly();
  }, []);

  useEffect(() => {
    const fetchWeekly = async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6); // últimos 7 dias
      const res = await getActivityWeekly(
        start.toISOString().split("T")[0],
        end.toISOString().split("T")[0]
      );
      if (res) setWeeklyActivity(res);
    };
    fetchWeekly();
  }, []);

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
          {hourlyActivity && (
            <ActivityChart
              title="Atividade por Horário (Hoje)"
              data={hourlyActivity.data.map(item => ({
                name: item.hour,
                value: item.messages,
                responseTime: item.responseTime.average
              }))}
              type="area"
            />
          )}
          {weeklyActivity && (
            <ActivityChart
              title="Mensagens por Dia da Semana"
              data={weeklyActivity.data.map(item => ({
                name: item.dayOfWeek,
                value: item.messages
              }))}
              type="bar"
            />
          )}
        </div>
      </div>

      {/* Tabela de Grupos */}
      <GroupsTable groups={groups} />
    </div>
  );
}
