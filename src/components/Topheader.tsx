"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LogOut,
  User,
  Menu,
  Phone,
  MapPin,
  Calendar,
  AtSign,
  Loader2,
  Settings,
  Clock,
  Edit3,
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";

interface UserProfile {
  _id: string;
  name: string;
  ci: number;
  email: string;
  birthdate: string;
  gender: string;
  role: string;
  contactInfo: {
    phone: number;
    address: string;
  };
  permissions: Array<{
    name: string;
    granted: boolean;
  }>;
  lastLogin: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
  sessions: Array<{
    ip: string;
    browser: string;
    device: string;
    loginDate: string;
    _id: string;
  }>;
}

interface Parametro {
  _id: string;
  nombre: string;
  valor: any;
  descripcion: string;
  actualizadoPor: string;
  fechaActualizacion: string;
}

interface TopheaderProps {
  toggleSidebar: () => void;
}

export default function Component({ toggleSidebar }: TopheaderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [selectedParametro, setSelectedParametro] = useState<Parametro | null>(
    null
  );
  const [newValue, setNewValue] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get<UserProfile>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
        if (
          response.data.permissions.some(
            (p) => p.name === "ver_parametros" && p.granted
          )
        ) {
          fetchParametros();
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const hasPermission = (permissionName: string) => {
    return (
      user?.permissions.some((p) => p.name === permissionName && p.granted) ||
      false
    );
  };

  const fetchParametros = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.get<Parametro[]>(
        `${process.env.NEXT_PUBLIC_API_URL}/parametros`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setParametros(response.data);
    } catch (error) {
      console.error("Error fetching parameters:", error);
    }
  };

  const updateParametro = async (id: string, valor: any) => {
    if (!hasPermission("actualizar_parametro_id")) {
      console.error("No tienes permiso para actualizar parámetros");
      return;
    }

    try {
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("No token found");
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/parametros/${id}`,
        { valor },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchParametros();
      setSelectedParametro(null);
      setNewValue("");
    } catch (error) {
      console.error("Error updating parameter:", error);
    }
  };

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <header className="bg-background text-foreground shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      </header>
    );
  }

  if (error || !user) {
    return (
      <header className="bg-background text-foreground shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div>Error: {error || "Usuario no encontrado"}</div>
            <Button onClick={() => router.push("/login")}>
              Iniciar sesión
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-background text-foreground shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden mr-2"
                onClick={toggleSidebar}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-auto sm:h-10 md:h-12 lg:h-14"
                  src="/mardely-logo.png"
                  alt="Logo"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                      <AvatarImage
                        src="/placeholder-user.png"
                        alt={user.name}
                      />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasPermission("ver_usuario_id") && (
                    <DropdownMenuItem
                      onClick={() => setIsProfileModalOpen(true)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                  )}
                  {hasPermission("ver_parametros") && (
                    <DropdownMenuItem
                      onClick={() => setIsConfigModalOpen(true)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {hasPermission("ver_usuario_id") && (
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Perfil de Usuario
              </DialogTitle>
              <DialogDescription>
                Información detallada de tu perfil
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-secondary p-4 rounded-lg">
                  <Avatar className="h-24 w-24 border-4 border-primary">
                    <AvatarImage src="/placeholder-user.jpg" alt={user.name} />
                    <AvatarFallback className="text-2xl">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-sm font-semibold mt-2 bg-primary text-primary-foreground px-2 py-1 rounded-full inline-block">
                      {user.role}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Phone className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Teléfono</p>
                        <p className="text-lg">{user.contactInfo.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <MapPin className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Dirección</p>
                        <p className="text-lg break-words">
                          {user.contactInfo.address}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <User className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">CI</p>
                        <p className="text-lg">{user.ci}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Calendar className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">
                          Fecha de Nacimiento
                        </p>
                        <p className="text-lg">
                          {new Date(user.birthdate).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <AtSign className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Email</p>
                        <p className="text-lg break-all">{user.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center space-x-4">
                      <Clock className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">
                          Último inicio de sesión
                        </p>
                        <p className="text-lg">
                          {new Date(user.lastLogin).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setIsProfileModalOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {hasPermission("ver_parametros") && (
        <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
          <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Configuración de Parámetros
              </DialogTitle>
              <DialogDescription>
                Gestiona los parámetros del sistema
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parametros.map((parametro) => (
                  <Card key={parametro._id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-primary p-4 text-primary-foreground">
                        <h4 className="font-bold text-lg">
                          {parametro.nombre}
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {parametro.descripcion}
                        </p>
                        <p className="text-sm font-semibold">
                          Valor actual:{" "}
                          <span className="font-normal break-words">
                            {JSON.stringify(parametro.valor)}
                          </span>
                        </p>
                        {hasPermission("actualizar_parametro_id") && (
                          <DialogFooter>
                            <Button
                              onClick={() => setSelectedParametro(parametro)}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </DialogFooter>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={() => setIsConfigModalOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedParametro && hasPermission("actualizar_parametro_id") && (
        <Dialog
          open={!!selectedParametro}
          onOpenChange={() => setSelectedParametro(null)}
        >
          <DialogContent className="sm:max-w-[425px] w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Edit3 className="h-6 w-6 text-primary" />
                Editar Parámetro
              </DialogTitle>
              <DialogDescription>{selectedParametro.nombre}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-sm font-semibold">Descripción:</p>
                <p className="text-sm">{selectedParametro.descripcion}</p>
              </div>
              <div>
                <Label htmlFor="newValue" className="text-lg font-semibold">
                  Nuevo valor:
                </Label>
                <Input
                  id="newValue"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Ingrese el nuevo valor"
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
              <Button
                onClick={() => setSelectedParametro(null)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => updateParametro(selectedParametro._id, newValue)}
                className="w-full sm:w-auto"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
