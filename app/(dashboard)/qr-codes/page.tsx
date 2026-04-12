"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Download, Loader2, RefreshCw, Copy, Check } from "lucide-react";
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

  const loadQrCodes = useCallback(async (rid: string) => {
    const res = await fetch(`/api/restaurant/${rid}/qr`);
    if (res.ok) setQrCodes(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    // loadQrCodes is async — setState inside runs after await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQrCodes(restaurantId);
  }, [restaurantId, loadQrCodes]);

  async function handleGenerate() {
    if (!restaurantId) return;
    setGenerating(true);

    const res = await fetch(`/api/restaurant/${restaurantId}/qr`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.generated} QR generados`);
      loadQrCodes(restaurantId);
    } else {
      toast.error("Error generando QR codes");
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
      toast.success("URL copiada");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  const tablesWithoutQr = qrCodes.filter((q) => !q.qr);
  const tablesWithQr = qrCodes.filter((q) => q.qr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-semibold text-gray-900">Códigos QR</h1>
          <p className="text-[13px] text-gray-500">
            {tablesWithQr.length} de {qrCodes.length} mesas con QR
          </p>
        </div>
        {tablesWithoutQr.length > 0 && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Generar QR ({tablesWithoutQr.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : qrCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-[13px] text-gray-500">
              Primero crea mesas, luego genera los QR codes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((item) => (
            <Card key={item.tableId}>
              <CardContent className="pt-5 text-center space-y-3">
                <p className="text-[14px] font-medium text-gray-900">
                  {item.label || `Mesa ${item.tableNumber}`}
                </p>
                {item.qr ? (
                  <>
                    {/* next/image no optimiza data URIs — usar <img> directo */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.qr.dataUrl}
                      alt={`QR Mesa ${item.tableNumber}`}
                      className="w-44 h-44 mx-auto rounded-lg border border-gray-100"
                    />
                    <p className="text-[11px] text-gray-400 break-all px-2 leading-relaxed">
                      {item.qr.url}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyUrl(item.qr!.url, item.tableId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {copiedId === item.tableId ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        {copiedId === item.tableId ? "Copiado" : "Copiar"}
                      </button>
                      <button
                        onClick={() =>
                          downloadQr(
                            item.qr!.dataUrl,
                            item.label || `mesa-${item.tableNumber}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Descargar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-6">
                    <QrCode className="w-10 h-10 mx-auto text-gray-200" />
                    <p className="text-[12px] text-gray-400 mt-2">
                      Sin QR — usa &quot;Generar QR&quot;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
