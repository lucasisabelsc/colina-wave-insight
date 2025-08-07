import { API_URL } from "@/services/api";

export const getTodayMetrics = async () => {
  try {
    const response = await fetch(`${API_URL}/metrics/today`);

    if (!response.ok) {
      throw new Error("Erro ao buscar métricas do dia.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar métricas do dia:", error);
    return null;
  }
};
