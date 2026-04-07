"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface QrData {
  tableId: string;
  tableNumber: number;
  label: string | null;
  qr: { id: string; url: string; dataUrl: string } | null;
}

export default function QrCodesPage() {
  const [qrCodes, setQrCodes] = useState<QrData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        if (s?.restaurantId) {
          setRestaurantId(s.restaurantId);
          loadQrCodes(s.restaurantId);
        } else {
          setLoading(false);
        }
      });
  }, []);

  async function loadQrCodes(rid: string) {
    const res = await fetch(`/api/restaurant/${rid}/qr`);
    if (res.ok) setQrCodes(await res.json());
    setLoading(false);
  }

  async function handleGenerate() {
    if (!restaurantId) return;
    setGenerating(true);

    const res = await fetch(`/api/restaurant/${restaurantId}/qr`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.generated} QR codes generados`);
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

  const tablesWithoutQr = qrCodes.filter((q) => !q.qr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Codigos QR</h1>
          <p className="text-muted-foreground">
            Genera e imprime los QR para tus mesas
          </p>
        </div>
        {tablesWithoutQr.length > 0 && (
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Generar ({tablesWithoutQr.length})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : qrCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Primero crea mesas, luego genera los QR codes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((item) => (
            <Card key={item.tableId}>
              <CardContent className="pt-6 text-center space-y-3">
                <p className="font-semibold">
                  {item.label || `Mesa ${item.tableNumber}`}
                </p>
                {item.qr ? (
                  <>
                    <img
                      src={item.qr.dataUrl}
                      alt={`QR Mesa ${item.tableNumber}`}
                      className="w-48 h-48 mx-auto rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground break-all">
                      {item.qr.url}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadQr(
                          item.qr!.dataUrl,
                          item.label || `mesa-${item.tableNumber}`
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </>
                ) : (
                  <div className="py-8">
                    <QrCode className="w-12 h-12 mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Sin QR — click "Generar"
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
