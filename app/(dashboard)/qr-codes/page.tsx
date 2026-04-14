"use client";

import { useCallback, useEffect, useState } from "react";
import { QrCode, Download, Loader2, RefreshCw, Check, FileText, Search, Link as LinkIcon, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";

interface QrData {
  tableId: string;
  tableNumber: number;
  label: string | null;
  qr: { id: string; url: string; dataUrl: string } | null;
}

export default function QrCodesPage() {
  const { restaurantId } = useSession();
  const [qrCodes, setQrCodes] = useState<QrData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [canPrintable, setCanPrintable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadQrCodes = useCallback(async (rid: string) => {
    const res = await fetch(`/api/restaurant/${rid}/qr`);
    if (res.ok) setQrCodes(await res.json());
    setLoading(false);
  }, []);

  const loadAllowedFeatures = useCallback(async (rid: string) => {
    const res = await fetch(`/api/restaurant/${rid}/qr/config`);
    if (!res.ok) return;
    const data = await res.json();
    setCanPrintable(!!data?.allowedFeatures?.qrPrintableTemplate);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQrCodes(restaurantId);
    loadAllowedFeatures(restaurantId);
  }, [restaurantId, loadQrCodes, loadAllowedFeatures]);

  async function handleGenerate() {
    if (!restaurantId) return;
    setGenerating(true);

    const res = await fetch(`/api/restaurant/${restaurantId}/qr`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.generated} QR generados exitosamente`);
      loadQrCodes(restaurantId);
    } else {
      toast.error("Hubo un error al generar los QR");
    }
    setGenerating(false);
  }

  function downloadQr(dataUrl: string, label: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${label.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  async function copyUrl(url: string, tableId: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(tableId);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  const tablesWithoutQr = qrCodes.filter((q) => !q.qr);
  const tablesWithQr = qrCodes.filter((q) => q.qr);
  
  const filteredQrCodes = qrCodes.filter(q => 
    (q.label || `Mesa ${q.tableNumber}`).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Jerárquico */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Códigos QR</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Administra los escaneos físicos de tus mesas. Tienes <span className="font-semibold text-gray-700">{tablesWithQr.length}</span> activos.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Barra de Búsqueda */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            <input
              type="text"
              placeholder="Buscar mesa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl border border-gray-200 bg-white text-[14px] outline-none transition-all focus:border-gray-900 focus:ring-1 focus:ring-gray-900 shadow-sm"
            />
          </div>

          {tablesWithoutQr.length > 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 px-4 py-2 text-[14px] font-medium text-white transition-all shadow-sm focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generar {tablesWithoutQr.length} faltantes
            </button>
          )}
        </div>
      </div>

      {loading ? (
        // Loading Skeleton
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
              <div className="h-5 bg-gray-200 rounded-md w-1/3 mb-4"></div>
              <div className="w-full aspect-square bg-gray-100 rounded-[20px] mb-5"></div>
              <div className="h-10 bg-gray-100 rounded-xl w-full mb-2"></div>
              <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : qrCodes.length === 0 ? (
        // Premium Empty State
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-5 shadow-sm">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Aún no hay mesas creadas</h3>
          <p className="text-[14px] text-gray-500 max-w-sm">
            Para generar un código QR, el primer paso es definir las mesas de tu restaurante en la sección de ajustes.
          </p>
        </div>
      ) : filteredQrCodes.length === 0 ? (
        // Empty Search
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-8 h-8 text-gray-300 mb-4" />
          <p className="text-[14px] text-gray-900 font-medium mb-1">Sin resultados</p>
          <p className="text-[14px] text-gray-500">No se encontraron mesas para &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        // QR Grid
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredQrCodes.map((item) => (
            <div 
              key={item.tableId}
              className="bg-white rounded-[24px] border border-gray-200 p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow group overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-bold text-gray-900 tracking-tight truncate pr-2">
                  {item.label || `Mesa ${item.tableNumber}`}
                </span>
                
                {item.qr && (
                  <button
                    onClick={() => copyUrl(item.qr!.url, item.tableId)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
                    title="Copiar URL al portapapeles"
                  >
                    {copiedId === item.tableId ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {item.qr ? (
                <>
                  <div className="w-full aspect-square bg-gray-50 rounded-[20px] border border-gray-100 p-4 mb-5 flex items-center justify-center group-hover:bg-gray-100/50 transition-colors">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.qr.dataUrl}
                      alt={`QR Mesa ${item.tableNumber}`}
                      className="w-full h-full object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  
                  <div className="mt-auto flex flex-col gap-2">
                    {canPrintable && restaurantId && (
                      <a
                        href={`/api/restaurant/${restaurantId}/qr/table/${item.tableId}/printable`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Obtener Plantilla PDF
                      </a>
                    )}
                    
                    <button
                      onClick={() =>
                        downloadQr(
                          item.qr!.dataUrl,
                          item.label || `mesa-${item.tableNumber}`
                        )
                      }
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                      Descargar PNG
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                    <QrCode className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-[13px] text-gray-500 text-center font-medium">
                    Falta generar QR
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
