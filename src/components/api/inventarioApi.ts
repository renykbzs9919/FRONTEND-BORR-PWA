import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// Interfaces
export interface Producto {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  sku: string;
  precioVenta: number;
  costo: number;
  unidadMedida: string;
  diasExpiracion: number;
}

export interface Stock {
  _id: string;
  productoId: Producto;
  stockActual: number;
  stockReservado: number;
  stockMinimo: number;
  stockMaximo: number;
  stockDisponible: number;
}

export interface LoteProduccion {
  _id: string;
  productoId: Producto;
  fechaProduccion: string;
  cantidadProducida: number;
  cantidadVendida: number;
  fechaVencimiento: string;
  costoLote: number;
  ubicacionLote: string;
  codigoLote: string;
  estado: "disponible" | "agotado" | "dañado" | "expirado";
  cantidadDisponible: number;
}

export interface MovimientoInventario {
  _id: string;
  movimientoId: string;
  productoId: Producto;
  loteProduccion: {
    _id: string;
    codigoLote: string;
  };
  tipoMovimiento: "ENTRADA" | "SALIDA" | "AJUSTE";
  razon: string;
  cantidad: number;
  fechaMovimiento: string;
  costoMovimiento: number;
  usuarioId: {
    _id: string;
    name: string;
    ci: number;
    email: string;
    contactInfo: {
      phone: number;
      address: string;
    };
  };
  origenDestino: string;
}

export interface Alerta {
  _id: string;
  productoId: {
    _id: string;
    nombre: string;
  };
  descripcion: string;
  prioridad: "alta" | "media" | "baja";
  fechaAlerta: string;
  estado: "pendiente" | "en_proceso" | "completada";
  alertaStockBajo?: boolean;
  alertaVencimiento?: boolean;
  alertaStockMaximo?: boolean;
}

// API functions
export const inventarioApi = {
  // Funciones para stocks
  getStocks: async (): Promise<Stock[]> => {
    const response = await axios.get<Stock[]>(
      `${API_BASE_URL}/stock`,
      getAuthHeaders()
    );
    return response.data;
  },
  updateStock: async (
    productoId: string,
    stockData: Partial<Stock>
  ): Promise<Stock> => {
    const response = await axios.put<Stock>(
      `${API_BASE_URL}/stock/${productoId}`,
      stockData,
      getAuthHeaders()
    );
    return response.data;
  },
  deleteStock: async (productoId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/stock/${productoId}`, getAuthHeaders());
  },

  // Funciones para lotes
  getLotes: async (): Promise<LoteProduccion[]> => {
    const response = await axios.get<LoteProduccion[]>(
      `${API_BASE_URL}/lotes`,
      getAuthHeaders()
    );
    return response.data;
  },
  createLote: async (
    loteData: Partial<LoteProduccion>
  ): Promise<LoteProduccion> => {
    const response = await axios.post<LoteProduccion>(
      `${API_BASE_URL}/lotes`,
      loteData,
      getAuthHeaders()
    );
    return response.data;
  },
  updateLote: async (
    loteId: string,
    loteData: Partial<LoteProduccion>
  ): Promise<LoteProduccion> => {
    const response = await axios.put<LoteProduccion>(
      `${API_BASE_URL}/lotes/${loteId}`,
      loteData,
      getAuthHeaders()
    );
    return response.data;
  },
  deleteLote: async (loteId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/lotes/${loteId}`, getAuthHeaders());
  },

  // Funciones para movimientos
  getMovimientos: async (): Promise<MovimientoInventario[]> => {
    const response = await axios.get<MovimientoInventario[]>(
      `${API_BASE_URL}/movimientos`,
      getAuthHeaders()
    );
    return response.data;
  },
  createMovimiento: async (
    movimientoData: Partial<MovimientoInventario>
  ): Promise<MovimientoInventario> => {
    const response = await axios.post<MovimientoInventario>(
      `${API_BASE_URL}/movimientos`,
      movimientoData,
      getAuthHeaders()
    );
    return response.data;
  },
  updateMovimiento: async (
    movimientoId: string,
    movimientoData: Partial<MovimientoInventario>
  ): Promise<MovimientoInventario> => {
    const response = await axios.put<MovimientoInventario>(
      `${API_BASE_URL}/movimientos/${movimientoId}`,
      movimientoData,
      getAuthHeaders()
    );
    return response.data;
  },
  deleteMovimiento: async (movimientoId: string): Promise<void> => {
    await axios.delete(
      `${API_BASE_URL}/movimientos/${movimientoId}`,
      getAuthHeaders()
    );
  },

  // Funciones para alertas
  getAlertas: async (): Promise<Alerta[]> => {
    const response = await axios.get<Alerta[]>(
      `${API_BASE_URL}/alertas`,
      getAuthHeaders()
    );
    return response.data;
  },
  generateAlertas: async (): Promise<Alerta[]> => {
    const response = await axios.post<Alerta[]>(
      `${API_BASE_URL}/alertas/generar`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },

  // Funciones para productos
  getProductos: async (): Promise<Producto[]> => {
    const response = await axios.get<Producto[]>(
      `${API_BASE_URL}/products`,
      getAuthHeaders()
    );
    return response.data;
  },
};
