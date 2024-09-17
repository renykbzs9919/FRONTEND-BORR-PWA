"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import axios from "axios";
import Cookies from "js-cookie";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  clienteId: z.string().min(1, { message: "Cliente es requerido" }),
  fechaEntrega: z.date({
    required_error: "Fecha de entrega es requerida",
  }),
  productos: z
    .array(
      z.object({
        producto: z.string().min(1, { message: "Producto es requerido" }),
        cantidad: z.number().min(10, { message: "Cantidad mínima es 10" }),
      })
    )
    .min(1, { message: "Al menos un producto es requerido" }),
  notas: z.string().optional(),
});

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export default function PreventasPage() {
  const [preventas, setPreventas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletePreventaId, setDeletePreventaId] = useState(null);
  const [confirmPreventaId, setConfirmPreventaId] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clienteId: "",
      fechaEntrega: new Date(),
      productos: [{ producto: "", cantidad: 10 }],
      notas: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "productos",
  });

  useEffect(() => {
    fetchPreventas();
    fetchClientes();
    fetchProductos();
  }, []);

  const fetchPreventas = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/preventas`,
        getAuthHeaders()
      );
      setPreventas(response.data.preventas);
    } catch (err) {
      setError("Error fetching preventas");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/clientes`,
        getAuthHeaders()
      );
      setClientes(response.data.clientes);
    } catch (err) {
      setError("Error fetching clientes");
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        getAuthHeaders()
      );
      setProductos(response.data);
    } catch (err) {
      setError("Error fetching productos");
    }
  };

  const onSubmit = async (values) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/preventas`,
        values,
        getAuthHeaders()
      );
      fetchPreventas();
      form.reset();
      setIsCreateModalOpen(false);
      toast({
        title: "Preventa creada",
        description: "La preventa se ha creado exitosamente.",
      });
    } catch (err) {
      setError("Error creating preventa");
      toast({
        title: "Error",
        description: "No se pudo crear la preventa.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/preventas/${id}`,
        getAuthHeaders()
      );
      fetchPreventas();
      setDeletePreventaId(null);
      toast({
        title: "Preventa eliminada",
        description: "La preventa se ha eliminado exitosamente.",
      });
    } catch (err) {
      setError("Error deleting preventa");
      toast({
        title: "Error",
        description: "No se pudo eliminar la preventa.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmEntrega = async (id, confirmacion) => {
    try {
      const preventa = preventas.find((p) => p._id === id);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/preventas/confirmar-entrega`,
        {
          clienteId: preventa.cliente._id,
          fechaEntrega: preventa.fechaEntrega,
          confirmacion,
        },
        getAuthHeaders()
      );
      fetchPreventas();
      setConfirmPreventaId(null);
      toast({
        title: confirmacion ? "Entrega confirmada" : "Preventa cancelada",
        description: response.data.message,
      });
    } catch (err) {
      setError("Error al confirmar entrega");
      toast({
        title: "Error",
        description: "No se pudo procesar la confirmación de entrega.",
        variant: "destructive",
      });
    }
  };

  const filteredPreventas = preventas.filter((preventa) =>
    preventa.cliente.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPreventas.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getAvailableProducts = (index) => {
    const selectedProducts = form.getValues().productos.map((p) => p.producto);
    return productos.filter(
      (p) =>
        !selectedProducts.includes(p._id) ||
        p._id === form.getValues().productos[index].producto
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Preventas</CardTitle>
          <CardDescription>Cree y administre sus preventas</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Crear Nueva Preventa
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Preventa</DialogTitle>
            <DialogDescription>
              Complete los detalles de la nueva preventa.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente._id} value={cliente._id}>
                            {cliente.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fechaEntrega"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Seleccione una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2 mb-4">
                    <FormField
                      control={form.control}
                      name={`productos.${index}.producto`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producto {index + 1}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.trigger(`productos.${index}.producto`);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un producto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableProducts(index).map((producto) => (
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
                      control={form.control}
                      name={`productos.${index}.cantidad`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                              min={10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => remove(index)}
                    >
                      Eliminar Producto
                    </Button>
                    <Separator className="my-2" />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ producto: "", cantidad: 10 })}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                </Button>
              </ScrollArea>
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Crear Preventa</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Preventas</CardTitle>
          <CardDescription>Todas las preventas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Buscar por nombre de cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {isLoading ? (
            <p>Cargando preventas...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha de Entrega</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((preventa) => (
                    <TableRow key={preventa._id}>
                      <TableCell className="font-medium">
                        {preventa.cliente.name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(preventa.fechaEntrega), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>Bs.{preventa.total.toFixed(2)}</TableCell>
                      <TableCell>{preventa.estado}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>
                                  Detalles de la Preventa
                                </DialogTitle>
                                <DialogDescription>
                                  Información completa de la preventa
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2">
                                <p>
                                  <strong>Cliente:</strong>{" "}
                                  {preventa.cliente.name}
                                </p>
                                <p>
                                  <strong>Fecha de Entrega:</strong>{" "}
                                  {format(
                                    new Date(preventa.fechaEntrega),
                                    "dd/MM/yyyy"
                                  )}
                                </p>
                                <p>
                                  <strong>Total:</strong> Bs.
                                  {preventa.total.toFixed(2)}
                                </p>
                                <p>
                                  <strong>Estado:</strong> {preventa.estado}
                                </p>
                                <p>
                                  <strong>Notas:</strong>{" "}
                                  {preventa.notas || "N/A"}
                                </p>
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="productos">
                                    <AccordionTrigger>
                                      Productos
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul>
                                        {preventa.productos.map(
                                          (producto, index) => (
                                            <li key={index}>
                                              {producto.producto.nombre} -
                                              Cantidad: {producto.cantidad}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Está seguro?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto
                                  eliminará permanentemente la preventa.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(preventa._id)}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          {preventa.estado === "Pendiente" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Check className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirmar Entrega
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Desea confirmar la entrega de esta
                                    preventa?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleConfirmEntrega(preventa._id, true)
                                    }
                                  >
                                    Confirmar Entrega
                                  </AlertDialogAction>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleConfirmEntrega(preventa._id, false)
                                    }
                                  >
                                    Cancelar Preventa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span>
            Página {currentPage} de{" "}
            {Math.ceil(filteredPreventas.length / itemsPerPage)}
          </span>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={
              currentPage === Math.ceil(filteredPreventas.length / itemsPerPage)
            }
          >
            Siguiente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
