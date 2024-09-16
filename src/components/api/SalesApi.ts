// /api/SalesApi.ts

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
}

export interface ProductoLote {
  _id: string;
  codigoLote: string;
}

export interface ProductoVenta {
  productoId: {
    _id: string;
    nombre: string;
  };
  cantidad: number;
  precioUnitario: number;
  lotes: {
    loteId: ProductoLote;
    cantidad: number;
    _id: string;
  }[];
  _id: string;
}

export interface Venta {
  _id: string;
  cliente: User;
  vendedor: User | null;
  productos: ProductoVenta[];
  totalVenta: number;
  fechaVenta: string;
  estado: "pendiente" | "completada" | "cancelada";
  saldoVenta: number;
  pagoInicial: number;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

export interface Producto {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: {
    _id: string;
    nombre: string;
  };
  sku: string;
  precioVenta: number;
  costo: number;
  unidadMedida: string;
  diasExpiracion: number;
}

export interface Lote {
  _id: string;
  productoId: Producto;
  fechaProduccion: string;
  cantidadProducida: number;
  cantidadVendida: number;
  fechaVencimiento: string;
  costoLote: number;
  ubicacionLote: string;
  codigoLote: string;
  estado: "disponible" | "agotado" | "dañado";
  cantidadDisponible: number;
}

export interface Parametro {
  _id: string;
  nombre: string;
  valor: number;
  descripcion: string;
}

export const salesApi = {
  getVentas: async (): Promise<Venta[]> => {
    const response = await axios.get(`${BASE_URL}/ventas`, getAuthHeaders());
    return response.data.ventas;
  },

  createVenta: async (
    ventaData: Omit<Venta, "_id" | "createdAt" | "updatedAt">
  ): Promise<Venta> => {
    const response = await axios.post(
      `${BASE_URL}/ventas`,
      ventaData,
      getAuthHeaders()
    );
    return response.data;
  },

  updateVenta: async (
    id: string,
    ventaData: Partial<Venta>
  ): Promise<Venta> => {
    const response = await axios.put(
      `${BASE_URL}/ventas/${id}`,
      ventaData,
      getAuthHeaders()
    );
    return response.data;
  },

  deleteVenta: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(
      `${BASE_URL}/ventas/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },

  getClientes: async (): Promise<User[]> => {
    const response = await axios.get(
      `${BASE_URL}/users/clientes`,
      getAuthHeaders()
    );
    return response.data.clientes;
  },

  getVendedores: async (): Promise<User[]> => {
    const response = await axios.get(
      `${BASE_URL}/users/vendedores`,
      getAuthHeaders()
    );
    return response.data.vendedores;
  },

  getProductos: async (): Promise<Producto[]> => {
    const response = await axios.get(`${BASE_URL}/products`, getAuthHeaders());
    return response.data;
  },

  getLotes: async (): Promise<Lote[]> => {
    const response = await axios.get(`${BASE_URL}/lotes`, getAuthHeaders());
    return response.data;
  },

  getLotesPorProducto: async (productoId: string): Promise<Lote[]> => {
    const response = await axios.get(
      `${BASE_URL}/lotes/producto/${productoId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  getParametros: async (): Promise<Parametro[]> => {
    const response = await axios.get(
      `${BASE_URL}/parametros`,
      getAuthHeaders()
    );
    return response.data;
  },
};
