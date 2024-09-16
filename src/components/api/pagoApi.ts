// /api/pagosApi.ts

import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export interface VentaPendiente {
  ventaId: string;
  fechaVenta: string;
  totalVenta: number;
  saldoVenta: number;
}

export interface VentaAplicada {
  ventaId: string;
  fechaVenta: string;
  totalVenta: number;
  saldoVenta: number;
}

export interface Pago {
  fechaPago: string;
  montoPagado: number;
  metodoPago: string;
  saldoRestante: number;
  ventasAplicadas: VentaAplicada[];
}

export interface NuevoPago {
  cliente: string;
  montoPagado: string | number; // Permitir string o number
  metodoPago: "efectivo" | "transferencia";
  fechaPago?: string;
  ventas?: string[];
}

export const pagosApi = {
  getVentasPendientesPorCliente: async (
    clienteId: string
  ): Promise<VentaPendiente[]> => {
    const response = await axios.get(
      `${BASE_URL}/pagos/cliente/${clienteId}/pendientes`,
      getAuthHeaders()
    );
    return response.data;
  },

  getPagosPorCliente: async (clienteId: string): Promise<Pago[]> => {
    const response = await axios.get(
      `${BASE_URL}/pagos/cliente/${clienteId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  crearPago: async (
    pago: NuevoPago
  ): Promise<{ fechaPago: string; message: string; pagosAplicados: VentaAplicada[] }> => {
    const response = await axios.post(
      `${BASE_URL}/pagos`,
      pago,
      getAuthHeaders()
    );
    return response.data;
  },
};
