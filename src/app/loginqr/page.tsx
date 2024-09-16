"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

export default function QRLoginPage() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null); // Estado para almacenar el token
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return; // Asegúrate de que el código se ejecuta solo en el cliente

    const searchParams = new URLSearchParams(window.location.search); // Usar directamente la API del navegador para obtener el parámetro de búsqueda
    const tokenFromParams = searchParams.get("token");
    setToken(tokenFromParams); // Guarda el token en el estado
  }, []); // Ejecutar una vez en el cliente

  useEffect(() => {
    if (!token) return; // Esperar a que el token sea válido

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Token no encontrado",
        text: "No se ha proporcionado un token válido.",
      });
      router.push("/login");
      return;
    }

    const loginWithQR = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/loginqr`,
          {
            params: { token },
            withCredentials: true,
          }
        );

        if (response.data.token) {
          Cookies.set("token", response.data.token, { expires: 1 });

          Swal.fire({
            icon: "success",
            title: "Sesión iniciada",
            text: response.data.message || "Accediendo al dashboard...",
          });

          router.push("/dashboard");
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        console.error("Error en el login por QR:", axiosError);

        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            axiosError.response?.data?.message || "Error al procesar el QR.",
        });

        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loginWithQR();
  }, [token, router]); // Ejecutar cuando el token esté disponible

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Procesando el QR...</p>
      </div>
    );
  }

  return null;
}
