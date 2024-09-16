import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export async function fetchSummaryData(timeRange: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/summary`, {
      params: { timeRange },
      ...getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching summary data:", error);
    throw new Error("Failed to fetch summary data");
  }
}

export async function fetchProductionData(timeRange: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/production`, {
      params: { timeRange },
      ...getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching production data:", error);
    throw new Error("Failed to fetch production data");
  }
}

export async function fetchSalesData(timeRange: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/dashboard/sales`, {
      params: { timeRange },
      ...getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching sales data:", error);
    throw new Error("Failed to fetch sales data");
  }
}

export async function fetchInventoryData() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/dashboard/inventory`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    throw new Error("Failed to fetch inventory data");
  }
}

export async function fetchQualityIssuesData(timeRange: string) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/dashboard/quality-issues`,
      {
        params: { timeRange },
        ...getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching quality issues data:", error);
    throw new Error("Failed to fetch quality issues data");
  }
}

interface UserProfile {
  permissions: string[];
}

// Modificamos aquí para transformar los strings en objetos Permission[]
export const fetchUserProfile = async () => {
  try {
    const token = Cookies.get("token");
    if (!token) {
      throw new Error("No token found");
    }

    const response = await axios.get<UserProfile>(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Mapea el array de strings a objetos Permission
    return response.data.permissions.map((permission) => ({
      name: permission, // Asumimos que los strings son los nombres de los permisos
      granted: true, // Puedes ajustar esto según la lógica de tu backend
    }));
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
