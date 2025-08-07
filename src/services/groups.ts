import { API_URL } from "@/services/api";

export const getGroupsOverview = async () => {
  try {
    const response = await fetch(`${API_URL}/groups/overview`);

    if (!response.ok) {
      throw new Error("Erro ao buscar dados dos grupos.");
    }

    const data = await response.json();
    return data.groups || [];
  } catch (error) {
    console.error("Erro ao buscar overview dos grupos:", error);
    return [];
  }
};
