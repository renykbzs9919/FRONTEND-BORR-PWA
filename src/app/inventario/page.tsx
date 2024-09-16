/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import moment from "moment-timezone";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Package,
  Boxes,
  ArrowRightLeft,
  Bell,
  Download,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  inventarioApi,
  Stock,
  LoteProduccion,
  MovimientoInventario,
  Alerta,
  Producto,
} from "@/components/api/inventarioApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const stockSchema = z.object({
  productoId: z.string().nonempty("El producto es requerido"),
  stockActual: z.number().min(0, "El stock actual no puede ser negativo"),
  stockReservado: z.number().min(0, "El stock reservado no puede ser negativo"),
  stockMinimo: z.number().min(0, "El stock mínimo no puede ser negativo"),
  stockMaximo: z.number().min(0, "El stock máximo no puede ser negativo"),
});

const loteProduccionSchema = z.object({
  productoId: z.string().nonempty("El producto es requerido"),
  cantidadProducida: z.number().min(1, "La cantidad debe ser mayor a 0"),
  ubicacionLote: z.string().nonempty("La ubicación es requerida"),
  fechaProduccion: z
    .date()
    .max(new Date(), "La fecha no puede ser mayor a hoy"),
});

type StockFormValues = z.infer<typeof stockSchema>;
type LoteFormValues = z.infer<typeof loteProduccionSchema>;

export default function InventoryManagementPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [lotes, setLotes] = useState<LoteProduccion[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isLoteDialogOpen, setIsLoteDialogOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState({
    stocks: "",
    lotes: "",
    movimientos: "",
    alertas: "",
  });
  const [activeTab, setActiveTab] = useState<
    "stocks" | "lotes" | "movimientos" | "alertas"
  >("stocks");
  const { toast } = useToast();

  const stockForm = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      productoId: "",
      stockActual: 0,
      stockReservado: 0,
      stockMinimo: 0,
      stockMaximo: 0,
    },
  });

  const loteForm = useForm<LoteFormValues>({
    resolver: zodResolver(loteProduccionSchema),
    defaultValues: {
      productoId: "",
      cantidadProducida: 0,
      ubicacionLote: "",
      fechaProduccion: new Date(),
    },
  });
  const fetchInitialData = async () => {
    try {
      const [
        stocksData,
        lotesData,
        movimientosData,
        alertasData,
        productosData,
      ] = await Promise.all([
        inventarioApi.getStocks(),
        inventarioApi.getLotes(),
        inventarioApi.getMovimientos(),
        inventarioApi.getAlertas(),
        inventarioApi.getProductos(),
      ]);

      setStocks(stocksData);
      setLotes(lotesData);
      setMovimientos(movimientosData);
      setAlertas(alertasData);
      setProductos(productosData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Error al cargar los datos iniciales. Por favor, recargue la página.",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (isStockDialogOpen) {
      stockForm.reset();
    }
  }, [isStockDialogOpen, stockForm]);

  useEffect(() => {
    if (isLoteDialogOpen) {
      loteForm.reset();
    }
  }, [isLoteDialogOpen, loteForm]);

  const onSubmitStock = async (data: StockFormValues) => {
    try {
      const response = await inventarioApi.updateStock(data.productoId, {
        stockActual: data.stockActual,
        stockReservado: data.stockReservado,
        stockMinimo: data.stockMinimo,
        stockMaximo: data.stockMaximo,
      });
      toast({
        title: "Éxito",
        description: "Stock actualizado correctamente",
      });
      console.log(response);
      fetchInitialData();
      setIsStockDialogOpen(false);
      stockForm.reset();
    } catch (error) {
      console.error("Error saving stock:", error);
      toast({
        title: "Error",
        description: "Error al guardar stock. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const onSubmitLote = async (data: LoteFormValues) => {
    try {
      const producto = productos.find((p) => p._id === data.productoId);
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      const loteData: Partial<LoteProduccion> = {
        productoId: producto,
        cantidadProducida: data.cantidadProducida,
        ubicacionLote: data.ubicacionLote,
        fechaProduccion: moment(data.fechaProduccion).format("YYYY-MM-DD"), // Convertir a string
      };
      await inventarioApi.createLote(loteData);
      toast({
        title: "Éxito",
        description: "Lote de producción creado correctamente",
      });
      fetchInitialData();
      setIsLoteDialogOpen(false);
      loteForm.reset();
    } catch (error) {
      console.error("Error saving lote:", error);
      toast({
        title: "Error",
        description: "Error al guardar lote. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStock = async (productoId: string) => {
    try {
      await inventarioApi.deleteStock(productoId);
      fetchInitialData();
      toast({
        title: "Éxito",
        description: "Stock eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting stock:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Error al eliminar stock. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLote = async (loteId: string) => {
    try {
      await inventarioApi.deleteLote(loteId);
      fetchInitialData();
      toast({
        title: "Éxito",
        description: "Lote eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting lote:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Error al eliminar lote. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMovimiento = async (movimientoId: string) => {
    try {
      await inventarioApi.deleteMovimiento(movimientoId);
      fetchInitialData();
      toast({
        title: "Éxito",
        description: "Movimiento eliminado correctamente",
      });
    } catch (error) {
      console.error("Error deleting movimiento:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Error al eliminar movimiento. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAlertas = async () => {
    try {
      await inventarioApi.generateAlertas();
      toast({
        title: "Éxito",
        description: "Alertas generadas correctamente",
      });
      fetchInitialData();
    } catch (error) {
      console.error("Error generating alertas:", error);
      toast({
        title: "Error",
        description:
          (error as Error).message ||
          "Error al generar alertas. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (format: "pdf" | "csv") => {
    console.log(`Descargando en formato ${format}`);
    toast({
      title: "Información",
      description: "La funcionalidad de descarga aún no está implementada.",
    });
  };

  const filteredStocks = stocks.filter((stock) =>
    stock.productoId.nombre
      .toLowerCase()
      .includes(searchTerms.stocks.toLowerCase())
  );

  const filteredLotes = lotes.filter((lote) =>
    lote.productoId.nombre
      .toLowerCase()
      .includes(searchTerms.lotes.toLowerCase())
  );

  const filteredMovimientos = movimientos.filter((movimiento) =>
    movimiento.productoId.nombre
      .toLowerCase()
      .includes(searchTerms.movimientos.toLowerCase())
  );

  const filteredAlertas = alertas.filter((alerta) =>
    alerta.productoId.nombre
      .toLowerCase()
      .includes(searchTerms.alertas.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        Gestión de Inventario
      </h1>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button
            onClick={() => setActiveTab("stocks")}
            variant={activeTab === "stocks" ? "default" : "outline"}
            className="flex items-center"
          >
            <Package className="mr-2 h-4 w-4" />
            Stocks
          </Button>
          <Button
            onClick={() => setActiveTab("lotes")}
            variant={activeTab === "lotes" ? "default" : "outline"}
            className="flex items-center"
          >
            <Boxes className="mr-2 h-4 w-4" />
            Lotes
          </Button>
          <Button
            onClick={() => setActiveTab("movimientos")}
            variant={activeTab === "movimientos" ? "default" : "outline"}
            className="flex items-center"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Movimientos
          </Button>
          <Button
            onClick={() => setActiveTab("alertas")}
            variant={activeTab === "alertas" ? "default" : "outline"}
            className="flex items-center"
          >
            <Bell className="mr-2 h-4 w-4" />
            Alertas
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDownload("pdf")}>
              Descargar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload("csv")}>
              Descargar CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeTab === "stocks" && (
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl font-semibold text-primary">
              Stocks
            </CardTitle>
            <CardDescription>Gestiona los stocks de productos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Input
                placeholder="Buscar stocks..."
                value={searchTerms.stocks}
                onChange={(e) =>
                  setSearchTerms({ ...searchTerms, stocks: e.target.value })
                }
                className="max-w-sm"
              />
              <Dialog
                open={isStockDialogOpen}
                onOpenChange={setIsStockDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Stock
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Stock</DialogTitle>
                    <DialogDescription>
                      Ingrese los detalles del stock a agregar
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...stockForm}>
                    <form
                      onSubmit={stockForm.handleSubmit(onSubmitStock)}
                      className="space-y-4"
                    >
                      <FormField
                        control={stockForm.control}
                        name="productoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productos.map((producto) => (
                                  <SelectItem
                                    key={producto._id}
                                    value={producto._id}
                                  >
                                    {producto.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={stockForm.control}
                        name="stockActual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Actual</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={stockForm.control}
                        name="stockReservado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Reservado</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={stockForm.control}
                        name="stockMinimo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={stockForm.control}
                        name="stockMaximo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Máximo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Guardar Stock
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Stock Reservado</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead>Stock Máximo</TableHead>
                    <TableHead>Stock Disponible</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStocks.map((stock) => (
                    <TableRow key={stock._id}>
                      <TableCell className="font-medium">
                        {stock.productoId.nombre}
                      </TableCell>
                      <TableCell>{stock.stockActual}</TableCell>
                      <TableCell>{stock.stockReservado}</TableCell>
                      <TableCell>{stock.stockMinimo}</TableCell>
                      <TableCell>{stock.stockMaximo}</TableCell>
                      <TableCell>{stock.stockDisponible}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStock(stock._id)}
                          className="hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === "lotes" && (
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl font-semibold text-primary">
              Lotes de Producción
            </CardTitle>
            <CardDescription>Gestiona los lotes de producción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Input
                placeholder="Buscar lotes..."
                value={searchTerms.lotes}
                onChange={(e) =>
                  setSearchTerms({ ...searchTerms, lotes: e.target.value })
                }
                className="max-w-sm"
              />
              <Dialog
                open={isLoteDialogOpen}
                onOpenChange={setIsLoteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Lote
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Lote de Producción</DialogTitle>
                    <DialogDescription>
                      Ingrese los detalles del lote a agregar
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...loteForm}>
                    <form
                      onSubmit={loteForm.handleSubmit(onSubmitLote)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loteForm.control}
                        name="productoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Producto</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {productos.map((producto) => (
                                  <SelectItem
                                    key={producto._id}
                                    value={producto._id}
                                  >
                                    {producto.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loteForm.control}
                        name="cantidadProducida"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cantidad Producida</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loteForm.control}
                        name="fechaProduccion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Producción</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={
                                  field.value
                                    ? moment(field.value)
                                        .tz("America/La_Paz")
                                        .format("YYYY-MM-DD")
                                    : ""
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    moment
                                      .tz(e.target.value, "America/La_Paz")
                                      .toDate()
                                  )
                                }
                                max={moment
                                  .tz("America/La_Paz")
                                  .format("YYYY-MM-DD")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loteForm.control}
                        name="ubicacionLote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación del Lote</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        Guardar Lote
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Producto</TableHead>
                    <TableHead>Fecha Producción</TableHead>
                    <TableHead>Cantidad Producida</TableHead>
                    <TableHead>Cantidad Vendida</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Costo Lote</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Código Lote</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cantidad Disponible</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLotes.map((lote) => (
                    <TableRow key={lote._id}>
                      <TableCell className="font-medium">
                        {lote.productoId.nombre}
                      </TableCell>
                      <TableCell>
                        {new Date(lote.fechaProduccion).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{lote.cantidadProducida}</TableCell>
                      <TableCell>{lote.cantidadVendida}</TableCell>
                      <TableCell>
                        {new Date(lote.fechaVencimiento).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{lote.costoLote}</TableCell>
                      <TableCell>{lote.ubicacionLote}</TableCell>
                      <TableCell>{lote.codigoLote}</TableCell>
                      <TableCell>{lote.estado}</TableCell>
                      <TableCell>{lote.cantidadDisponible}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLote(lote._id)}
                          className="hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === "movimientos" && (
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl font-semibold text-primary">
              Movimientos de Inventario
            </CardTitle>
            <CardDescription>
              Visualiza los movimientos de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Input
                placeholder="Buscar movimientos..."
                value={searchTerms.movimientos}
                onChange={(e) =>
                  setSearchTerms({
                    ...searchTerms,
                    movimientos: e.target.value,
                  })
                }
                className="max-w-sm"
              />
            </div>
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Producto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Tipo Movimiento</TableHead>
                    <TableHead>Razón</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha Movimiento</TableHead>
                    <TableHead>Costo Movimiento</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Origen/Destino</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovimientos.map((movimiento) => (
                    <TableRow key={movimiento._id}>
                      <TableCell className="font-medium">
                        {movimiento.productoId?.nombre || "N/A"}
                      </TableCell>
                      <TableCell>
                        {movimiento.loteProduccion?.codigoLote || "N/A"}
                      </TableCell>
                      <TableCell>{movimiento.tipoMovimiento}</TableCell>
                      <TableCell>{movimiento.razon}</TableCell>
                      <TableCell>{movimiento.cantidad}</TableCell>
                      <TableCell>
                        {new Date(movimiento.fechaMovimiento).toLocaleString()}
                      </TableCell>
                      <TableCell>{movimiento.costoMovimiento}</TableCell>
                      <TableCell>
                        {movimiento.usuarioId?.name || "N/A"}
                      </TableCell>
                      <TableCell>{movimiento.origenDestino}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMovimiento(movimiento._id)}
                          className="hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {activeTab === "alertas" && (
        <Card className="shadow-lg">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-2xl font-semibold text-primary">
              Alertas de Inventario
            </CardTitle>
            <CardDescription>
              Visualiza y gestiona las alertas de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <Input
                placeholder="Buscar alertas..."
                value={searchTerms.alertas}
                onChange={(e) =>
                  setSearchTerms({ ...searchTerms, alertas: e.target.value })
                }
                className="max-w-sm"
              />
              <Button
                onClick={handleGenerateAlertas}
                className="flex items-center"
              >
                <Bell className="mr-2 h-4 w-4" />
                Generar Alertas
              </Button>
            </div>
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Producto</TableHead>
                    <TableHead>Tipo Alerta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Fecha Alerta</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlertas.map((alerta) => (
                    <TableRow key={alerta._id}>
                      <TableCell className="font-medium">
                        {alerta.productoId?.nombre || "N/A"}
                      </TableCell>
                      <TableCell>
                        {alerta.alertaStockBajo
                          ? "Stock Bajo"
                          : alerta.alertaVencimiento
                          ? "Vencimiento"
                          : alerta.alertaStockMaximo
                          ? "Stock Maximo"
                          : "N/A"}
                      </TableCell>
                      <TableCell>{alerta.descripcion || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alerta.prioridad === "alta"
                              ? "destructive"
                              : alerta.prioridad === "media"
                              ? "outline"
                              : "default"
                          }
                        >
                          {alerta.prioridad || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(alerta.fechaAlerta).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alerta.estado === "pendiente"
                              ? "destructive"
                              : alerta.estado === "en_proceso"
                              ? "outline"
                              : "default"
                          }
                        >
                          {alerta.estado || "N/A"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
