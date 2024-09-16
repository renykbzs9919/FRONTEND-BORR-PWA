"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Users, Package, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";

const PdfTemplate = dynamic(
  () => import("@/components/pdf/clienteespecifico"),
  { ssr: false }
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  if (typeof window === "undefined") return {}; // Evitar ejecución en SSR
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

type FilterType = "range" | "month" | "year" | "week" | null;
type ReportType =
  | "productos"
  | "clientes"
  | "cliente-especifico"
  | "deudas-por-vendedor"
  | null;

interface Vendor {
  _id: string;
  name: string;
}

interface Client {
  _id: string;
  name: string;
}

interface Pago {
  fechaPago: string;
  montoPagado: number;
  metodoPago: string;
  saldoRestante: number;
  pagosAplicados: Array<{
    ventaId: string;
    fechaVenta: string;
    totalVenta: number;
    saldoPrevio: number;
    pagoAplicado: number;
    saldoRestante: number;
  }>;
}

interface Venta {
  ventaId: string;
  cliente: string;
  vendedor: string;
  productos: Array<{
    producto: string;
    cantidad: number;
    precio: number;
    lotes: Array<{
      loteId: string;
      cantidad: number;
      fechaVencimiento: string;
    }>;
  }>;
  totalVenta: number;
  pagoInicial: number;
  saldoVenta: number;
  fechaVenta: string;
  pagos: Pago[];
}

interface ClienteEspecificoReportData {
  ventas: Venta[];
  totalVendido: number;
  totalPagado: number;
  totalDeuda: number;
}

interface ProductosReportData {
  productosMasVendidos: Array<{
    _id: string;
    totalCantidadVendida: number;
    totalVenta: number;
    nombre: string;
  }>;
  margenGananciaPorProducto: Array<{
    _id: string;
    nombre: string;
    totalCosto: number;
    totalVenta: number;
    margenGanancia: number;
  }>;
  productosPerdidos: Array<{
    _id: string;
    nombre: string;
    cantidadPerdida: number;
  }>;
  productosSinMovimiento: Array<{
    _id: string;
    nombre: string;
    totalMovimientos: number;
  }>;
  productosEnRiesgoExpirar: Array<{
    _id: string;
    cantidadDisponible: number;
    fechaVencimiento: string;
    nombre: string;
  }>;
  rentabilidadPorProducto: Array<{
    nombre: string;
    rentabilidad: number;
  }>;
}

interface ClientesReportData {
  clientesMasCompran: Array<{
    _id: string;
    totalComprado: number;
    nombre: string;
    email: string;
  }>;
  clientesConDeuda: Array<{
    _id: string;
    totalDeuda: number;
    nombre: string;
    email: string;
  }>;
  pagosRealizados: any[];
  ventasConSaldoPendiente: Array<{
    _id: string;
    ventasPendientes: Array<{
      ventaId: string;
      fechaVenta: string;
      saldoPendiente: number;
      totalVenta: number;
    }>;
    nombre: string;
    email: string;
  }>;
  clientesInactivos: Array<{
    _id: string;
    ultimaCompra: string;
    nombre: string;
    email: string;
  }>;
  resumenGeneral: {
    totalClientes: number;
    totalDeudaGlobal: number;
    totalClientesSinDeuda: number;
  };
}

interface DeudasPorVendedorReportData {
  vendedor: string;
  totalDeuda: number;
  totalCobrado: number;
  clientes: Array<{
    cliente: string;
    totalDeuda: number;
    cobrado: number;
    ventas: Array<{
      fecha: string;
      totalVenta: number;
      saldoVenta: number;
      productos: string[];
    }>;
  }>;
}

type ReportData =
  | ProductosReportData
  | ClientesReportData
  | ClienteEspecificoReportData
  | DeudasPorVendedorReportData;

export default function ReportContent() {
  const [filterType, setFilterType] = useState<FilterType>(null);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [reportType, setReportType] = useState<ReportType>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchVendors();
    fetchClients();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/vendedores`,
        getAuthHeaders()
      );
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();
      setVendors(data.vendedores);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Error al cargar los vendedores. Por favor, intente de nuevo.");
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/clientes`,
        getAuthHeaders()
      );
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data.clientes);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Error al cargar los clientes. Por favor, intente de nuevo.");
    }
  };

  const resetFilters = () => {
    setMonth("");
    setYear("");
    setStartDate("");
    setEndDate("");
    setFilterType(null);
    setClientId("");
    setVendorId("");
    setReportData(null);
  };

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    let url = `${API_BASE_URL}/reportes/reporte-${reportType}`;
    let params = new URLSearchParams();

    if (reportType === "cliente-especifico") {
      params.append("clienteId", clientId);
    } else if (reportType === "deudas-por-vendedor") {
      url = `${url}/${vendorId}`;
    }

    switch (filterType) {
      case "range":
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        break;
      case "month":
        params.append("month", month);
        break;
      case "year":
        params.append("year", year);
        break;
      case "week":
        params.append("week", "true");
        break;
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    try {
      const response = await fetch(url, getAuthHeaders());
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }
      let data = await response.json();

      if (reportType === "cliente-especifico") {
        // Fetch payment data
        const paymentsResponse = await fetch(
          `${API_BASE_URL}/pagos/cliente/${clientId}`,
          getAuthHeaders()
        );
        if (!paymentsResponse.ok) {
          throw new Error("Error al obtener los datos de pagos");
        }
        const paymentsData: Pago[] = await paymentsResponse.json();

        // Map payments to sales
        data.ventas = data.ventas.map((venta) => {
          const ventaPagos = paymentsData.filter((pago) =>
            pago.pagosAplicados.some(
              (aplicado) => aplicado.ventaId === venta.ventaId
            )
          );
          return { ...venta, pagos: ventaPagos };
        });
      }

      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      setError(
        "Hubo un error al generar el reporte. Por favor, intente de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderDateFilter = () => {
    return (
      <>
        <div className="mt-4">
          <Label htmlFor="filter-select">Filtro de fecha</Label>
          <Select
            onValueChange={(value) => setFilterType(value as FilterType)}
            value={filterType || undefined}
          >
            <SelectTrigger id="filter-select">
              <SelectValue placeholder="Seleccionar filtro de fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="range">Rango de fechas</SelectItem>
              <SelectItem value="month">Mes específico</SelectItem>
              <SelectItem value="year">Año específico</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterType === "range" && (
          <>
            <div className="mt-4">
              <Label htmlFor="start-date">Fecha de inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="end-date">Fecha de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        {filterType === "month" && (
          <div className="mt-4">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        )}

        {filterType === "year" && (
          <div className="mt-4">
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              type="number"
              placeholder="YYYY"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        )}

        {filterType === "week" && (
          <p className="mt-4">Se generará el reporte para la última semana.</p>
        )}
      </>
    );
  };

  const renderProductosReport = (data: ProductosReportData) => {
    return (
      <Tabs defaultValue="productos-mas-vendidos">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="productos-mas-vendidos">Más Vendidos</TabsTrigger>
          <TabsTrigger value="margen-ganancia">Margen de Ganancia</TabsTrigger>
          <TabsTrigger value="productos-perdidos">
            Productos Perdidos
          </TabsTrigger>
          <TabsTrigger value="sin-movimiento">Sin Movimiento</TabsTrigger>
          <TabsTrigger value="riesgo-expirar">Riesgo de Expirar</TabsTrigger>
          <TabsTrigger value="rentabilidad">Rentabilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="productos-mas-vendidos">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad Vendida</TableHead>
                  <TableHead>Total Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.productosMasVendidos.map((producto) => (
                  <TableRow key={producto._id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.totalCantidadVendida}</TableCell>
                    <TableCell>Bs.{producto.totalVenta.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="margen-ganancia">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Total Costo</TableHead>
                  <TableHead>Total Venta</TableHead>
                  <TableHead>Margen de Ganancia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.margenGananciaPorProducto.map((producto) => (
                  <TableRow key={producto._id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>Bs.{producto.totalCosto.toFixed(2)}</TableCell>
                    <TableCell>Bs.{producto.totalVenta.toFixed(2)}</TableCell>
                    <TableCell>{producto.margenGanancia}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="productos-perdidos">
          {data.productosPerdidos.length === 0 ? (
            <p>No hay productos perdidos en este período.</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cantidad Perdida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productosPerdidos.map((producto) => (
                    <TableRow key={producto._id}>
                      <TableCell>{producto.nombre}</TableCell>
                      <TableCell>{producto.cantidadPerdida}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="sin-movimiento">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Total Movimientos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.productosSinMovimiento.map((producto) => (
                  <TableRow key={producto._id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.totalMovimientos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="riesgo-expirar">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad Disponible</TableHead>
                  <TableHead>Fecha de Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.productosEnRiesgoExpirar.map((producto) => (
                  <TableRow key={producto._id}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.cantidadDisponible}</TableCell>
                    <TableCell>
                      {new Date(producto.fechaVencimiento).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rentabilidad">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rentabilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rentabilidadPorProducto.map((producto, index) => (
                  <TableRow key={index}>
                    <TableCell>{producto.nombre}</TableCell>
                    <TableCell>{producto.rentabilidad}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    );
  };

  const renderClientesReport = (data: ClientesReportData) => {
    return (
      <Tabs defaultValue="clientes-mas-compran">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="clientes-mas-compran">Más Compran</TabsTrigger>
          <TabsTrigger value="clientes-con-deuda">Con Deuda</TabsTrigger>
          <TabsTrigger value="ventas-pendientes">Saldos Pendientes</TabsTrigger>
          <TabsTrigger value="clientes-inactivos">Inactivos</TabsTrigger>
          <TabsTrigger value="resumen-general">Resumen General</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes-mas-compran">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Comprado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clientesMasCompran.map((cliente) => (
                  <TableRow key={cliente._id}>
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>Bs.{cliente.totalComprado.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clientes-con-deuda">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Deuda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clientesConDeuda.map((cliente) => (
                  <TableRow key={cliente._id}>
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>Bs.{cliente.totalDeuda.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ventas-pendientes">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha Venta</TableHead>
                  <TableHead>Saldo Pendiente</TableHead>
                  <TableHead>Total Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ventasConSaldoPendiente.flatMap((cliente) =>
                  cliente.ventasPendientes.map((venta) => (
                    <TableRow key={`${cliente._id}-${venta.ventaId}`}>
                      <TableCell>{cliente.nombre}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>
                        {new Date(venta.fechaVenta).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        Bs.{venta.saldoPendiente.toFixed(2)}
                      </TableCell>
                      <TableCell>Bs.{venta.totalVenta.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clientes-inactivos">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Última Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clientesInactivos.map((cliente) => (
                  <TableRow key={cliente._id}>
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>
                      {new Date(cliente.ultimaCompra).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="resumen-general">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.resumenGeneral.totalClientes}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Deuda Global</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  Bs.{data.resumenGeneral.totalDeudaGlobal.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Clientes Sin Deuda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.resumenGeneral.totalClientesSinDeuda}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  const renderClienteEspecificoReport = (data: ClienteEspecificoReportData) => {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Vendido</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                Bs.{data.totalVendido.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Pagado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                Bs.{data.totalPagado.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                Bs.{data.totalDeuda.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total Venta</TableHead>
                <TableHead>Pago Inicial</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Pagos Aplicados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.ventas.map((venta) => (
                <TableRow key={venta.ventaId}>
                  <TableCell>
                    {new Date(venta.fechaVenta).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{venta.vendedor}</TableCell>
                  <TableCell>
                    {venta.productos
                      .map((p) => `${p.producto} (${p.cantidad})`)
                      .join(", ")}
                  </TableCell>
                  <TableCell>Bs.{venta.totalVenta.toFixed(2)}</TableCell>
                  <TableCell>Bs.{venta.pagoInicial.toFixed(2)}</TableCell>
                  <TableCell>Bs.{venta.saldoVenta.toFixed(2)}</TableCell>
                  <TableCell>
                    {venta.pagos.flatMap((pago) =>
                      pago.pagosAplicados.map((aplicado, index) => (
                        <div key={index}>
                          Fecha: {new Date(pago.fechaPago).toLocaleDateString()}
                          , Monto Pagado: Bs.{pago.montoPagado.toFixed(2)},
                          Aplicado: Bs.{aplicado.pagoAplicado.toFixed(2)}
                        </div>
                      ))
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="mt-4">
          <PdfTemplate
            ventas={data.ventas}
            totalVendido={data.totalVendido}
            totalPagado={data.totalPagado}
            totalDeuda={data.totalDeuda}
          />
        </div>
      </div>
    );
  };

  const renderDeudasPorVendedorReport = (data: DeudasPorVendedorReportData) => {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.vendedor}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Deuda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                Bs.{data.totalDeuda.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Cobrado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                Bs.{data.totalCobrado.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Total Deuda</TableHead>
                <TableHead>Cobrado</TableHead>
                <TableHead>Ventas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.clientes.map((cliente, index) => (
                <TableRow key={index}>
                  <TableCell>{cliente.cliente}</TableCell>
                  <TableCell>Bs.{cliente.totalDeuda.toFixed(2)}</TableCell>
                  <TableCell>Bs.{cliente.cobrado.toFixed(2)}</TableCell>
                  <TableCell>
                    {cliente.ventas.map((venta, ventaIndex) => (
                      <div key={ventaIndex}>
                        Fecha: {new Date(venta.fecha).toLocaleDateString()},
                        Total: Bs.{venta.totalVenta.toFixed(2)}, Saldo: Bs.
                        {venta.saldoVenta.toFixed(2)}, Productos:{" "}
                        {venta.productos.join(", ")}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setReportType("productos");
                resetFilters();
              }}
              className="w-full mb-4"
            >
              <Package className="mr-2 h-4 w-4" /> Seleccionar
            </Button>
            {reportType === "productos" && renderDateFilter()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setReportType("clientes");
                resetFilters();
              }}
              className="w-full mb-4"
            >
              <Users className="mr-2 h-4 w-4" /> Seleccionar
            </Button>
            {reportType === "clientes" && renderDateFilter()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de Cliente Específico</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setReportType("cliente-especifico");
                resetFilters();
              }}
              className="w-full mb-4"
            >
              <FileText className="mr-2 h-4 w-4" /> Seleccionar
            </Button>
            {reportType === "cliente-especifico" && (
              <>
                <div className="mt-4">
                  <Label htmlFor="client-select">Cliente</Label>
                  <Select onValueChange={setClientId} value={clientId}>
                    <SelectTrigger id="client-select">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {clientId && renderDateFilter()}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de Deudas por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setReportType("deudas-por-vendedor");
                resetFilters();
              }}
              className="w-full mb-4"
            >
              <DollarSign className="mr-2 h-4 w-4" /> Seleccionar
            </Button>
            {reportType === "deudas-por-vendedor" && (
              <>
                <div className="mt-4">
                  <Label htmlFor="vendor-select">Vendedor</Label>
                  <Select onValueChange={setVendorId} value={vendorId}>
                    <SelectTrigger id="vendor-select">
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {vendorId && renderDateFilter()}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Button
            onClick={generateReport}
            className="w-full"
            disabled={
              isLoading ||
              !reportType ||
              (reportType === "cliente-especifico" && !clientId) ||
              (reportType === "deudas-por-vendedor" && !vendorId)
            }
          >
            {isLoading ? "Generando..." : "Generar Reporte"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-500 text-center mb-4">
          <p>{error}</p>
        </div>
      )}

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado del Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            {reportType === "productos" &&
              renderProductosReport(reportData as ProductosReportData)}
            {reportType === "clientes" &&
              renderClientesReport(reportData as ClientesReportData)}
            {reportType === "cliente-especifico" &&
              renderClienteEspecificoReport(
                reportData as ClienteEspecificoReportData
              )}
            {reportType === "deudas-por-vendedor" &&
              renderDeudasPorVendedorReport(
                reportData as DeudasPorVendedorReportData
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
