import { MetricCard } from "@/components/MetricCard";
import { AlertCard } from "@/components/AlertCard";
import { ActivityChart } from "@/components/ActivityChart";
import { GroupsTable } from "@/components/GroupsTable";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  AlertTriangle,
  Zap,
  RefreshCw
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "@/services/alerts";
import { getTodayMetrics } from "@/services/metricsToday";
import { getGroupsOverview } from "@/services/groups";
import { getActivityHourly } from "@/services/hourly";
import { getActivityWeekly } from "@/services/weekly";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // se não tiver, dá pra trocar por <div className="h-... animate-pulse bg-muted rounded" />

// === Config de refetch (ms) ===
const REFETCH = {
  metrics: 600_000,        // 10min
  alerts: 600_000,         // 10min
  groups: 600_000,         // 10min
  hourly: 600_000,         // 10min
  weekly: 600_000,         // 10min
};

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
      change: { value: number; type: "increase" | "decrease" };
    };
    averageResponseTime: {
      value: number;
      unit: string;
      change: { value: number; type: "increase" | "decrease" };
    };
    activeGroups: {
      value: number;
      change: { value: number; type: "increase" | "decrease" };
    };
    waitingClients: {
      value: number;
      change: { value: number; type: "increase" | "decrease" };
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
  responseTime: { average: number; unit: string };
};
type HourlyActivityResponse = {
  date: string;
  data: HourlyActivityItem[];
  summary: { totalMessages: number; averageResponseTime: number };
};

type WeeklyActivityItem = {
  date: string;
  dayOfWeek: string;
  messages: number;
  responseTime: { average: number; unit: string };
};
type WeeklyActivityResponse = {
  period: { start: string; end: string };
  data: WeeklyActivityItem[];
  summary: { totalMessages: number; averageResponseTime: number };
};

export default function Dashboard() {
  // Datas derivadas (mantidas aqui para as queries)
  const today = new Date().toISOString().split("T")[0];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startDate = start.toISOString().split("T")[0];
  const endDate = end.toISOString().split("T")[0];

  // Metrics
  const {
    data: metricsRes,
    isLoading: metricsLoading,
    isFetching: metricsFetching,
    refetch: refetchMetrics,
  } = useQuery<TodayMetricsResponse>({
    queryKey: ["todayMetrics"],
    queryFn: getTodayMetrics,
    refetchInterval: REFETCH.metrics,
  });
  const metrics = metricsRes?.metrics ?? null;

  // Alerts
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    isFetching: alertsFetching,
    refetch: refetchAlerts,
  } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: getAlerts,
    refetchInterval: REFETCH.alerts,
  });

  // Groups overview
  const {
    data: groups = [],
    isLoading: groupsLoading,
    isFetching: groupsFetching,
    refetch: refetchGroups,
  } = useQuery<GroupOverview[]>({
    queryKey: ["groupsOverview"],
    queryFn: getGroupsOverview,
    refetchInterval: REFETCH.groups,
  });

  // Hourly activity (hoje)
  const {
    data: hourlyActivity,
    isLoading: hourlyLoading,
    isFetching: hourlyFetching,
    refetch: refetchHourly,
  } = useQuery<HourlyActivityResponse | null>({
    queryKey: ["activityHourly", today],
    queryFn: () => getActivityHourly(today),
    refetchInterval: REFETCH.hourly,
  });

  // Weekly activity (últimos 7 dias)
  const {
    data: weeklyActivity,
    isLoading: weeklyLoading,
    isFetching: weeklyFetching,
    refetch: refetchWeekly,
  } = useQuery<WeeklyActivityResponse | null>({
    queryKey: ["activityWeekly", startDate, endDate],
    queryFn: () => getActivityWeekly(startDate, endDate),
    refetchInterval: REFETCH.weekly,
  });

  const anyFetching = metricsFetching || alertsFetching || groupsFetching || hourlyFetching || weeklyFetching;

  const handleRefresh = async () => {
    await Promise.all([
      refetchMetrics(),
      refetchAlerts(),
      refetchGroups(),
      refetchHourly(),
      refetchWeekly(),
    ]);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            Dashboard WhatsApp Analytics
          </h1>

          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={anyFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${anyFetching ? "animate-spin" : ""}`} />
            {anyFetching ? "Atualizando..." : "Atualizar agora"}
          </Button>
        </div>

        <p className="text-muted-foreground">
          Monitoramento em tempo real dos grupos WhatsApp do Studio Colina
        </p>
      </div>

      {/* Métricas Principais */}
      {metrics ? (
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
      ) : (
        // Skeleton das métricas
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border bg-card shadow-card">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
              <div className="mt-4 flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
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

          {alertsLoading ? (
            // Skeleton de alertas
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card shadow-card space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-9 w-full" />
              </div>
            ))
          ) : (
            alerts.map((alert, index) => <AlertCard key={index} {...alert} />)
          )}
        </div>

        {/* Gráficos - 2/3 da tela */}
        <div className="lg:col-span-2 space-y-6">
          {hourlyLoading ? (
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-60 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            hourlyActivity && (
              <ActivityChart
                title="Atividade por Horário (Hoje)"
                data={hourlyActivity.data.map((item) => ({
                  name: item.hour,
                  value: item.messages,
                  responseTime: item.responseTime.average,
                }))}
                type="area"
              />
            )
          )}

          {weeklyLoading ? (
            <div className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-72 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            weeklyActivity && (
              <ActivityChart
                title="Mensagens por Dia da Semana"
                data={weeklyActivity.data.map((item) => ({
                  name: item.dayOfWeek,
                  value: item.messages,
                }))}
                type="bar"
              />
            )
          )}
        </div>
      </div>

      {/* Tabela de Grupos */}
      {groupsLoading ? (
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-48 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <GroupsTable groups={groups} />
      )}
    </div>
  );
}