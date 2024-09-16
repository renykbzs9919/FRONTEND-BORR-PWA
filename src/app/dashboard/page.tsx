"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ReactECharts from "echarts-for-react";
import { DollarSign, Package, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  fetchSummaryData,
  fetchProductionData,
  fetchSalesData,
  fetchInventoryData,
  fetchQualityIssuesData,
  fetchUserProfile,
} from "@/components/api/dashboardApi";

interface SummaryData {
  totalProduction: number;
  totalSales: number;
  inventoryValue: number;
  activeAlerts: number;
}

interface ProductionData {
  _id: string;
  totalProduction: number;
}

interface SalesData {
  _id: string;
  totalSales: number;
}

interface InventoryData {
  _id: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  stockDisponible: number;
  productoNombre: string;
}

interface QualityIssue {
  _id: {
    productoId: string;
    productoNombre: string;
  };
  count: number;
}

interface Permission {
  name: string;
  granted: boolean;
}

interface UserProfile {
  permissions: Permission[];
}

export default function SausageERPDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userProfile = await fetchUserProfile();
        setUserPermissions(userProfile.permissions);

        const [
          summaryResult,
          productionResult,
          salesResult,
          inventoryResult,
          qualityResult,
        ] = await Promise.all([
          fetchSummaryData(timeRange),
          fetchProductionData(timeRange),
          fetchSalesData(timeRange),
          fetchInventoryData(),
          fetchQualityIssuesData(timeRange),
        ]);

        setSummaryData(summaryResult);
        setProductionData(productionResult);
        setSalesData(salesResult);
        setInventoryData(inventoryResult);
        setQualityIssues(qualityResult);
      } catch (err) {
        setError("Error fetching dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // Actualiza la función para verificar tanto el nombre como el campo granted
  const hasPermission = (permissionName: string) =>
    userPermissions.some(
      (permission) => permission.name === permissionName && permission.granted
    );

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    tooltip: {
      trigger: "axis",
      confine: true,
    },
    grid: {
      top: "10%",
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    toolbox: {
      feature: {
        saveAsImage: {},
      },
    },
  };

  const productionChartOption = {
    ...commonChartOptions,
    title: { text: "Tendencias de Producción", left: "center" },
    xAxis: {
      type: "category",
      data: productionData.map((d) => d._id),
      axisLabel: { interval: 0, rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        data: productionData.map((d) => d.totalProduction),
        type: "line",
        smooth: true,
        name: "Producción",
      },
    ],
  };

  const salesChartOption = {
    ...commonChartOptions,
    title: { text: "Tendencias de Ventas", left: "center" },
    xAxis: {
      type: "category",
      data: salesData.map((d) => d._id),
      axisLabel: { interval: 0, rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        data: salesData.map((d) => d.totalSales),
        type: "line",
        smooth: true,
        name: "Ventas",
      },
    ],
  };

  const inventoryChartOption = {
    ...commonChartOptions,
    title: { text: "Niveles de Inventario", left: "center" },
    xAxis: {
      type: "category",
      data: inventoryData.map((d) => d.productoNombre),
      axisLabel: { interval: 0, rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        data: inventoryData.map((d) => d.stockActual),
        type: "bar",
        name: "Stock Actual",
      },
    ],
  };

  const qualityChartOption = {
    ...commonChartOptions,
    title: { text: "Problemas de Calidad por Producto", left: "center" },
    xAxis: {
      type: "category",
      data: qualityIssues.map((issue) => issue._id.productoNombre),
      axisLabel: { interval: 0, rotate: 45 },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Problemas de Calidad",
        type: "line",
        smooth: true,
        data: qualityIssues.map((issue) => issue.count),
        symbolSize: 8,
        itemStyle: {
          color: "#FF6B6B",
        },
        lineStyle: {
          width: 3,
        },
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        Panel de Control ERP de Embutidos
      </h1>

      {hasPermission("ver_resumen_dashboard") && (
        <div className="mb-6">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Últimos 7 días</SelectItem>
              <SelectItem value="week">Últimas 12 semanas</SelectItem>
              <SelectItem value="month">Últimos 12 meses</SelectItem>
              <SelectItem value="year">Últimos 5 años</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {summaryData && hasPermission("ver_resumen_dashboard") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {hasPermission("ver_produccion_dashboard") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Producción Total
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryData.totalProduction} kg
                </div>
              </CardContent>
            </Card>
          )}
          {hasPermission("ver_ventas_dashboard") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas Totales
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Bs. {summaryData.totalSales.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          )}
          {hasPermission("ver_inventarios_dashboard") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor del Inventario
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Bs. {summaryData.inventoryValue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          )}
          {hasPermission("ver_alertas_dashboard") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alertas Activas
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summaryData.activeAlerts}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {hasPermission("ver_produccion_dashboard") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Tendencias de Producción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px]">
                <ReactECharts
                  option={productionChartOption}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {hasPermission("ver_ventas_dashboard") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Tendencias de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px]">
                <ReactECharts
                  option={salesChartOption}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {hasPermission("ver_inventarios_dashboard") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Niveles de Inventario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px]">
                <ReactECharts
                  option={inventoryChartOption}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {hasPermission("ver_alertas_dashboard") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">
                Problemas de Calidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] md:h-[400px]">
                <ReactECharts
                  option={qualityChartOption}
                  style={{ height: "100%", width: "100%" }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {hasPermission("ver_inventarios_dashboard") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Detalles de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Producto</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Stock Actual
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Stock Mínimo
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Stock Máximo
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Stock Disponible
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="whitespace-nowrap">
                      {item.productoNombre}
                    </TableCell>
                    <TableCell>{item.stockActual}</TableCell>
                    <TableCell>{item.stockMinimo}</TableCell>
                    <TableCell>{item.stockMaximo}</TableCell>
                    <TableCell>{item.stockDisponible}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
