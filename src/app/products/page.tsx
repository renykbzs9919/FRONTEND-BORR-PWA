"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "next-themes";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
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
  Pencil,
  Trash2,
  Plus,
  Search,
  Package,
  Tag,
  DollarSign,
  Calendar,
  Eye,
  ShoppingCart,
  Layers,
  FileText,
  Bookmark,
  Scale,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Swal from "sweetalert2";

const productSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
    .transform((val) => val.trim()),
  descripcion: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : val)),
  categoria: z.string().min(1, { message: "Debe seleccionar una categoría." }),
  precioVenta: z
    .number()
    .positive({ message: "El precio de venta debe ser positivo." }),
  costo: z.number().positive({ message: "El costo debe ser positivo." }),
  unidadMedida: z.enum(["Kilogramos", "Unidades", "Litros"]),
  diasExpiracion: z.number().int().positive({
    message: "Los días de expiración deben ser un número positivo.",
  }),
});

const categorySchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
    .transform((val) => val.trim()),
});

type Product = z.infer<typeof productSchema> & { _id: string; sku: string };
type Category = {
  _id: string;
  nombre: string;
  cantidadProductos: number;
  nombresProductos: string[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCategoryDetailsDialogOpen, setIsCategoryDetailsDialogOpen] =
    useState(false);
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] =
    useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products"
  );
  const { theme } = useTheme();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const productForm = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      categoria: "",
      precioVenta: 0,
      costo: 0,
      unidadMedida: "Unidades",
      diasExpiracion: 0,
    },
  });

  const categoryForm = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: "",
    },
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const getAuthHeaders = () => {
    const token = Cookies.get("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        getAuthHeaders()
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description:
          "Error al obtener productos. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/categorias`,
        getAuthHeaders()
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description:
          "Error al obtener categorías. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const onSubmitProduct = async (data: Product) => {
    try {
      if (editingProduct) {
        // Check if there are any changes
        const hasChanges = Object.keys(data).some((key) => {
          if (
            typeof data[key] === "string" &&
            typeof editingProduct[key] === "string"
          ) {
            return data[key].trim() !== editingProduct[key].trim();
          }
          return data[key] !== editingProduct[key];
        });

        if (!hasChanges) {
          toast({
            title: "Sin cambios",
            description:
              "No hubo cambios en los datos, no se realizó ninguna actualización.",
            variant: "default",
          });
          setIsProductDialogOpen(false);
          return;
        }

        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct._id}`,
          data,
          getAuthHeaders()
        );

        if (response.status === 200) {
          toast({
            title: "Éxito",
            description: "Producto actualizado correctamente",
          });
          fetchProducts();
          fetchCategories();
          setIsProductDialogOpen(false);
          setEditingProduct(null);
          productForm.reset();
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/products`,
          data,
          getAuthHeaders()
        );

        if (response.status === 201) {
          toast({
            title: "Éxito",
            description: "Producto creado correctamente",
          });
          fetchProducts();
          fetchCategories();
          setIsProductDialogOpen(false);
          productForm.reset();
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast({
          title: "Error",
          description: error.response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            "Error al guardar producto. Por favor, inténtelo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmitCategory = async (data: Category) => {
    try {
      if (editingCategory) {
        // Check if there are any changes
        const hasChanges = data.nombre.trim() !== editingCategory.nombre.trim();

        if (!hasChanges) {
          toast({
            title: "Sin cambios",
            description:
              "No hubo cambios en los datos, no se realizó ninguna actualización.",
            variant: "default",
          });
          setIsCategoryDialogOpen(false);
          return;
        }

        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/categorias/${editingCategory._id}`,
          data,
          getAuthHeaders()
        );

        if (response.status === 200) {
          toast({
            title: "Éxito",
            description: "Categoría actualizada correctamente",
          });
          fetchCategories();
          setIsCategoryDialogOpen(false);
          setEditingCategory(null);
          categoryForm.reset();
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      } else {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/categorias`,
          data,
          getAuthHeaders()
        );

        if (response.status === 201) {
          toast({
            title: "Éxito",
            description: "Categoría creada correctamente",
          });
          fetchCategories();
          setIsCategoryDialogOpen(false);
          categoryForm.reset();
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast({
          title: "Error",
          description: error.response.data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            "Error al guardar categoría. Por favor, inténtelo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      ...product,
      categoria: product.categoria._id,
    });
    setIsProductDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset(category);
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: "No podrá revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`,
          getAuthHeaders()
        );
        fetchProducts();
        fetchCategories();
        Swal.fire("Eliminado", "El producto ha sido eliminado.", "success");
      } catch (error) {
        console.error("Error deleting product:", error);
        Swal.fire(
          "Error",
          "No se pudo eliminar el producto. Por favor, inténtelo de nuevo.",
          "error"
        );
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const result = await Swal.fire({
      title: "¿Está seguro?",
      text: "No podrá revertir esta acción",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/categorias/${categoryId}`,
          getAuthHeaders()
        );
        fetchCategories();
        Swal.fire("Eliminado", "La categoría ha sido eliminada.", "success");
      } catch (error) {
        console.error("Error deleting category:", error);
        Swal.fire(
          "Error",
          "No se pudo eliminar la categoría. Por favor, inténtelo de nuevo.",
          "error"
        );
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    Object.entries(product).some(([key, value]) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (typeof value === "number") {
        return value.toString().includes(searchTerm);
      } else if (key === "categoria") {
        return product.categoria.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
      return false;
    })
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const resetProductForm = () => {
    setEditingProduct(null);
    productForm.reset({
      nombre: "",
      descripcion: "",
      categoria: "",
      precioVenta: 0,
      costo: 0,
      unidadMedida: "Unidades",
      diasExpiracion: 0,
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    categoryForm.reset({
      nombre: "",
    });
  };

  const handleViewCategoryDetails = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryDetailsDialogOpen(true);
  };

  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            <ShoppingCart className="inline-block mr-2 h-6 w-6" />
            Gestión de Inventario
          </CardTitle>
          <CardDescription className="text-sm">
            Seleccione la sección de inventario para gestionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "products" ? "default" : "outline"}
              onClick={() => setActiveTab("products")}
            >
              <Package className="mr-2 h-4 w-4" />
              Productos
            </Button>
            <Button
              variant={activeTab === "categories" ? "default" : "outline"}
              onClick={() => setActiveTab("categories")}
            >
              <Layers className="mr-2 h-4 w-4" />
              Categorías
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            {activeTab === "products" ? (
              <>
                <Package className="inline-block mr-2 h-6 w-6" />
                Gestión de Productos
              </>
            ) : (
              <>
                <Layers className="inline-block mr-2 h-6 w-6" />
                Gestión de Categorías
              </>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            {activeTab === "products"
              ? "Administre los productos del sistema"
              : "Administre las categorías del sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "products" && (
            <>
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex items-center w-full">
                  <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="itemsPerPage"
                      className="text-sm font-medium"
                    >
                      Mostrar:
                    </label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger id="itemsPerPage" className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 50, 100].map((value) => (
                          <SelectItem key={value} value={value.toString()}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog
                    open={isProductDialogOpen}
                    onOpenChange={(open) => {
                      if (!open) {
                        resetProductForm();
                      }
                      setIsProductDialogOpen(open);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={resetProductForm}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar Producto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingProduct ? (
                            <>
                              <Pencil className="inline-block mr-2 h-5 w-5" />
                              Editar Producto
                            </>
                          ) : (
                            <>
                              <Plus className="inline-block mr-2 h-5 w-5" />
                              Agregar Nuevo Producto
                            </>
                          )}
                        </DialogTitle>
                        <DialogDescription>
                          {editingProduct
                            ? "Edite los detalles del producto a continuación."
                            : "Ingrese los detalles para el nuevo producto."}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh] overflow-y-auto">
                        <Form {...productForm}>
                          <form
                            onSubmit={productForm.handleSubmit(onSubmitProduct)}
                            className="space-y-4"
                          >
                            <FormField
                              control={productForm.control}
                              name="nombre"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <FileText className="inline-block mr-2 h-4 w-4" />
                                    Nombre
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="descripcion"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <FileText className="inline-block mr-2 h-4 w-4" />
                                    Descripción
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="categoria"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <Bookmark className="inline-block mr-2 h-4 w-4" />
                                    Categoría
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar categoría" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categories.map((category) => (
                                        <SelectItem
                                          key={category._id}
                                          value={category._id}
                                        >
                                          {category.nombre}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="precioVenta"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <DollarSign className="inline-block mr-2 h-4 w-4" />
                                    Precio de Venta Bs.
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value)
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="costo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <DollarSign className="inline-block mr-2 h-4 w-4" />
                                    Costo Bs.
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value)
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="unidadMedida"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <Scale className="inline-block mr-2 h-4 w-4" />
                                    Unidad de Medida
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar unidad de medida" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Kilogramos">
                                        Kilogramos
                                      </SelectItem>
                                      <SelectItem value="Unidades">
                                        Unidades
                                      </SelectItem>
                                      <SelectItem value="Litros">
                                        Litros
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="diasExpiracion"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    <Clock className="inline-block mr-2 h-4 w-4" />
                                    Días de Expiración
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full">
                              {editingProduct ? "Actualizar" : "Crear"} Producto
                            </Button>
                          </form>
                        </Form>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Precio de Venta</TableHead>
                      <TableHead>Costo</TableHead>
                      <TableHead>Unidad de Medida</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>{product.nombre}</TableCell>
                        <TableCell>{product.categoria.nombre}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>
                          Bs.{product.precioVenta.toFixed(2)}
                        </TableCell>
                        <TableCell>Bs.{product.costo.toFixed(2)}</TableCell>
                        <TableCell>{product.unidadMedida}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            onClick={() => handleViewProductDetails(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden mt-4 space-y-4">
                {currentItems.map((product) => (
                  <Card key={product._id}>
                    <CardHeader>
                      <CardTitle>{product.nombre}</CardTitle>
                      <CardDescription>
                        {product.categoria.nombre}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="flex items-center">
                        <Tag className="mr-2 h-4 w-4" /> SKU: {product.sku}
                      </p>
                      <p className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" /> Precio: Bs.
                        {product.precioVenta.toFixed(2)}
                      </p>
                      <p className="flex items-center">
                        <Package className="mr-2 h-4 w-4" /> Costo: Bs.
                        {product.costo.toFixed(2)}
                      </p>
                      <p className="flex items-center">
                        <Scale className="mr-2 h-4 w-4" /> Unidad:{" "}
                        {product.unidadMedida}
                      </p>
                    </CardContent>
                    <CardContent className="flex justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => handleViewProductDetails(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteProduct(product._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-center mt-4 space-x-2">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from(
                  { length: Math.ceil(filteredProducts.length / itemsPerPage) },
                  (_, i) => i + 1
                ).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={
                    currentPage ===
                    Math.ceil(filteredProducts.length / itemsPerPage)
                  }
                  variant="outline"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {activeTab === "categories" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <Dialog
                  open={isCategoryDialogOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      resetCategoryForm();
                    }
                    setIsCategoryDialogOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={resetCategoryForm}>
                      <Plus className="w-4 h-4 mr-2" /> Agregar Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? (
                          <>
                            <Pencil className="inline-block mr-2 h-5 w-5" />
                            Editar Categoría
                          </>
                        ) : (
                          <>
                            <Plus className="inline-block mr-2 h-5 w-5" />
                            Agregar Nueva Categoría
                          </>
                        )}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCategory
                          ? "Edite los detalles de la categoría a continuación."
                          : "Ingrese los detalles para la nueva categoría."}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...categoryForm}>
                      <form
                        onSubmit={categoryForm.handleSubmit(onSubmitCategory)}
                        className="space-y-4"
                      >
                        <FormField
                          control={categoryForm.control}
                          name="nombre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                <FileText className="inline-block mr-2 h-4 w-4" />
                                Nombre
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          {editingCategory ? "Actualizar" : "Crear"} Categoría
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cantidad de Productos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell>{category.nombre}</TableCell>
                        <TableCell>{category.cantidadProductos}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            onClick={() => handleViewCategoryDetails(category)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleDeleteCategory(category._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden mt-4 space-y-4">
                {categories.map((category) => (
                  <Card key={category._id}>
                    <CardHeader>
                      <CardTitle>{category.nombre}</CardTitle>
                      <CardDescription>
                        Productos: {category.cantidadProductos}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => handleViewCategoryDetails(category)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCategoryDetailsDialogOpen}
        onOpenChange={setIsCategoryDetailsDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Categoría</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
            <div>
              <p>
                <strong>Nombre:</strong> {selectedCategory.nombre}
              </p>
              <p>
                <strong>Cantidad de Productos:</strong>{" "}
                {selectedCategory.cantidadProductos}
              </p>
              <strong>Productos:</strong>
              <ul>
                {selectedCategory.nombresProductos.map((producto, index) => (
                  <li key={index}>{producto}</li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isProductDetailsDialogOpen}
        onOpenChange={setIsProductDetailsDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div>
              <p>
                <strong>Nombre:</strong> {selectedProduct.nombre}
              </p>
              <p>
                <strong>Descripción:</strong> {selectedProduct.descripcion}
              </p>
              <p>
                <strong>Categoría:</strong> {selectedProduct.categoria.nombre}
              </p>
              <p>
                <strong>SKU:</strong> {selectedProduct.sku}
              </p>
              <p>
                <strong>Precio de Venta:</strong> Bs.
                {selectedProduct.precioVenta.toFixed(2)}
              </p>
              <p>
                <strong>Costo:</strong> Bs.{selectedProduct.costo.toFixed(2)}
              </p>
              <p>
                <strong>Unidad de Medida:</strong>{" "}
                {selectedProduct.unidadMedida}
              </p>
              <p>
                <strong>Días de Expiración:</strong>{" "}
                {selectedProduct.diasExpiracion}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
