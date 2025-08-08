import { API_URL } from "@/services/api";

export const getActivityWeekly = async (
  startDate: string,
  endDate: string,
  groupId?: string
) => {
  try {
    const url = new URL(`${API_URL}/activity/weekly`);
    url.searchParams.append("startDate", startDate);
    url.searchParams.append("endDate", endDate);
    if (groupId) url.searchParams.append("groupId", groupId);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Erro ao buscar atividade semanal");

    const data = await response.json();
    return data; // { period, data: [{ date, dayOfWeek, messages, responseTime }], summary }
  } catch (error) {
    console.error("Erro ao buscar dados de atividade semanal:", error);
    return null;
  }
};