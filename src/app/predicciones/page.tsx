"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export default function PredictionsDashboard() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [predictionType, setPredictionType] = useState("");
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setProgress((step / 3) * 100);
  }, [step]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/products`,
        getAuthHeaders()
      );
      setProducts(response.data);
    } catch (error) {
      setError(handleAxiosError(error));
    }
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/predicciones/ventas-produccion/${selectedProduct}?tipo=${predictionType}`,
        getAuthHeaders()
      );
      setPredictions(response.data);
    } catch (error) {
      setError(handleAxiosError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAxiosError = (error) => {
    if (error.response) {
      if (
        error.response.status === 400 &&
        error.response.data.error ===
          "No hay suficientes datos históricos para hacer predicciones."
      ) {
        return "No hay suficientes datos históricos para este producto. Por favor, seleccione otro producto.";
      }
      return `Error ${error.response.status}: ${
        error.response.data.error || "Error desconocido"
      }`;
    } else if (error.request) {
      return "No se recibió respuesta del servidor. Por favor, verifique su conexión de red.";
    } else {
      return `Error: ${error.message}`;
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedProduct) {
      setStep(2);
    } else if (step === 2 && predictionType) {
      setStep(3);
      fetchPredictions();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            Paso 1: Seleccionar Producto
          </CardTitle>
          <CardDescription>Elija un producto para predecir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Button
                key={product._id}
                onClick={() => handleProductSelect(product._id)}
                variant={
                  selectedProduct === product._id ? "default" : "outline"
                }
                className="w-full h-20 flex flex-col items-center justify-center text-center transition-all duration-300 transform hover:scale-105"
              >
                {product.nombre}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Paso 2: Tipo de Predicción</CardTitle>
          <CardDescription>
            Elija entre predicción diaria o mensual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={predictionType} onValueChange={setPredictionType}>
            <SelectTrigger className="w-full md:w-[300px] mb-4">
              <SelectValue placeholder="Seleccione el tipo de predicción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diario</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>
            {products.find((p) => p._id === selectedProduct)?.nombre}
          </CardTitle>
          <CardDescription>Comparación de Ventas y Producción</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] md:h-[500px]">
            {predictions ? (
              <ReactECharts
                option={getMultiLineChartOption(
                  predictions,
                  `Comparación de Ventas y Producción - ${
                    products.find((p) => p._id === selectedProduct)?.nombre
                  }`
                )}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Comparación de Ventas</CardTitle>
          <CardDescription>Histórico vs Predicción de Ventas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] md:h-[500px]">
            {predictions ? (
              <ReactECharts
                option={getComparisonChartOption(
                  predictions.ventas,
                  "Comparación de Ventas"
                )}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Comparación de Producción</CardTitle>
          <CardDescription>
            Histórico vs Predicción de Producción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] md:h-[500px]">
            {predictions ? (
              <ReactECharts
                option={getComparisonChartOption(
                  predictions.produccion,
                  "Comparación de Producción"
                )}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Predicciones de Ventas</CardTitle>
          <CardDescription>Histórico vs Predicción de Ventas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] md:h-[400px]">
            {predictions ? (
              <ReactECharts
                option={getLineRaceChartOption(
                  predictions.ventas,
                  "Predicciones de Ventas"
                )}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Predicciones de Producción</CardTitle>
          <CardDescription>
            Histórico vs Predicción de Producción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] md:h-[400px]">
            {predictions ? (
              <ReactECharts
                option={getBarChartOption(
                  predictions.produccion,
                  "Predicciones de Producción"
                )}
                style={{ height: "100%", width: "100%" }}
              />
            ) : (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Métricas de Error</CardTitle>
          <CardDescription>
            MAE, RMSE y MAPE para Predicciones de Ventas y Producción
          </CardDescription>
        </CardHeader>
        <CardContent>
          {predictions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Ventas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="h-48 md:h-64">
                    <ReactECharts
                      option={getGaugeChartOption(
                        predictions.ventas.mae,
                        "MAE",
                        0,
                        500
                      )}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                  <div className="h-48 md:h-64">
                    <ReactECharts
                      option={getGaugeChartOption(
                        predictions.ventas.rmse,
                        "RMSE",
                        0,
                        500
                      )}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                  <div className="h-48 md:h-64">
                    <ReactECharts
                      option={getGaugeChartOption(
                        predictions.ventas.mape,
                        "MAPE",
                        0,
                        100
                      )}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Producción</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="h-48 md:h-64">
                    <ReactECharts
                      option={getGaugeChartOption(
                        predictions.produccion.mae,
                        "MAE",
                        0,
                        500
                      )}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                  <div className="h-48 md:h-64">
                    <ReactECharts
                      option={getGaugeChartOption(
                        predictions.produccion.rmse,
                        "RMSE",
                        0,
                        500
                      )}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                  <div className="h-48 md:h-64">
                    <ReactECharts
                      option={getGaugeChartOption(
                        predictions.produccion.mape,
                        "MAPE",
                        0,
                        100
                      )}
                      style={{ height: "100%", width: "100%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const getComparisonChartOption = (data, title) => {
    const isDaily = predictionType === "diario";
    const xAxisData = isDaily
      ? data.historico.map((_, index) => `Día ${index + 1}`)
      : [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];

    const source = [
      ["Periodo", ...xAxisData],
      ["Histórico", ...data.historico],
      ["Predicción", ...data.predicciones],
    ];

    return {
      title: {
        text: title,
        textStyle: {
          fontSize: 16,
        },
      },
      legend: {
        top: "bottom",
      },
      tooltip: {
        trigger: "axis",
        showContent: false,
      },
      dataset: {
        source: source,
      },
      xAxis: { type: "category" },
      yAxis: { gridIndex: 0 },
      grid: { top: "55%" },
      series: [
        {
          type: "line",
          smooth: true,
          seriesLayoutBy: "row",
          emphasis: { focus: "series" },
        },
        {
          type: "line",
          smooth: true,
          seriesLayoutBy: "row",
          emphasis: { focus: "series" },
        },
        {
          type: "pie",
          id: "pie",
          radius: "30%",
          center: ["50%", "25%"],
          emphasis: {
            focus: "self",
          },
          label: {
            formatter: "{b}: {@[1]} ({d}%)",
          },
          encode: {
            itemName: "Periodo",
            value: xAxisData[0],
            tooltip: xAxisData[0],
          },
        },
      ],
    };
  };

  const getLineRaceChartOption = (data, title) => {
    const isDaily = predictionType === "diario";
    const xAxisData = isDaily
      ? data.historico.map((_, index) => `Día ${index + 1}`)
      : [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];

    return {
      title: {
        text: title,
        textStyle: {
          fontSize: 16,
        },
      },
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Histórico", "Predicción"],
        top: "bottom",
      },
      xAxis: {
        type: "category",
        data: xAxisData,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "Histórico",
          type: "line",
          data: data.historico,
        },
        {
          name: "Predicción",
          type: "line",
          data: data.predicciones,
        },
      ],
    };
  };

  const getBarChartOption = (data, title) => {
    const isDaily = predictionType === "diario";
    const xAxisData = isDaily
      ? data.historico.map((_, index) => `Día ${index + 1}`)
      : [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];

    return {
      title: {
        text: title,
        textStyle: {
          fontSize: 16,
        },
      },
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Histórico", "Predicción"],
        top: "bottom",
      },
      xAxis: {
        type: "category",
        data: xAxisData,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "Histórico",
          type: "bar",
          data: data.historico,
        },
        {
          name: "Predicción",
          type: "bar",
          data: data.predicciones,
        },
      ],
    };
  };

  const getGaugeChartOption = (value, title, min, max) => {
    return {
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          min,
          max,
          splitNumber: 8,
          axisLine: {
            lineStyle: {
              width: 6,
              color: [
                [0.25, "#7eb26d"],
                [0.5, "#f9ba8f"],
                [0.75, "#f9e2d2"],
                [1, "#e24d42"],
              ],
            },
          },
          pointer: {
            icon: "path://M12.8,0.7l12,40.1H0.7L12.8,0.7z",
            length: "12%",
            width: 20,
            offsetCenter: [0, "-60%"],
            itemStyle: {
              color: "auto",
            },
          },
          axisTick: {
            length: 12,
            lineStyle: {
              color: "auto",
              width: 2,
            },
          },
          splitLine: {
            length: 20,
            lineStyle: {
              color: "auto",
              width: 5,
            },
          },
          axisLabel: {
            color: "#464646",
            fontSize: 20,
            distance: -60,
            formatter: function (value) {
              if (value === min || value === max) {
                return value.toFixed(2);
              }
              return "";
            },
          },
          title: {
            offsetCenter: [0, "-20%"],
            fontSize: 20,
          },
          detail: {
            fontSize: 30,
            offsetCenter: [0, "0%"],
            valueAnimation: true,
            formatter: function (value) {
              return value.toFixed(2);
            },
            color: "auto",
          },
          data: [{ value: value, name: title }],
        },
      ],
    };
  };

  const getMultiLineChartOption = (data, title) => {
    const isDaily = predictionType === "diario";
    const xAxisData = isDaily
      ? data.ventas.historico.map((_, index) => `Día ${index + 1}`)
      : [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];

    const series = [
      {
        name: "Ventas Históricas",
        type: "line",
        showSymbol: false,
        data: data.ventas.historico,
        endLabel: {
          show: true,
          formatter: function (params) {
            return "Ventas Históricas: " + params.value;
          },
        },
      },
      {
        name: "Ventas Predichas",
        type: "line",
        showSymbol: false,
        data: data.ventas.predicciones,
        endLabel: {
          show: true,
          formatter: function (params) {
            return "Ventas Predichas: " + params.value;
          },
        },
      },
      {
        name: "Producción Histórica",
        type: "line",
        showSymbol: false,
        data: data.produccion.historico,
        endLabel: {
          show: true,
          formatter: function (params) {
            return "Producción Histórica: " + params.value;
          },
        },
      },
      {
        name: "Producción Predicha",
        type: "line",
        showSymbol: false,
        data: data.produccion.predicciones,
        endLabel: {
          show: true,
          formatter: function (params) {
            return "Producción Predicha: " + params.value;
          },
        },
      },
    ];

    return {
      animationDuration: 10000,
      title: {
        text: title,
        textStyle: {
          fontSize: 16,
        },
      },
      tooltip: {
        order: "valueDesc",
        trigger: "axis",
      },
      legend: {
        data: [
          "Ventas Históricas",
          "Ventas Predichas",
          "Producción Histórica",
          "Producción Predicha",
        ],
        top: "bottom",
      },
      xAxis: {
        type: "category",
        data: xAxisData,
      },
      yAxis: {
        name: "Cantidad",
      },
      grid: {
        right: 140,
        top: 40,
        bottom: 80,
      },
      series: series,
    };
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Panel de Predicciones
      </h1>
      <Progress value={progress} className="w-full mb-8" />
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <AnimatePresence mode="wait">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </AnimatePresence>
      <div className="mt-8 flex justify-between">
        {step > 1 && (
          <Button onClick={handlePrevStep} className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
        )}
        {step < 3 && (
          <Button
            onClick={handleNextStep}
            disabled={
              (step === 1 && !selectedProduct) ||
              (step === 2 && !predictionType)
            }
            className="ml-auto flex items-center"
          >
            Siguiente <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
