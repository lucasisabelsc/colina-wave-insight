import { API_URL } from "@/services/api";

export const getAlerts = async () => {
  try {
    const response = await fetch(`${API_URL}/alerts`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar os alertas.");
    }

    const data = await response.json();
    return data.alerts || []; // Supondo que a API retorna { alerts: [...] }
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);
    return []; // Retorna array vazio em caso de erro
  }
};
