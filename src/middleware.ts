import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Función para validar el token llamando al backend
async function validateToken(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/validate`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      return true; // El token es válido
    } else {
      return false; // Token inválido o expirado
    }
  } catch (error) {
    console.error("Error validando el token:", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // Si no hay token y la página es "/" o cualquier otra que requiera autenticación
  if (
    !token &&
    (request.nextUrl.pathname === "/" || request.nextUrl.pathname !== "/login")
  ) {
    const response = NextResponse.redirect(
      new URL("/login?sessionExpired=true", request.url)
    );
    response.cookies.delete("token"); // Asegurarse de eliminar el token si no existe
    return response;
  }

  // Si no hay token pero ya estamos en /login, permitir el acceso
  if (!token && request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Si hay token, validarlo llamando al backend
  if (token) {
    const isValid = await validateToken(token);

    if (!isValid) {
      // Token inválido o expirado, eliminar el token de la cookie y redirigir a /login
      const response = NextResponse.redirect(
        new URL("/login?sessionExpired=true", request.url)
      );
      response.cookies.delete("token"); // Eliminar la cookie del token
      return response;
    }

    // Si el token es válido y estamos en /login o en "/", redirigir a /dashboard
    if (
      request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Continuar normalmente si el token es válido y no estamos en /login
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/users/:path*",
    "/inventario/:path*",
    "/products/:path*",
    "/ventas/:path*",
    "/pagos/:path*",
    "/", // Asegúrate de que "/" esté en el matcher para que se aplique el middleware
  ],
};
