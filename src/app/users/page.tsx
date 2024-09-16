"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { z } from "zod";
import Image from "next/image";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Users,
  UserCheck,
  UserCog,
  HardHat,
  Eye,
  Unlock,
  History,
  QrCode,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import UserEditModal from "./UserEditModal";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/La_Paz");

const userSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z
    .string()
    .email({ message: "Dirección de correo electrónico inválida." }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." })
    .optional(),
  ci: z
    .number()
    .int()
    .positive({ message: "El CI debe ser un número positivo." }),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "La fecha de nacimiento debe estar en formato YYYY-MM-DD.",
    })
    .refine(
      (date) => {
        const birthdate = dayjs(date);
        const now = dayjs().tz("America/La_Paz");
        return now.diff(birthdate, "years") >= 18;
      },
      {
        message: "Debe ser mayor de 18 años para registrarse.",
      }
    ),
  gender: z.enum(["Masculino", "Femenino"]),
  role: z.string(),
  contactInfo: z.object({
    phone: z
      .number()
      .int()
      .positive({ message: "El teléfono debe ser un número positivo." }),
    address: z
      .string()
      .min(5, { message: "La dirección debe tener al menos 5 caracteres." }),
  }),
});

type User = z.infer<typeof userSchema>;

type Role = {
  _id: string;
  name: string;
  permissions: string[];
};

type Permission = {
  _id: string;
  name: string;
  description: string;
};

const permissionGroups = [
  {
    name: "Usuarios",
    permissions: [
      "crear_usuario",
      "ver_usuarios",
      "ver_usuario_id",
      "actualizar_usuario_id",
      "eliminar_usuario_id",
      "actualizar_permisos_usuario",
      "desbloquear_cuenta",
      "ver_sesiones_usuario",
      "generar_qr",
    ],
  },
  {
    name: "Roles",
    permissions: [
      "crear_rol",
      "ver_roles",
      "ver_rol_id",
      "actualizar_rol_id",
      "eliminar_rol_id",
      "agregar_permisos_rol",
    ],
  },
  {
    name: "Permisos",
    permissions: [
      "crear_permiso",
      "ver_permisos",
      "ver_permiso_id",
      "actualizar_permiso_id",
      "eliminar_permiso_id",
    ],
  },
  {
    name: "Productos",
    permissions: [
      "crear_producto",
      "ver_productos",
      "ver_producto_id",
      "actualizar_producto_id",
      "eliminar_producto_id",
    ],
  },
  {
    name: "Ventas",
    permissions: [
      "crear_venta",
      "ver_ventas",
      "ver_venta_id",
      "actualizar_venta_id",
      "eliminar_venta_id",
    ],
  },
  {
    name: "Vendedores",
    permissions: ["ver_vendedores"],
  },
  {
    name: "Administradores",
    permissions: ["ver_admins"],
  },
  {
    name: "Clientes",
    permissions: ["ver_clientes"],
  },
  {
    name: "Trabajadores",
    permissions: ["ver_trabajadores"],
  },
  {
    name: "Pagos",
    permissions: ["crear_pago", "ver_pagos", "ver_ventas_pendientes"],
  },
  {
    name: "Stock",
    permissions: [
      "ver_stock",
      "ver_stock_id",
      "editar_stock_id",
      "eliminar_stock_id",
    ],
  },
  {
    name: "Lotes de Producción",
    permissions: [
      "crear_lote_produccion",
      "ver_lotes_produccion",
      "ver_lotes_produccion_id",
      "ver_lote_produccion_id",
      "actualizar_lote_produccion_id",
      "eliminar_lote_produccion_id",
    ],
  },
  {
    name: "Inventario",
    permissions: [
      "crear_movimiento_inventario",
      "ver_movimientos_inventario",
      "ver_movimiento_inventario_id",
      "actualizar_movimiento_inventario_id",
      "eliminar_movimiento_inventario_id",
    ],
  },
  {
    name: "Categorías",
    permissions: [
      "crear_categoria",
      "ver_categorias",
      "ver_categoria_id",
      "editar_categoria_id",
      "eliminar_categoria_id",
    ],
  },
  {
    name: "Parámetros",
    permissions: [
      "ver_parametros",
      "ver_parametro_id",
      "actualizar_parametro_id",
    ],
  },
  {
    name: "Alertas",
    permissions: ["ver_alertas", "generar_alertas"],
  },
  {
    name: "Dashboard y Reportes",
    permissions: [
      "ver_resumen_dashboard",
      "ver_produccion_dashboard",
      "ver_ventas_dashboard",
      "ver_inventarios_dashboard",
      "ver_alertas_dashboard",
      "ver_predicciones_dashboard",
      "ver_top_productos",
      "ver_alertas_activas_dashboard",
      "ver_reportes_productos",
      "ver_reportes_clientes",
      "ver_reportes_clientes_especificos",
      "ver_reportes_deudas_por_vendedor",
    ],
  },
  {
    name: "Predicciones",
    permissions: ["ver_predicciones"],
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [unlockingUserId, setUnlockingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userType, setUserType] = useState("clients");
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingSessions, setViewingSessions] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<{
    userId: string;
    permissions: { permission: string; granted: boolean }[];
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null); // Estado para almacenar la URL del QR
  const [qrModalUser, setQrModalUser] = useState<User | null>(null); // Usuario para el modal de QR
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false); // Controlar la apertura del modal

  const { toast } = useToast();

  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      ci: 0,
      birthdate: "",
      gender: "Masculino",
      role: "",
      contactInfo: {
        phone: 0,
        address: "",
      },
    },
  });

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        getAuthHeaders()
      );
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario actual.",
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, toast]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/roles`,
        getAuthHeaders()
      );
      setRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al obtener roles. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/permissions`,
        getAuthHeaders()
      );
      setPermissions(response.data);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al obtener permisos. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, toast]);

  const hasPermission = useCallback(
    (permissionName: string) => {
      return currentUser?.permissions.some(
        (p) => p.name === permissionName && p.granted
      );
    },
    [currentUser]
  );

  const fetchUsers = useCallback(async () => {
    if (!hasPermission("ver_usuarios")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para ver usuarios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        getAuthHeaders()
      );
      const filteredUsers = response.data.users.filter((user: User) => {
        const userRole = user.role.name;
        switch (userType) {
          case "clients":
            return userRole === "cliente";
          case "vendors":
            return userRole === "vendedor";
          case "admins":
            return userRole === "admin";
          case "productions":
            return userRole === "trabajador";
          default:
            return true;
        }
      });
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al obtener usuarios. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, hasPermission, toast, userType]);
  // Nueva función para generar el QR
  const handleGenerateQr = async (userId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/generateqr/${userId}`,
        getAuthHeaders()
      );
      setQrCodeUrl(response.data.qrCodeUrl); // Establecer la URL del QR en el estado
      setQrModalUser(users.find((user) => user._id === userId) || null); // Obtener el usuario y mostrarlo en el modal
      setIsQrDialogOpen(true);
    } catch (error) {
      console.error("Error generando QR:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Error al generar el código QR.",
        variant: "destructive",
      });
    }
  };
  // Función para descargar el QR con el nombre personalizado
  const downloadQrCode = (userName) => {
    // Obtener la imagen del QR
    const qrImage = document.getElementById("qrImage");

    // Crear un elemento de enlace
    const link = document.createElement("a");

    // Formatear el nombre del archivo con la fecha y hora actual
    const fileName = `${userName}_qrlogin_${dayjs().format(
      "YYYYMMDD_HHmmss"
    )}.png`;

    // Convertir el src de la imagen base64 en una descarga de imagen
    link.href = qrImage.src;
    link.download = fileName;

    // Simular clic para iniciar la descarga
    link.click();
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchRoles();
      fetchPermissions();
    }
  }, [currentUser, fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (currentUser && roles.length > 0) {
      fetchUsers();
    }
  }, [currentUser, roles, fetchUsers]);

  const onSubmit = async (data: User) => {
    if (editingUser && !hasPermission("actualizar_usuario_id")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para actualizar usuarios.",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !hasPermission("crear_usuario")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para crear usuarios.",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      if (editingUser) {
        response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${editingUser._id}`,
          data,
          getAuthHeaders()
        );
      } else {
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/users`,
          data,
          getAuthHeaders()
        );
      }

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "Éxito",
          description: editingUser
            ? "Usuario actualizado correctamente"
            : "Usuario creado correctamente",
        });
        fetchUsers();
        setIsDialogOpen(false);
        setEditingUser(null);
        form.reset();
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al guardar usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    if (!hasPermission("actualizar_usuario_id")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para editar usuarios.",
        variant: "destructive",
      });
      return;
    }
    setEditingUser({
      ...user,
      role: user.role._id,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (userId: string) => {
    if (!hasPermission("eliminar_usuario_id")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para eliminar usuarios.",
        variant: "destructive",
      });
      return;
    }
    setDeletingUserId(userId);
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${deletingUserId}`,
        getAuthHeaders()
      );
      fetchUsers();
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "No se pudo eliminar el usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleViewDetails = async (userId: string) => {
    if (!hasPermission("ver_usuario_id")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para ver detalles de usuarios.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        getAuthHeaders()
      );
      setViewingUser(response.data.user);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al obtener detalles del usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleUnlockAccount = async (userId: string) => {
    if (!hasPermission("desbloquear_cuenta")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para desbloquear cuentas de usuario.",
        variant: "destructive",
      });
      return;
    }
    setUnlockingUserId(userId);
  };

  const confirmUnlock = async () => {
    if (!unlockingUserId) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${unlockingUserId}/unlock`,
        {},
        getAuthHeaders()
      );
      toast({
        title: "Éxito",
        description: "Cuenta de usuario desbloqueada correctamente",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error unlocking user account:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al desbloquear la cuenta de usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUnlockingUserId(null);
    }
  };

  const handleUpdatePermissions = async (
    userId: string,
    permissions: { permission: string; granted: boolean }[]
  ) => {
    if (!hasPermission("actualizar_permisos_usuario")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para actualizar permisos de usuario.",
        variant: "destructive",
      });
      return;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/permissions`,
        { permissions },
        getAuthHeaders()
      );
      toast({
        title: "Éxito",
        description: "Permisos de usuario actualizados correctamente",
      });
      fetchUsers();
      setIsPermissionDialogOpen(false);
      setEditingPermissions(null);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al actualizar los permisos del usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleViewSessions = async (userId: string) => {
    if (!hasPermission("ver_sesiones_usuario")) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permiso para ver sesiones de usuario.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/sessions`,
        getAuthHeaders()
      );
      if (response.data.sessions && response.data.sessions.length > 0) {
        setViewingSessions(response.data);
      } else {
        toast({
          title: "No hay sesiones",
          description: "Este usuario no tiene sesiones registradas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      toast({
        title: "Error",
        description:
          "Error al obtener las sesiones del usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) =>
    Object.entries(user).some(([key, value]) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (typeof value === "number") {
        return value.toString().includes(searchTerm);
      } else if (key === "contactInfo") {
        return (
          user.contactInfo.phone.toString().includes(searchTerm) ||
          user.contactInfo.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      }
      return false;
    })
  );

  const resetForm = () => {
    setEditingUser(null);
    form.reset({
      name: "",
      email: "",
      password: "",
      ci: 0,
      birthdate: "",
      gender: "Masculino",
      role: getRoleIdByUserType(userType),
      contactInfo: {
        phone: 0,
        address: "",
      },
    });
  };

  const getRoleIdByUserType = (type: string) => {
    switch (type) {
      case "clients":
        return roles.find((role) => role.name === "cliente")?._id || "";
      case "vendors":
        return roles.find((role) => role.name === "vendedor")?._id || "";
      case "admins":
        return roles.find((role) => role.name === "admin")?._id || "";
      case "productions":
        return roles.find((role) => role.name === "trabajador")?._id || "";
      default:
        return "";
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSelectAllPermissions = (groupName: string, checked: boolean) => {
    const group = permissionGroups.find((g) => g.name === groupName);
    if (group && editingPermissions) {
      const updatedPermissions = editingPermissions.permissions.map((p) => {
        if (
          group.permissions.includes(
            permissions.find((perm) => perm._id === p.permission)?.name || ""
          )
        ) {
          return { ...p, granted: checked };
        }
        return p;
      });
      setEditingPermissions({
        ...editingPermissions,
        permissions: updatedPermissions,
      });
    }
  };

  return (
    <div className="container mx-auto p-2 md:p-4 space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            Gestión de Usuarios
          </CardTitle>
          <CardDescription className="text-sm">
            Seleccione el tipo de usuario para gestionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Button
              variant={userType === "clients" ? "default" : "outline"}
              onClick={() => setUserType("clients")}
              className="flex items-center justify-center"
            >
              <Users className="w-4 h-4 mr-2" />
              <span>Clientes</span>
            </Button>
            <Button
              variant={userType === "vendors" ? "default" : "outline"}
              onClick={() => setUserType("vendors")}
              className="flex items-center justify-center"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              <span>Vendedores</span>
            </Button>
            <Button
              variant={userType === "admins" ? "default" : "outline"}
              onClick={() => setUserType("admins")}
              className="flex items-center justify-center"
            >
              <UserCog className="w-4 h-4 mr-2" />
              <span>Admins</span>
            </Button>
            <Button
              variant={userType === "productions" ? "default" : "outline"}
              onClick={() => setUserType("productions")}
              className="flex items-center justify-center"
            >
              <HardHat className="w-4 h-4 mr-2" />
              <span>Producción</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">
            Lista de Usuarios
          </CardTitle>
          <CardDescription className="text-sm">
            Administre los usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center w-full">
              <Search className="w-4 h-4 mr-2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm font-medium">
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
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={resetForm}
                  className="w-full md:w-auto"
                  disabled={!hasPermission("crear_usuario")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Agregar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Editar Usuario" : "Agregar Nuevo Usuario"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? "Edite los detalles del usuario a continuación."
                      : "Ingrese los detalles para el nuevo usuario."}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] overflow-y-auto">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!!editingUser} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={!!editingUser} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {!editingUser && (
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contraseña</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="ci"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CI</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                disabled={!!editingUser}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="birthdate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                max={dayjs()
                                  .subtract(18, "years")
                                  .format("YYYY-MM-DD")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Género</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!!editingUser}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar género" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Masculino">
                                  Masculino
                                </SelectItem>
                                <SelectItem value="Femenino">
                                  Femenino
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rol</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role._id} value={role._id}>
                                    {role.name}
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
                        name="contactInfo.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
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
                      <FormField
                        control={form.control}
                        name="contactInfo.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        {editingUser ? "Actualizar" : "Crear"} Usuario
                      </Button>
                    </form>
                  </Form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <div className="hidden md:block mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.contactInfo.phone}</TableCell>
                    <TableCell>{user.ci}</TableCell>
                    <TableCell>{user.role.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => handleViewDetails(user._id)}
                        disabled={!hasPermission("ver_usuario_id")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleEdit(user)}
                        disabled={!hasPermission("actualizar_usuario_id")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(user._id)}
                        disabled={!hasPermission("eliminar_usuario_id")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleUnlockAccount(user._id)}
                        disabled={!hasPermission("desbloquear_cuenta")}
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingPermissions({
                            userId: user._id,
                            permissions: user.permissions,
                          });
                          setIsPermissionDialogOpen(true);
                        }}
                        disabled={!hasPermission("actualizar_permisos_usuario")}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleViewSessions(user._id)}
                        disabled={!hasPermission("ver_sesiones_usuario")}
                      >
                        <History className="h-4 w-4" />
                        <span className="sr-only">Ver sesiones</span>
                      </Button>
                      {/* Botón para generar el QR */}
                      <Button
                        variant="ghost"
                        onClick={() => handleGenerateQr(user._id)}
                        disabled={!hasPermission("generar_qr")}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden mt-4 space-y-4">
            {currentItems.map((user) => (
              <Card key={user._id}>
                <CardHeader>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Teléfono: {user.contactInfo.phone}</p>
                  <p>CI: {user.ci}</p>
                  <p>Rol: {user.role.name}</p>
                </CardContent>
                <CardContent className="flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => handleEdit(user)}
                    disabled={!hasPermission("actualizar_usuario_id")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(user._id)}
                    disabled={!hasPermission("eliminar_usuario_id")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleUnlockAccount(user._id)}
                    disabled={!hasPermission("desbloquear_cuenta")}
                  >
                    <Unlock className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingPermissions({
                        userId: user._id,
                        permissions: user.permissions,
                      });
                      setIsPermissionDialogOpen(true);
                    }}
                    disabled={!hasPermission("actualizar_permisos_usuario")}
                  >
                    <UserCog className="h-4 w-4" />
                  </Button>

                  {/* Botón para generar el QR */}
                  <Button
                    variant="ghost"
                    onClick={() => handleGenerateQr(user._id)}
                    disabled={!hasPermission("generar_qr")}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from(
              { length: Math.ceil(filteredUsers.length / itemsPerPage) },
              (_, i) => (
                <Button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                >
                  {i + 1}
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={() => setDeletingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              la cuenta de usuario y todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!unlockingUserId}
        onOpenChange={() => setUnlockingUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea desbloquear esta cuenta de usuario?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlock}>Sí</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!viewingSessions}
        onOpenChange={() => setViewingSessions(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesiones del Usuario</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Navegador</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Fecha de Inicio de Sesión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewingSessions?.sessions.map((session: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{session.ip}</TableCell>
                  <TableCell>{session.browser}</TableCell>
                  <TableCell>{session.device}</TableCell>
                  <TableCell>
                    {new Date(session.loginDate).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div>
              <p>
                <strong>Nombre:</strong> {viewingUser.name}
              </p>
              <p>
                <strong>Correo Electrónico:</strong> {viewingUser.email}
              </p>
              <p>
                <strong>CI:</strong> {viewingUser.ci}
              </p>
              <p>
                <strong>Fecha de Nacimiento:</strong>{" "}
                {new Date(viewingUser.birthdate).toLocaleDateString()}
              </p>
              <p>
                <strong>Género:</strong> {viewingUser.gender}
              </p>
              <p>
                <strong>Rol:</strong> {viewingUser.role.name}
              </p>
              <p>
                <strong>Teléfono:</strong> {viewingUser.contactInfo.phone}
              </p>
              <p>
                <strong>Dirección:</strong> {viewingUser.contactInfo.address}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Modal de QR */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              Iniciar Sesion por QR
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <p className="font-bold">
              Usuario : {qrModalUser?.name.toUpperCase()}
            </p>
            <div className="text-center">
              <p>
                Fecha de Cierre :{" "}
                {new Date(Date.now() + 10 * 60000)
                  .toLocaleString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .replace("a. m.", "am")
                  .replace("p. m.", "pm")}
              </p>
            </div>
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64 border-2 border-orange-500 p-2"
                id="qrImage"
              />
            )}
            <p className="text-sm text-center text-gray-500">
              Este código QR es válido por 10 minutos y solo puede usarse una
              vez.
            </p>

            <Button
              onClick={() => downloadQrCode(qrModalUser?.name)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Descargar QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPermissionDialogOpen}
        onOpenChange={(open) => {
          setIsPermissionDialogOpen(open);
          if (!open) {
            setEditingPermissions(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Permisos de Usuario</DialogTitle>
            <DialogDescription>
              Seleccione los permisos que desea otorgar al usuario.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] overflow-y-auto">
            {editingPermissions && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdatePermissions(
                    editingPermissions.userId,
                    editingPermissions.permissions
                  );
                }}
                className="space-y-4"
              >
                {permissionGroups.map((group) => (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`select-all-${group.name}`}
                        checked={group.permissions.every((p) =>
                          editingPermissions.permissions.find(
                            (ep) =>
                              ep.permission ===
                                permissions.find((perm) => perm.name === p)
                                  ?._id && ep.granted
                          )
                        )}
                        onCheckedChange={(checked) =>
                          handleSelectAllPermissions(group.name, checked)
                        }
                      />
                      <label
                        htmlFor={`select-all-${group.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {group.name}
                      </label>
                    </div>
                    {group.permissions.map((permissionName) => {
                      const permission = permissions.find(
                        (p) => p.name === permissionName
                      );
                      if (!permission) return null;
                      const userPermission =
                        editingPermissions.permissions.find(
                          (p) => p.permission === permission._id
                        );
                      return (
                        <div
                          key={permission._id}
                          className="flex items-center space-x-2 ml-4"
                        >
                          <Checkbox
                            id={permission._id}
                            checked={userPermission?.granted || false}
                            onCheckedChange={(checked) => {
                              const updatedPermissions =
                                editingPermissions.permissions.some(
                                  (p) => p.permission === permission._id
                                )
                                  ? editingPermissions.permissions.map((p) =>
                                      p.permission === permission._id
                                        ? { ...p, granted: checked }
                                        : p
                                    )
                                  : [
                                      ...editingPermissions.permissions,
                                      {
                                        permission: permission._id,
                                        granted: checked,
                                      },
                                    ];
                              setEditingPermissions({
                                ...editingPermissions,
                                permissions: updatedPermissions,
                              });
                            }}
                          />
                          <label
                            htmlFor={permission._id}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <Button type="submit" className="w-full">
                  Actualizar Permisos
                </Button>
              </form>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <UserEditModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={() => {
          fetchUsers();
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        roles={roles}
      />
    </div>
  );
}
