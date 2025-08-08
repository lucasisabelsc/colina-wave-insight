import { API_URL } from "@/services/api";


export const getActivityHourly = async (date?: string) => {
  try {
    const url = new URL(`${API_URL}/activity/hourly`);
    if (date) url.searchParams.append("date", date); // opcional

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Erro ao buscar atividade por hora");

    const data = await response.json();
    return data; // { date, data: [{ hour, messages, responseTime }], summary }
  } catch (error) {
    console.error("Erro ao buscar dados de atividade horária:", error);
    return null;
  }
};