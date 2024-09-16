// /api/ReporteApi.ts

import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export interface ContactInfo {
  phone: number;
  address: string;
}

export interface Permission {
  permission: string;
  granted: boolean;
  _id: string;
}

export interface User {
  _id: string;
  name: string;
  ci: number;
  email: string;
  birthdate: string;
  gender: string;
  role: string;
  permissions: Permission[];
  contactInfo: ContactInfo;
  failedLoginAttempts: number;
  accountLocked: boolean;
  sessions: any[];
  createdAt: string;
  updatedAt: string;
}

export const reporteApi = {
  getClientes: async (): Promise<User[]> => {
    const response = await axios.get(
      `${BASE_URL}/users/clientes`,
      getAuthHeaders()
    );
    return response.data.clientes;
  },
};
