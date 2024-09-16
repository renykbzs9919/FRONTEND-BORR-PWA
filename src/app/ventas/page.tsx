"use client";

import { useState, useEffect, useMemo } from "react";
import moment from "moment-timezone";
import {
  salesApi,
  Venta,
  User,
  Producto,
  Lote,
  Parametro,
} from "@/components/api/SalesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Minus,
  Package,
  Users,
  Eye,
  DollarSign,
  Calendar,
  ShoppingCart,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  List,
  FileText,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export default function SalesManagement() {
  const { toast } = useToast();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<User[]>([]);
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ventaAEliminar, setVentaAEliminar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"lista" | "nueva">("lista");
  const [showDeudaDialog, setShowDeudaDialog] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(
    null
  );

  // Nuevos estados para paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPagadas, setFilterPagadas] = useState(false);
  const [filterConSaldo, setFilterConSaldo] = useState(false);
  const [filterCliente, setFilterCliente] = useState("");

  const [nuevaVenta, setNuevaVenta] = useState<
    Omit<Venta, "_id" | "createdAt" | "updatedAt">
  >({
    cliente: "",
    vendedor: "",
    productos: [],
    pagoInicial: 0,
    totalVenta: 0,
    saldoVenta: 0,
    estado: "pendiente",
    notas: "",
    fechaVenta: moment.tz("America/La_Paz").format("YYYY-MM-DD"), // Inicializa con la fecha actual en América/La Paz
  });

  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(
    null
  );
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [
        ventasData,
        clientesData,
        vendedoresData,
        productosData,
        lotesData,
        parametrosData,
      ] = await Promise.all([
        salesApi.getVentas(),
        salesApi.getClientes(),
        salesApi.getVendedores(),
        salesApi.getProductos(),
        salesApi.getLotes(),
        salesApi.getParametros(),
      ]);
      setVentas(ventasData);
      setClientes(clientesData);
      setVendedores(vendedoresData);
      setProductos(productosData);
      setLotes(lotesData);
      setParametros(parametrosData);
    } catch (err) {
      setError("Error al cargar los datos iniciales");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "No se pudieron cargar los datos iniciales. Por favor, intente de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCrearVenta = async () => {
    try {
      const ventaData = {
        cliente: nuevaVenta.cliente,
        vendedor: nuevaVenta.vendedor,
        productos: nuevaVenta.productos.map((producto) => {
          const productoOriginal = productos.find(
            (p) => p._id === producto.productoId._id
          );
          const precioModificado =
            productoOriginal &&
            productoOriginal.precioVenta !== producto.precioUnitario;
          return {
            productoId: producto.productoId._id,
            cantidad: producto.cantidad,
            lotes: producto.lotes.map((lote) => ({
              loteId: lote.loteId._id,
              cantidad: lote.cantidad,
            })),
            ...(precioModificado && {
              precioUnitario: producto.precioUnitario,
            }),
          };
        }),
        pagoInicial: nuevaVenta.pagoInicial,
        fechaVenta: nuevaVenta.fechaVenta,
        notas: nuevaVenta.notas,
      };

      const response = await salesApi.createVenta(ventaData);
      const { message, venta, lotesUsados, advertenciaDeuda } = response;

      setVentas((prevVentas) => [...prevVentas, venta]);

      toast({
        title: "Venta creada exitosamente",
        description: message || "La venta se ha creado exitosamente",
      });

      if (advertenciaDeuda) {
        toast({
          variant: "destructive",
          title: "Advertencia de deuda",
          description: advertenciaDeuda,
        });
      }

      setNuevaVenta({
        cliente: "",
        vendedor: "",
        productos: [],
        pagoInicial: 0,
        totalVenta: 0,
        saldoVenta: 0,
        estado: "pendiente",
        notas: "",
        fechaVenta: new Date().toISOString(),
      });
      fetchInitialData();
    } catch (err) {
      console.error("Error al crear la venta:", err);
      toast({
        variant: "destructive",
        title: "Error al crear la venta",
        description:
          err.response?.data?.error || "Ocurrió un error al crear la venta.",
      });
    }
  };

  const handleEditarVenta = async (venta: Venta) => {
    try {
      const response = await salesApi.updateVenta(venta._id, venta);
      setVentas(ventas.map((v) => (v._id === venta._id ? response : v)));
      toast({
        title: "Venta actualizada exitosamente",
        description: response.message || `ID de la venta: ${venta._id}`,
      });
      setVentaSeleccionada(null);
      fetchInitialData();
    } catch (err) {
      console.error("Error al actualizar la venta:", err);
      toast({
        variant: "destructive",
        title: "Error al actualizar la venta",
        description:
          err.response?.data?.error ||
          "Ocurrió un error al actualizar la venta.",
      });
    }
  };

  const handleEliminarVenta = async (id: string) => {
    try {
      await salesApi.deleteVenta(id);
      setVentas(ventas.filter((v) => v._id !== id));
      toast({
        title: "Venta eliminada exitosamente",
        description: `ID de la venta: ${id}`,
      });
      setVentaAEliminar(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al eliminar la venta",
        description:
          err.response?.data?.error || "Ocurrió un error al eliminar la venta.",
      });
    }
  };

  const agregarProductoAVenta = (productoId: string) => {
    const productoSeleccionado = productos.find((p) => p._id === productoId);
    if (productoSeleccionado) {
      // Verificar si el producto ya está en la venta
      const productoExistente = nuevaVenta.productos.find(
        (p) => p.productoId._id === productoId
      );
      if (productoExistente) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Este producto ya ha sido agregado a la venta.",
        });
        return;
      }

      const lotesDisponibles = lotes.filter(
        (l) => l.productoId._id === productoId && l.cantidadDisponible > 0
      );
      if (lotesDisponibles.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Este producto no tiene stock disponible.",
        });
        return;
      }
      setNuevaVenta((prev) => ({
        ...prev,
        productos: [
          ...prev.productos,
          {
            productoId: {
              _id: productoSeleccionado._id,
              nombre: productoSeleccionado.nombre,
            },
            cantidad: 1,
            precioUnitario: productoSeleccionado.precioVenta,
            lotes: [],
            _id: Date.now().toString(),
          },
        ],
      }));
    }
  };

  const removerProductoDeVenta = (productoId: string) => {
    setNuevaVenta((prev) => ({
      ...prev,
      productos: prev.productos.filter((p) => p.productoId._id !== productoId),
    }));
  };

  const agregarLoteAProducto = (
    productoId: string,
    loteId: string,
    cantidad: number
  ) => {
    const lote = lotes.find((l) => l._id === loteId);
    if (!lote) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Lote no encontrado.",
      });
      return;
    }

    const producto = nuevaVenta.productos.find(
      (p) => p.productoId._id === productoId
    );
    if (!producto) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Producto no encontrado en la venta actual.",
      });
      return;
    }

    // Usar la cantidad del producto como cantidad inicial del lote
    const cantidadInicial = Math.min(
      producto.cantidad,
      lote.cantidadDisponible
    );

    if (cantidadInicial > lote.cantidadDisponible) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `La cantidad seleccionada (${cantidadInicial}) excede la cantidad disponible en el lote (${lote.cantidadDisponible}).`,
      });
      return;
    }

    setNuevaVenta((prev) => ({
      ...prev,
      productos: prev.productos.map((p) =>
        p.productoId._id === productoId
          ? {
              ...p,
              lotes: [
                ...p.lotes,
                {
                  loteId: {
                    _id: loteId,
                    codigoLote: lote.codigoLote,
                  },
                  cantidad: cantidadInicial,
                  _id: Date.now().toString(),
                },
              ],
            }
          : p
      ),
    }));
  };

  const actualizarCantidadProducto = (
    productoId: string,
    nuevaCantidad: number
  ) => {
    setNuevaVenta((prev) => ({
      ...prev,
      productos: prev.productos.map((p) =>
        p.productoId._id === productoId ? { ...p, cantidad: nuevaCantidad } : p
      ),
    }));
  };

  const actualizarPrecioProducto = (
    productoId: string,
    nuevoPrecio: number
  ) => {
    setNuevaVenta((prev) => ({
      ...prev,
      productos: prev.productos.map((p) =>
        p.productoId._id === productoId
          ? { ...p, precioUnitario: nuevoPrecio }
          : p
      ),
    }));
  };

  const calcularTotalVenta = (productos: Venta["productos"]) => {
    return productos.reduce(
      (total, producto) => total + producto.cantidad * producto.precioUnitario,
      0
    );
  };

  useEffect(() => {
    const totalVenta = calcularTotalVenta(nuevaVenta.productos);
    setNuevaVenta((prev) => ({
      ...prev,
      totalVenta,
      saldoVenta: totalVenta - prev.pagoInicial,
    }));
  }, [nuevaVenta.productos, nuevaVenta.pagoInicial]);

  const handleClienteChange = async (clienteId: string) => {
    const limiteDeudas =
      parametros.find((p) => p.nombre === "limite_Deudas_Cliente")?.valor || 0;
    const ventasPendientes = ventas.filter(
      (v) => v.cliente._id === clienteId && v.estado === "pendiente"
    );
    const deudaTotalCliente = ventasPendientes.reduce(
      (total, venta) => total + venta.saldoVenta,
      0
    );

    if (deudaTotalCliente > limiteDeudas) {
      setClienteSeleccionado(clienteId);
      setShowDeudaDialog(true);
    } else {
      setNuevaVenta((prev) => ({ ...prev, cliente: clienteId }));
    }
  };

  // Lógica de filtrado y paginación
  const filteredVentas = useMemo(() => {
    return ventas.filter((venta) => {
      const matchesSearch =
        venta.cliente?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false ||
        venta._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;

      const matchesPagadas = !filterPagadas || venta.saldoVenta === 0;
      const matchesConSaldo = !filterConSaldo || venta.saldoVenta > 0;
      const matchesCliente =
        !filterCliente || venta.cliente?._id === filterCliente;

      return (
        matchesSearch && matchesPagadas && matchesConSaldo && matchesCliente
      );
    });
  }, [ventas, searchTerm, filterPagadas, filterConSaldo, filterCliente]);

  const paginatedVentas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVentas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVentas, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVentas.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-primary text-center">
        Gestión de Ventas
      </h1>

      <Card className="mb-8">
        <CardContent className="p-4 flex justify-center space-x-4">
          <Button
            variant={activeTab === "lista" ? "default" : "outline"}
            onClick={() => setActiveTab("lista")}
            className="flex items-center"
          >
            <List className="mr-2 h-4 w-4" />
            Lista de Ventas
          </Button>
          <Button
            variant={activeTab === "nueva" ? "default" : "outline"}
            onClick={() => setActiveTab("nueva")}
            className="flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </CardContent>
      </Card>

      {activeTab === "lista" && (
        <>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                <div className="w-full md:w-1/3">
                  <Label htmlFor="search" className="text-muted-foreground">
                    Buscar
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por cliente o ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="w-full md:w-1/3">
                  <Label
                    htmlFor="filterCliente"
                    className="text-muted-foreground"
                  >
                    Filtrar por Cliente
                  </Label>
                  <Select
                    value={filterCliente}
                    onValueChange={setFilterCliente}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los clientes</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente._id} value={cliente._id}>
                          {cliente.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-1/3 flex items-center space-x-2">
                  <Checkbox
                    id="filterPagadas"
                    checked={filterPagadas}
                    onCheckedChange={(checked) =>
                      setFilterPagadas(checked as boolean)
                    }
                  />
                  <Label htmlFor="filterPagadas">Ventas Pagadas</Label>
                  <Checkbox
                    id="filterConSaldo"
                    checked={filterConSaldo}
                    onCheckedChange={(checked) =>
                      setFilterConSaldo(checked as boolean)
                    }
                  />
                  <Label htmlFor="filterConSaldo">Ventas con Saldo</Label>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ventas por página" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50, 100].map((number) => (
                      <SelectItem key={number} value={number.toString()}>
                        {number} por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedVentas.map((venta, index) => (
              <Card
                key={venta._id || `venta-${index}`}
                className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader className="bg-secondary/10">
                  <CardTitle className="flex justify-between items-center text-primary">
                    <span>
                      Venta #{venta._id ? venta._id.substring(0, 6) : "N/A"}
                    </span>
                    <Badge
                      variant={
                        venta.estado === "completada" ? "success" : "warning"
                      }
                      className="text-sm"
                    >
                      {venta.estado}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {venta.fechaVenta
                      ? new Date(venta.fechaVenta)
                          .toISOString()
                          .split("T")[0]
                          .split("-")
                          .reverse()
                          .join("-")
                      : "Fecha no disponible"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center text-muted-foreground">
                      <UserIcon className="mr-2 h-4 w-4 text-primary" />
                      Cliente: {venta.cliente?.name || "N/A"}
                    </p>
                    <p className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4 text-primary" />
                      Vendedor: {venta.vendedor?.name || "N/A"}
                    </p>
                    <p className="flex items-center text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                      Total: Bs.{(venta.totalVenta ?? 0).toFixed(2)}
                    </p>
                    <p className="flex items-center text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                      Pagado: Bs.{(venta.pagoInicial ?? 0).toFixed(2)}
                    </p>
                    <p className="flex items-center text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4 text-red-500" />
                      Saldo: Bs.{(venta.saldoVenta ?? 0).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between mt-auto bg-secondary/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVentaDetalle(venta)}
                    className="text-primary hover:text-primary-foreground hover:bg-primary"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVentaSeleccionada(venta)}
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVentaAEliminar(venta._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === "nueva" && (
        <Card className="shadow-lg">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="text-2xl text-primary">Nueva Venta</CardTitle>
            <CardDescription>Crea una nueva venta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="cliente" className="text-muted-foreground">
                  Cliente
                </Label>
                <Select
                  value={nuevaVenta.cliente}
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
              </div>
              <div>
                <Label htmlFor="vendedor" className="text-muted-foreground">
                  Vendedor
                </Label>
                <Select
                  onValueChange={(value) =>
                    setNuevaVenta({ ...nuevaVenta, vendedor: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor._id} value={vendedor._id}>
                        {vendedor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="producto" className="text-muted-foreground">
                Agregar Producto
              </Label>
              <Select onValueChange={(value) => agregarProductoAVenta(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto) => (
                    <SelectItem key={producto._id} value={producto._id}>
                      {producto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {nuevaVenta.productos.map((producto, index) => (
              <Card
                key={producto._id || `new-product-${index}`}
                className="p-4 bg-card shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-primary">
                    {producto.productoId.nombre}
                  </h4>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      removerProductoDeVenta(producto.productoId._id)
                    }
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                  <div>
                    <Label
                      htmlFor={`cantidad-${producto.productoId._id}`}
                      className="text-muted-foreground"
                    >
                      Cantidad
                    </Label>
                    <Input
                      id={`cantidad-${producto.productoId._id}`}
                      type="number"
                      value={producto.cantidad}
                      onChange={(e) => {
                        const nuevaCantidad = parseInt(e.target.value);

                        // Validar que el campo no esté vacío
                        if (!e.target.value) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description:
                              "El campo de cantidad no puede estar vacío.",
                          });
                          return;
                        }

                        // Validación para cantidades menores o iguales a 0
                        if (nuevaCantidad <= 0) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "La cantidad no puede ser 0 .",
                          });
                          return;
                        }

                        // Si la cantidad es válida, actualizar la cantidad del producto
                        actualizarCantidadProducto(
                          producto.productoId._id,
                          nuevaCantidad
                        );
                      }}
                      className="mt-1"
                      step="1" // permite solo números enteros
                      onKeyDown={(e) => {
                        // Prevenir ingreso de valores negativos y notación científica
                        if (e.key === "-" || e.key === "e") {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description:
                              "No se permiten valores negativos ni notaciones científicas.",
                          });
                          e.preventDefault(); // evita el ingreso de negativos o notación científica
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`precio-${producto.productoId._id}`}
                      className="text-muted-foreground"
                    >
                      Precio
                    </Label>
                    <Input
                      id={`precio-${producto.productoId._id}`}
                      type="number"
                      value={producto.precioUnitario}
                      onChange={(e) => {
                        const nuevoPrecio = parseFloat(e.target.value);

                        // Validar que el campo no esté vacío o con valores no válidos
                        if (!e.target.value) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description:
                              "El campo de precio no puede estar vacío.",
                          });
                          return;
                        }

                        // Validación para precios menores o iguales a 0
                        if (nuevoPrecio <= 0) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "El precio no puede ser 0.",
                          });
                          return;
                        }

                        // Si el precio es válido, actualizar el precio del producto
                        actualizarPrecioProducto(
                          producto.productoId._id,
                          nuevoPrecio
                        );
                      }}
                      className="mt-1"
                      step="any" // permite números decimales
                      onKeyDown={(e) => {
                        // Prevenir ingreso de valores negativos y notación científica
                        if (e.key === "-" || e.key === "e") {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description:
                              "No se permiten valores negativos ni notaciones científicas.",
                          });
                          e.preventDefault(); // evita el ingreso de negativos o notación científica
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`lote-${producto.productoId._id}`}
                      className="text-muted-foreground"
                    >
                      Agregar Lote
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        agregarLoteAProducto(producto.productoId._id, value, 1)
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Seleccione un lote" />
                      </SelectTrigger>
                      <SelectContent>
                        {lotes
                          .filter(
                            (l) =>
                              l.productoId._id === producto.productoId._id &&
                              l.cantidadDisponible > 0
                          )
                          .map((lote) => (
                            <SelectItem key={lote._id} value={lote._id}>
                              {lote.codigoLote} - Disp:{" "}
                              {lote.cantidadDisponible}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {producto.lotes.map((lote, loteIndex) => (
                  <div
                    key={lote._id || `new-lot-${loteIndex}`}
                    className="flex items-center gap-2 mt-2"
                  >
                    <Badge
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground"
                    >
                      {lote.loteId.codigoLote}
                    </Badge>
                    <Input
                      type="number"
                      value={lote.cantidad}
                      onChange={(e) => {
                        const nuevaCantidad = parseInt(e.target.value);

                        // Buscar el lote seleccionado
                        const loteSeleccionado = lotes.find(
                          (l) => l._id === lote.loteId._id
                        );

                        // Validación para valores negativos o cero
                        if (nuevaCantidad <= 0) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "La cantidad no puede ser 0.",
                          });
                          return;
                        }

                        // Validación para cantidad que excede la disponible
                        if (
                          loteSeleccionado &&
                          nuevaCantidad > loteSeleccionado.cantidadDisponible
                        ) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: `La cantidad solicitada (${nuevaCantidad}) excede la cantidad disponible en el lote (${loteSeleccionado.cantidadDisponible}).`,
                          });
                          return;
                        }

                        // Actualización de la cantidad en la venta
                        setNuevaVenta((prev) => ({
                          ...prev,
                          productos: prev.productos.map((p) =>
                            p.productoId._id === producto.productoId._id
                              ? {
                                  ...p,
                                  lotes: p.lotes.map((l) =>
                                    l._id === lote._id
                                      ? { ...l, cantidad: nuevaCantidad }
                                      : l
                                  ),
                                }
                              : p
                          ),
                        }));
                      }}
                      className="w-20"
                    />
                  </div>
                ))}
                <div className="mt-2">
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p className="font-semibold text-green-600">
                    Bs.
                    {(producto.cantidad * producto.precioUnitario).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
            <div>
              <Label htmlFor="pagoInicial" className="text-muted-foreground">
                Pago Inicial
              </Label>
              <Input
                id="pagoInicial"
                type="number"
                value={nuevaVenta.pagoInicial}
                onChange={(e) => {
                  const pagoInicial = parseFloat(e.target.value);
                  if (pagoInicial > nuevaVenta.totalVenta || pagoInicial < 0) {
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description:
                        "El pago inicial no puede ser mayor al total de la venta o menor a 0.",
                    });
                    return;
                  }
                  setNuevaVenta({
                    ...nuevaVenta,
                    pagoInicial: pagoInicial,
                  });
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="fechaVenta" className="text-muted-foreground">
                Fecha de Venta
              </Label>
              <Input
                id="fechaVenta"
                type="date"
                value={nuevaVenta.fechaVenta}
                onChange={(e) =>
                  setNuevaVenta({
                    ...nuevaVenta,
                    fechaVenta: e.target.value,
                  })
                }
                max={moment.tz("America/La_Paz").format("YYYY-MM-DD")} // Limita la fecha máxima a hoy
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Total de la Venta</Label>
              <p className="text-2xl font-bold text-green-600">
                Bs.{nuevaVenta.totalVenta.toFixed(2)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Saldo Pendiente</Label>
              <p className="text-2xl font-bold text-red-600">
                Bs.{nuevaVenta.saldoVenta.toFixed(2)}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCrearVenta}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Crear Venta
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog
        open={!!ventaSeleccionada}
        onOpenChange={() => setVentaSeleccionada(null)}
      >
        <DialogContent className="max-w-4xl sm:max-w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary flex items-center">
              <Edit className="mr-2 h-6 w-6" />
              Editar Venta
            </DialogTitle>
            <DialogDescription>
              Modifique los detalles de la venta aquí.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow">
            {ventaSeleccionada && (
              <div className="grid gap-6 py-4 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cliente" className="text-muted-foreground">
                      Cliente
                    </Label>
                    <Select
                      value={ventaSeleccionada.cliente._id}
                      onValueChange={(value) =>
                        setVentaSeleccionada({
                          ...ventaSeleccionada,
                          cliente: { ...ventaSeleccionada.cliente, _id: value },
                        })
                      }
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
                  </div>
                  <div>
                    <Label htmlFor="vendedor" className="text-muted-foreground">
                      Vendedor
                    </Label>
                    <Select
                      value={ventaSeleccionada.vendedor?._id || ""}
                      onValueChange={(value) =>
                        setVentaSeleccionada({
                          ...ventaSeleccionada,
                          vendedor: value
                            ? { ...ventaSeleccionada.vendedor, _id: value }
                            : null,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un vendedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendedores.map((vendedor) => (
                          <SelectItem key={vendedor._id} value={vendedor._id}>
                            {vendedor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {ventaSeleccionada.productos.map((producto, index) => (
                  <Card
                    key={producto._id || `edit-product-${index}`}
                    className="p-4 bg-card shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-lg font-semibold text-primary">
                        {producto.productoId.nombre}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <Label
                          htmlFor={`cantidad-${producto.productoId._id}`}
                          className="text-muted-foreground"
                        >
                          Cantidad
                        </Label>
                        <Input
                          id={`cantidad-${producto.productoId._id}`}
                          type="number"
                          value={producto.cantidad}
                          onChange={(e) => {
                            const newProductos = [
                              ...ventaSeleccionada.productos,
                            ];
                            newProductos[index].cantidad = parseInt(
                              e.target.value
                            );
                            setVentaSeleccionada({
                              ...ventaSeleccionada,
                              productos: newProductos,
                            });
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor={`precio-${producto.productoId._id}`}
                          className="text-muted-foreground"
                        >
                          Precio
                        </Label>
                        <Input
                          id={`precio-${producto.productoId._id}`}
                          type="number"
                          value={producto.precioUnitario}
                          onChange={(e) => {
                            const newProductos = [
                              ...ventaSeleccionada.productos,
                            ];
                            newProductos[index].precioUnitario = parseFloat(
                              e.target.value
                            );
                            setVentaSeleccionada({
                              ...ventaSeleccionada,
                              productos: newProductos,
                            });
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    {producto.lotes.map((lote, loteIndex) => (
                      <div
                        key={lote._id || `edit-lot-${loteIndex}`}
                        className="flex items-center gap-2 mt-2"
                      >
                        <Badge
                          variant="secondary"
                          className="bg-secondary text-secondary-foreground"
                        >
                          {lote.loteId.codigoLote}
                        </Badge>
                        <Input
                          type="number"
                          value={lote.cantidad}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value);
                            const loteActual = lotes.find(
                              (l) => l._id === lote.loteId._id
                            );
                            if (
                              loteActual &&
                              newQuantity > loteActual.cantidadDisponible
                            ) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: `La cantidad seleccionada (${newQuantity}) excede la cantidad disponible en el lote (${loteActual.cantidadDisponible}).`,
                              });
                              return;
                            }
                            const newProductos = [
                              ...ventaSeleccionada.productos,
                            ];
                            newProductos[index].lotes[loteIndex].cantidad =
                              newQuantity;
                            setVentaSeleccionada({
                              ...ventaSeleccionada,
                              productos: newProductos,
                            });
                          }}
                          className="w-20"
                        />
                      </div>
                    ))}
                    <div className="mt-2">
                      <Label className="text-muted-foreground">Subtotal</Label>
                      <p className="font-semibold text-green-600">
                        Bs.
                        {(producto.cantidad * producto.precioUnitario).toFixed(
                          2
                        )}
                      </p>
                    </div>
                  </Card>
                ))}
                <div>
                  <Label
                    htmlFor="pagoInicial"
                    className="text-muted-foreground"
                  >
                    Pago Inicial
                  </Label>
                  <Input
                    id="pagoInicial"
                    type="number"
                    value={ventaSeleccionada.pagoInicial}
                    onChange={(e) =>
                      setVentaSeleccionada({
                        ...ventaSeleccionada,
                        pagoInicial: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="estado" className="text-muted-foreground">
                    Estado
                  </Label>
                  <Select
                    value={ventaSeleccionada.estado}
                    onValueChange={(value) =>
                      setVentaSeleccionada({
                        ...ventaSeleccionada,
                        estado: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Total de la Venta
                  </Label>
                  <p className="text-2xl font-bold text-green-600">
                    Bs.
                    {calcularTotalVenta(ventaSeleccionada.productos).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="mt-6">
            <Button
              onClick={() => handleEditarVenta(ventaSeleccionada)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!ventaDetalle} onOpenChange={() => setVentaDetalle(null)}>
        <DialogContent className="max-w-4xl sm:max-w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary flex items-center">
              <Eye className="mr-2 h-6 w-6" />
              Detalles de la Venta
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow">
            {ventaDetalle && (
              <div className="grid gap-6 py-4 px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <Label className="font-bold text-primary">Cliente</Label>
                    <p className="text-foreground flex items-center mt-1">
                      <UserIcon className="mr-2 h-4 w-4" />
                      {ventaDetalle.cliente?.name}
                    </p>
                  </div>
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <Label className="font-bold text-primary">Vendedor</Label>
                    <p className="text-foreground flex items-center mt-1">
                      <Users className="mr-2 h-4 w-4" />
                      {ventaDetalle.vendedor?.name}
                    </p>
                  </div>
                </div>
                <div className="bg-secondary/10 p-4 rounded-lg">
                  <Label className="font-bold text-primary">Estado</Label>
                  <Badge
                    variant={
                      ventaDetalle.estado === "completada"
                        ? "success"
                        : "warning"
                    }
                    className="ml-2"
                  >
                    {ventaDetalle.estado}
                  </Badge>
                </div>
                <div>
                  <Label className="font-bold text-primary mb-2 block">
                    Productos
                  </Label>
                  {ventaDetalle.productos.map((producto, index) => (
                    <Card
                      key={producto._id || `detail-product-${index}`}
                      className="p-4 mt-2 bg-card shadow"
                    >
                      <h4 className="text-lg font-semibold text-primary flex items-center">
                        <Package className="mr-2 h-5 w-5" />
                        {producto.productoId.nombre}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        <p className="text-muted-foreground flex items-center">
                          <AlertCircle className="mr-1 h-4 w-4" />
                          Cantidad: {producto.cantidad}
                        </p>
                        <p className="text-muted-foreground flex items-center">
                          <DollarSign className="mr-1 h-4 w-4" />
                          Precio: Bs.{producto.precioUnitario.toFixed(2)}
                        </p>
                        <p className="text-muted-foreground flex items-center">
                          <DollarSign className="mr-1 h-4 w-4" />
                          Subtotal: Bs.
                          {(
                            producto.cantidad * producto.precioUnitario
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-2">
                        <Label className="font-bold text-primary">Lotes</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {producto.lotes.map((lote, loteIndex) => (
                            <Badge
                              key={lote._id || `detail-lot-${loteIndex}`}
                              variant="outline"
                              className="flex items-center"
                            >
                              <Package className="mr-1 h-3 w-3" />
                              {lote.loteId.codigoLote}: {lote.cantidad}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <Label className="font-bold text-green-800">
                      Total de la Venta
                    </Label>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      Bs.{ventaDetalle.totalVenta.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <Label className="font-bold text-blue-800">
                      Pago Realizado
                    </Label>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      Bs.{ventaDetalle.pagoInicial.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg">
                    <Label className="font-bold text-red-800">
                      Saldo Pendiente
                    </Label>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      Bs.
                      {(
                        ventaDetalle.totalVenta - ventaDetalle.pagoInicial
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!ventaAEliminar}
        onOpenChange={() => setVentaAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar esta venta? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVentaAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                ventaAEliminar && handleEliminarVenta(ventaAEliminar)
              }
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeudaDialog} onOpenChange={setShowDeudaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-yellow-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Advertencia de Deuda
            </DialogTitle>
            <DialogDescription>
              Este cliente ha superado el límite de deudas permitido. ¿Desea
              continuar con la venta?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeudaDialog(false);
                setClienteSeleccionado(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setNuevaVenta((prev) => ({
                  ...prev,
                  cliente: clienteSeleccionado,
                }));
                setShowDeudaDialog(false);
              }}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
