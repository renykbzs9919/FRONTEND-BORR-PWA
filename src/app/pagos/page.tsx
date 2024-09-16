"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  pagosApi,
  VentaPendiente,
  Pago,
  NuevoPago,
} from "@/components/api/pagoApi";
import { salesApi, User } from "@/components/api/SalesApi";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DollarSign,
  Calendar,
  CheckCircle,
  User as UserIcon,
} from "lucide-react";

export default function PagosPage() {
  const [clientes, setClientes] = useState<User[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");
  const [ventasPendientes, setVentasPendientes] = useState<VentaPendiente[]>(
    []
  );
  const [pagosRealizados, setPagosRealizados] = useState<Pago[]>([]);
  const [nuevoPago, setNuevoPago] = useState<NuevoPago>({
    cliente: "",
    montoPagado: 0,
    metodoPago: "efectivo",
  });
  const [ventasSeleccionadas, setVentasSeleccionadas] = useState<string[]>([]);
  const [todasSeleccionadas, setTodasSeleccionadas] = useState(false);
  const [hayDeudasPendientes, setHayDeudasPendientes] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      cargarDatosCliente();
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    if (ventasSeleccionadas.length > 0) {
      actualizarMontoPago();
    } else {
      setNuevoPago((prev) => ({ ...prev, montoPagado: "" }));
    }
  }, [ventasSeleccionadas]);

  const cargarClientes = async () => {
    try {
      const clientesData = await salesApi.getClientes();
      setClientes(clientesData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Verifica si es un error de Axios
        toast({
          title: "Error",
          description:
            error.response?.data?.error || "No se pudieron cargar los clientes",
          variant: "destructive",
        });
      } else {
        // Maneja otros tipos de errores
        toast({
          title: "Error",
          description: "Ocurrió un error desconocido",
          variant: "destructive",
        });
      }
    }
  };

  const cargarDatosCliente = async () => {
    await cargarVentasPendientes(clienteSeleccionado);
    await cargarPagosRealizados(clienteSeleccionado);
  };

  const cargarVentasPendientes = async (clienteId: string) => {
    try {
      const ventasPendientesData = await pagosApi.getVentasPendientesPorCliente(
        clienteId
      );
      setVentasPendientes(ventasPendientesData);
      setVentasSeleccionadas([]);
      setTodasSeleccionadas(false);
      setHayDeudasPendientes(ventasPendientesData.length > 0);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "No se pudieron cargar las ventas pendientes",
        variant: "destructive",
      });
    }
  };

  const cargarPagosRealizados = async (clienteId: string) => {
    try {
      const pagosRealizadosData = await pagosApi.getPagosPorCliente(clienteId);
      setPagosRealizados(pagosRealizadosData);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "No se pudieron cargar los pagos realizados",
        variant: "destructive",
      });
    }
  };

  const handleClienteChange = (value: string) => {
    setClienteSeleccionado(value);
    setNuevoPago({ ...nuevoPago, cliente: value, montoPagado: 0 });
  };

  const handleVentaSelect = (ventaId: string, isChecked: boolean) => {
    if (isChecked) {
      setVentasSeleccionadas([...ventasSeleccionadas, ventaId]);
    } else {
      setVentasSeleccionadas(
        ventasSeleccionadas.filter((id) => id !== ventaId)
      );
    }
  };

  const handleSelectAllVentas = (isChecked: boolean) => {
    setTodasSeleccionadas(isChecked);
    if (isChecked) {
      setVentasSeleccionadas(ventasPendientes.map((venta) => venta.ventaId));
    } else {
      setVentasSeleccionadas([]);
    }
  };

  const actualizarMontoPago = () => {
    const montoTotal = ventasPendientes
      .filter((venta) => ventasSeleccionadas.includes(venta.ventaId))
      .reduce((total, venta) => total + venta.saldoVenta, 0);
    setNuevoPago((prev) => ({ ...prev, montoPagado: montoTotal.toFixed(2) }));
  };

  const handleMontoPagadoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setNuevoPago((prev) => ({
        ...prev,
        montoPagado: value === "" ? 0 : parseFloat(value), // Convertir a número
      }));
    }
  };

  const handlePagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pagoData = {
        ...nuevoPago,
        montoPagado: parseFloat(nuevoPago.montoPagado),
        ventas: ventasSeleccionadas,
      };
      const resultado = await pagosApi.crearPago(pagoData);
      toast({
        title: "Pago realizado",
        description: resultado.message,
      });
      await cargarDatosCliente();
      setNuevoPago({
        cliente: clienteSeleccionado,
        montoPagado: "",
        metodoPago: "efectivo",
      });
      setVentasSeleccionadas([]);
      setTodasSeleccionadas(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "No se pudo realizar el pago",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Pagos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Cliente</CardTitle>
          <CardDescription>
            Elija un cliente para ver su historial de pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={clienteSeleccionado}
            onValueChange={handleClienteChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente._id} value={cliente._id}>
                  {cliente.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {clienteSeleccionado && (
        <>
          {hayDeudasPendientes && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Ventas Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={todasSeleccionadas}
                      onCheckedChange={handleSelectAllVentas}
                    />
                    <Label htmlFor="select-all">Seleccionar todas</Label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ventasPendientes.map((venta) => (
                      <Card key={venta.ventaId} className="bg-secondary">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">
                            Venta {venta.ventaId.slice(-4)}
                          </CardTitle>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {venta.saldoVenta.toFixed(2)} Bs
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Fecha:{" "}
                            {format(new Date(venta.fechaVenta), "dd/MM/yyyy")}
                          </p>
                          <div className="mt-4 flex items-center space-x-2">
                            <Checkbox
                              id={`select-${venta.ventaId}`}
                              checked={ventasSeleccionadas.includes(
                                venta.ventaId
                              )}
                              onCheckedChange={(checked) =>
                                handleVentaSelect(
                                  venta.ventaId,
                                  checked as boolean
                                )
                              }
                            />
                            <Label htmlFor={`select-${venta.ventaId}`}>
                              Seleccionar para pago
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Realizar Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePagoSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="montoPagado">Monto a Pagar</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="montoPagado"
                            type="text"
                            inputMode="decimal"
                            value={nuevoPago.montoPagado}
                            onChange={handleMontoPagadoChange}
                            className="pl-9"
                            readOnly={ventasSeleccionadas.length > 0}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="metodoPago">Método de Pago</Label>
                        <Select
                          value={nuevoPago.metodoPago}
                          onValueChange={(value) =>
                            setNuevoPago({
                              ...nuevoPago,
                              metodoPago: value as "efectivo" | "transferencia",
                            })
                          }
                        >
                          <SelectTrigger id="metodoPago">
                            <SelectValue placeholder="Seleccione método de pago" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="transferencia">
                              Transferencia
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        !nuevoPago.montoPagado ||
                        parseFloat(nuevoPago.montoPagado) <= 0
                      }
                    >
                      Realizar Pago
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagosRealizados.length > 0 ? (
                  pagosRealizados.map((pago, index) => (
                    <Card key={index} className="bg-primary/5">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                          Pago del{" "}
                          {format(new Date(pago.fechaPago), "dd/MM/yyyy HH:mm")}
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-2xl font-bold">
                                {pago.montoPagado.toFixed(2)} Bs
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Método: {pago.metodoPago}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">Saldo restante:</p>
                              <p className="text-lg font-semibold">
                                {pago.saldoRestante.toFixed(2)} Bs
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Ventas aplicadas:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {pago.pagosAplicados &&
                              pago.pagosAplicados.length > 0 ? (
                                pago.pagosAplicados.map((aplicado, idx) => (
                                  <li key={idx}>
                                    Venta {aplicado.ventaId.slice(-4)} -{" "}
                                    {format(
                                      new Date(aplicado.fechaVenta),
                                      "dd/MM/yyyy"
                                    )}{" "}
                                    - Total: {aplicado.totalVenta.toFixed(2)} Bs
                                    - Saldo Anterior:{" "}
                                    {aplicado.saldoPrevio.toFixed(2)} Bs - Pago
                                    Aplicado: {aplicado.pagoAplicado.toFixed(2)}{" "}
                                    Bs - Saldo restante:{" "}
                                    {aplicado.saldoRestante.toFixed(2)} Bs
                                  </li>
                                ))
                              ) : (
                                <li>
                                  No hay información detallada de ventas
                                  aplicadas
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground">
                    <UserIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2">
                      Este cliente no tiene pagos registrados.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
