import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import Cookies from "js-cookie";

const userSchema = z.object({
  role: z.string(),
  contactInfo: z.object({
    phone: z
      .number()
      .int()
      .positive({ message: "El teléfono debe ser un número positivo." }),
    address: z
      .string()
      .min(5, { message: "La dirección debe tener al menos 5 caracteres." })
      .transform((value) => value.trim().replace(/\s+/g, " ")),
  }),
});

type UserUpdateData = z.infer<typeof userSchema>;

interface User extends UserUpdateData {
  _id: string;
  name: string;
  email: string;
}

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  roles: { _id: string; name: string }[];
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  roles,
}: UserEditModalProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [updatedUserData, setUpdatedUserData] = useState<UserUpdateData | null>(
    null
  );
  const { toast } = useToast();

  const form = useForm<UserUpdateData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "",
      contactInfo: {
        phone: 0,
        address: "",
      },
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        role: user.role,
        contactInfo: {
          phone: Number(user.contactInfo.phone),
          address: user.contactInfo.address,
        },
      });
    }
  }, [user, form]);

  const onSubmit = (data: UserUpdateData) => {
    if (!user) return;

    const normalizedUserAddress = user.contactInfo.address
      .trim()
      .replace(/\s+/g, " ");
    const normalizedDataAddress = data.contactInfo.address
      .trim()
      .replace(/\s+/g, " ");

    const hasChanges =
      data.role !== user.role ||
      data.contactInfo.phone !== user.contactInfo.phone ||
      normalizedDataAddress !== normalizedUserAddress;

    if (!hasChanges) {
      toast({
        title: "Sin cambios",
        description:
          "No hubo cambios en los datos, no se realizó ninguna actualización.",
        variant: "default",
      });
      onClose();
      return;
    }

    setUpdatedUserData(data);
    if (data.role !== user.role) {
      setIsConfirmDialogOpen(true);
    } else {
      handleConfirmUpdate(false);
    }
  };

  const handleConfirmUpdate = async (updatePermissions: boolean) => {
    if (!updatedUserData || !user) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user._id}`,
        {
          ...updatedUserData,
          updatePermissions,
        },
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
      );

      if (response.status === 200) {
        toast({
          title: "Éxito",
          description: "Usuario actualizado correctamente",
        });
        onUserUpdated();
        onClose();

        // Set a timeout to allow the toast to be visible before reloading
        setTimeout(() => {
          window.location.reload();
        }, 1500); // Adjust the delay as needed
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al actualizar usuario. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Edite los detalles del usuario a continuación.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
              <DialogFooter>
                <Button type="submit">Actualizar Usuario</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Actualización</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea actualizar los permisos del usuario con los del nuevo rol?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmUpdate(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmUpdate(true)}>
              Sí
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
