import React from "react";
import { OutputType } from "jspdf-invoice-template";
import jsPDFInvoiceTemplate from "jspdf-invoice-template";

interface Venta {
  ventaId: string;
  cliente: string;
  vendedor: string;
  productos: Array<{
    producto: string;
    cantidad: number;
    precio: number;
    lotes: Array<{
      loteId: string;
      cantidad: number;
      fechaVencimiento: string;
    }>;
  }>;
  totalVenta: number;
  pagoInicial: number;
  saldoVenta: number;
  fechaVenta: string;
  pagos: Array<{
    fechaPago: string;
    montoPagado: number;
    metodoPago: string;
    saldoRestante: number;
    pagosAplicados: Array<{
      ventaId: string;
      fechaVenta: string;
      totalVenta: number;
      saldoPrevio: number;
      pagoAplicado: number;
      saldoRestante: number;
    }>;
  }>;
}

interface PdfTemplateProps {
  ventas: Venta[];
  totalVendido: number;
  totalPagado: number;
  totalDeuda: number;
}

export default function PdfTemplate({
  ventas,
  totalVendido,
  totalPagado,
  totalDeuda,
}: PdfTemplateProps) {
  const generatePDF = () => {
    // Formatear la fecha
    const now = new Date();
    const dateString = now.toLocaleDateString("en-GB").replace(/\//g, "-"); // Fecha en formato DD-MM-YYYY

    // Formatear la hora
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const timeString = now
      .toLocaleTimeString([], options)
      .replace(/:/g, "") // Elimina los dos puntos
      .replace(/\s/g, "") // Elimina espacios en blanco
      .toLowerCase(); // Asegúrate de que AM/PM esté en minúsculas

    // Convertir "a" a "am" o "p" a "pm"
    const ampm = now.getHours() >= 12 ? "pm" : "am";
    const formattedTimeString = timeString.replace(/([ap]m)/, ampm);

    // Obtener el nombre del cliente de la primera venta
    const customerName = ventas[0]?.cliente || "Cliente";

    // Crear el objeto de parámetros
    const props = {
      outputType: OutputType.Save,
      fileName: `reporte_de_${customerName.toLowerCase()}_${dateString}-${formattedTimeString}.pdf`, // Nombre del archivo con formato deseado
      orientationLandscape: true,
      compress: true,
      logo: {
        src: "/mardely-logo.png",
        type: "PNG",
        width: 53.33,
        height: 36.66,
        margin: {
          top: 0,
          left: 0,
        },
      },
      stamp: {
        inAllPages: true,
        src: "/mardely-logo.png",
        type: "JPG",
        width: 20,
        height: 20,
        margin: {
          top: 0,
          left: 0,
        },
      },
      business: {
        name: "Embutidos Mardely",
        address: "Quillacollo - Cochabamba, Bolivia",
        phone: "Telf: 4 4369508",
        email: "mardely@mardely.com",
      },
      contact: {
        label: `Reporte Generado para:  ${customerName}`,
        name: customerName,
        address: "Dirección del cliente",
        phone: "Teléfono del cliente",
        email: "email@cliente.com",
      },
      invoice: {
        invDate: `Fecha del Reporte: ${new Date().toLocaleDateString()}`,
        invGenDate: `Fecha de Generación: ${new Date().toLocaleDateString()}`,
        headerBorder: true,
        tableBodyBorder: true,
        header: [
          { title: "Fecha", style: { width: 25 } },
          { title: "Vendedor", style: { width: 35 } },
          { title: "Productos", style: { width: 75 } },
          { title: "Total" },
          { title: "Pago Inicial" },
          { title: "Saldo" },
          { title: "Pagos Aplicados", style: { width: 40 } },
        ],
        table: ventas.map((venta: Venta) => [
          new Date(venta.fechaVenta).toLocaleDateString(),
          venta.vendedor,
          venta.productos
            .map(
              (producto) =>
                `${producto.producto} : ${producto.cantidad} Kg x Bs. ${producto.precio}`
            )
            .join(", \n"),
          `Bs. ${venta.totalVenta.toFixed(2)}\n`,
          `Bs. ${venta.pagoInicial.toFixed(2)}\n`,
          `Bs. ${venta.saldoVenta.toFixed(2)}`,
          venta.pagos
            .flatMap((pago) =>
              pago.pagosAplicados.map(
                (aplicado) =>
                  `Fecha: ${new Date(
                    pago.fechaPago
                  ).toLocaleDateString()}, \n` +
                  `Pagado: Bs. ${pago.montoPagado.toFixed(2)}, \n` +
                  `Aplicado: Bs. ${aplicado.pagoAplicado.toFixed(2)}\n`
              )
            )
            .join("\n"),
        ]),
        additionalRows: [
          {
            col1: "Total Vendido:",
            col2: `Bs. ${totalVendido.toFixed(2)}`,
            col3: "",
            style: { fontSize: 11 },
          },
          {
            col1: "Total Pagado:",
            col2: `Bs. ${totalPagado.toFixed(2)}`,
            col3: "",
            style: { fontSize: 11 },
          },
          {
            col1: "Total Deuda:",
            col2: `Bs. ${totalDeuda.toFixed(2)}`,
            col3: "",
            style: { fontSize: 11 },
          },
        ],
        invDescLabel: "Notas del Reporte",
        invDesc:
          "Este reporte incluye todos los detalles de ventas, pagos y deudas del cliente.",
      },
      footer: {
        text: "El reporte es generado por un sistema automatizado por la empresa Mardely.",
      },
      pageEnable: true,
      pageLabel: "Página ",
    };

    // Crear el PDF
    const pdfCreated = jsPDFInvoiceTemplate(props);

    // Guardar el PDF
    if (pdfCreated.jsPDFDocObject) {
      pdfCreated.jsPDFDocObject.save(); // Guardar el PDF con el nombre especificado
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
    >
      Descargar PDF
    </button>
  );
}
