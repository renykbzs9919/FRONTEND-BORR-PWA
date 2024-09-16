"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ModeToggle } from "@/components/mode-toggle";
import { User, Lock, Utensils, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginResponse {
  token: string;
  message: string;
}

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // Aquí es donde usamos useSearchParams

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const sessionExpired = searchParams.get("sessionExpired");
    if (sessionExpired) {
      Swal.fire({
        icon: "warning",
        title: "Sesión expirada",
        text: "Su sesión ha expirado, por favor inicie sesión de nuevo.",
        confirmButtonText: "Aceptar",
      });

      router.push("/login");
    }
  }, [searchParams, router]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await axios.post<LoginResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email: values.email, password: values.password },
        { withCredentials: true }
      );
      if (response.data.token) {
        if (values.rememberMe) {
          Cookies.set("token", response.data.token, { expires: 30 });
        } else {
          Cookies.set("token", response.data.token);
        }

        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: response.data.message,
        });
        router.push("/dashboard");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error(axiosError);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: axiosError.response?.data?.message || "Ha ocurrido un error",
      });
    }
  };

  return (
    <Card className="w-full max-w-md bg-white dark:bg-gray-800">
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">
            Embutidos Mardely
          </CardTitle>
          <ModeToggle />
        </div>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          Ingresa tus credenciales para acceder al sistema.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500"
                        size={18}
                      />
                      <Input
                        {...field}
                        placeholder="Email"
                        type="email"
                        className="pl-10 border-orange-300 focus:border-red-500 dark:border-orange-700 dark:focus:border-red-500"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500"
                        size={18}
                      />
                      <Input
                        {...field}
                        placeholder="Contraseña"
                        type={showPassword ? "text" : "password"}
                        className="pl-10 pr-10 border-orange-300 focus:border-red-500 dark:border-orange-700 dark:focus:border-red-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-orange-500" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recuérdame</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Iniciar sesión
            </Button>
            <div className="text-sm text-center text-orange-700 dark:text-orange-300">
              ¿No tienes una cuenta?{" "}
              <a href="#" className="text-red-600 hover:underline">
                Contacta al administrador
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-orange-300 dark:border-orange-700"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-orange-700 dark:text-orange-300">
                  Embutidos Mardely
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <Utensils className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900 dark:to-red-900">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://img.freepik.com/fotos-premium/comparacion-salchichas-tradicionales-baviera-turingia_1198283-79131.jpg?w=1380&t=st=1701296427~exp=1701297027~hmac=7992279f7c9a6b8b8d5e7e0b5e1e7e0b5e1e7e0b5e1e7e0b5e1e7e0b5e1e7e0b5e1e7e0')",
        }}
      ></div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Suspense fallback={<div>Cargando...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
