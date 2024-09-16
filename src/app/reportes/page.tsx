import dynamic from "next/dynamic";

const DynamicReportContent = dynamic(() => import("./ReportContent"), {
  ssr: false,
});

export default function ReportesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Reportes</h1>
      <DynamicReportContent />
    </div>
  );
}
