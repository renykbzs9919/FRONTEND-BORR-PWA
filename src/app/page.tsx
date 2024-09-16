import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Utensils, Lock, BarChart, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900 dark:to-red-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-red-600 dark:text-red-400" />
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">
              Embutidos S.A.
            </h1>
          </div>
          <ModeToggle />
        </header>

        <main className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-6 w-6 text-orange-500" />
                <span>Autenticación Segura</span>
              </CardTitle>
              <CardDescription>
                Protege tu información con nuestro sistema de login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Nuestro sistema de autenticación garantiza la seguridad de tus
                datos y el acceso controlado a la información.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="h-6 w-6 text-orange-500" />
                <span>Dashboard Intuitivo</span>
              </CardTitle>
              <CardDescription>
                Visualiza y gestiona tus datos fácilmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Accede a un panel de control intuitivo que te permite visualizar
                y gestionar toda la información relevante de tu negocio.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">Ver Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-orange-500" />
                <span>Gestión de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Administra los accesos y permisos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Controla quién tiene acceso a qué información con nuestro
                sistema avanzado de gestión de usuarios y roles.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/users">Gestionar Usuarios</Link>
              </Button>
            </CardFooter>
          </Card>
        </main>

        <footer className="mt-12 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2023 Embutidos S.A. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
