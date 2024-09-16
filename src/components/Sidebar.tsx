"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart,
  TrendingUp,
  Loader2,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  permission: string;
}

const allMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    permission: "ver_resumen_dashboard",
  },
  {
    name: "Usuarios",
    href: "/users",
    icon: Users,
    permission: "ver_usuarios",
  },
  {
    name: "Productos",
    href: "/products",
    icon: Package,
    permission: "ver_productos",
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: ShoppingCart,
    permission: "ver_movimientos_inventario",
  },
  {
    name: "Ventas",
    href: "/ventas",
    icon: CreditCard,
    permission: "ver_ventas",
  },
  {
    name: "Pagos",
    href: "/pagos",
    icon: CreditCard,
    permission: "ver_pagos",
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: BarChart,
    permission: "ver_reportes_productos",
  },
  {
    name: "Predicciones",
    href: "/predicciones",
    icon: TrendingUp,
    permission: "ver_predicciones",
  },
];

interface SidebarProps {
  className?: string;
}

interface Permission {
  name: string;
  granted: boolean;
}

interface UserProfile {
  permissions: Permission[];
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
        setUserProfile(response.data);

        const userPermissions = response.data.permissions
          .filter((permission) => permission.granted)
          .map((permission) => permission.name);

        const filteredMenu = allMenuItems.filter((item) =>
          userPermissions.includes(item.permission)
        );
        setMenu(filteredMenu);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Error al cargar el menú");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "w-64 bg-background text-foreground p-4 h-full flex items-center justify-center",
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "w-64 bg-background text-foreground p-4 h-full flex items-center justify-center",
          className
        )}
      >
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <nav
      className={cn(
        "w-64 bg-background text-foreground h-full flex flex-col",
        className
      )}
    >
      <div className="p-4 flex-grow">
        <h2 className="text-lg font-semibold mb-4">Menú</h2>
        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
