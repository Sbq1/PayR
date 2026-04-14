"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";

const CLIENT_ALLOWED_MIMES = ["image/png", "image/jpeg", "image/webp"];
const CLIENT_MAX_BYTES = 512_000;

interface Props {
  restaurantId: string;
  onChange: (hasLogo: boolean) => void;
}

type Status = "idle" | "loading" | "uploading" | "deleting";

export function QrLogoUploader({ restaurantId, onChange }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [savedDataUrl, setSavedDataUrl] = useState<string | null>(null);
  const [pending, setPending] = useState<{ file: File; previewUrl: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = pending?.previewUrl ?? savedDataUrl;
  const hasSaved = savedDataUrl !== null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/restaurant/${restaurantId}/qr/logo`);
        if (!res.ok) {
          if (!cancelled) setStatus("idle");
          return;
        }
        const data: { hasLogo: boolean; dataUrl?: string } = await res.json();
        if (cancelled) return;
        if (data.hasLogo && data.dataUrl) {
          setSavedDataUrl(data.dataUrl);
        }
        setStatus("idle");
      } catch {
        if (!cancelled) setStatus("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    return () => {
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending?.previewUrl]);

  const validateClient = useCallback((file: File): string | null => {
    if (!CLIENT_ALLOWED_MIMES.includes(file.type)) {
      return "Formato no permitido. Usa PNG, JPEG o WebP.";
    }
    if (file.size > CLIENT_MAX_BYTES) {
      return `El archivo supera el límite de ${Math.round(CLIENT_MAX_BYTES / 1024)} KB.`;
    }
    if (file.size === 0) {
      return "El archivo está vacío.";
    }
    return null;
  }, []);

  const selectFile = useCallback(
    (file: File) => {
      const err = validateClient(file);
      if (err) {
        toast.error(err);
        return;
      }
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
      setPending({ file, previewUrl: URL.createObjectURL(file) });
    },
    [validateClient, pending?.previewUrl],
  );

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!pending) return;
    setStatus("uploading");
    try {
      const form = new FormData();
      form.append("logo", pending.file);
      const res = await fetch(`/api/restaurant/${restaurantId}/qr/logo`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) {
          toast.error(err.error || "Tu plan no incluye logo embebido");
        } else if (res.status === 429) {
          toast.error("Demasiados intentos — espera un momento");
        } else {
          toast.error(err.error || "No se pudo subir el logo");
        }
        setStatus("idle");
        return;
      }

      const fresh = await fetch(`/api/restaurant/${restaurantId}/qr/logo`);
      if (fresh.ok) {
        const data: { hasLogo: boolean; dataUrl?: string } = await fresh.json();
        if (data.hasLogo && data.dataUrl) setSavedDataUrl(data.dataUrl);
      }
      URL.revokeObjectURL(pending.previewUrl);
      setPending(null);
      onChange(true);
      toast.success("Logo guardado");
    } catch {
      toast.error("Error de red");
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async () => {
    if (!hasSaved) return;
    if (!confirm("¿Quitar el logo del QR?")) return;
    setStatus("deleting");
    try {
      const res = await fetch(`/api/restaurant/${restaurantId}/qr/logo`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("No se pudo quitar el logo");
        setStatus("idle");
        return;
      }
      setSavedDataUrl(null);
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
      setPending(null);
      onChange(false);
      toast.success("Logo eliminado");
    } catch {
      toast.error("Error de red");
    } finally {
      setStatus("idle");
    }
  };

  const handleDiscard = () => {
    if (!pending) return;
    URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  };

  const busy = status !== "idle";
  const canUpload = pending !== null && !busy;
  const showDelete =
    hasSaved &&
    pending === null &&
    (status === "idle" || status === "deleting");
  const deleteDisabled = status !== "idle";

  const helperText = useMemo(() => {
    if (pending) return "Archivo listo para guardar";
    if (hasSaved) return "Logo actual — arrastra uno nuevo para reemplazar";
    return "Arrastra un PNG, JPEG o WebP (≤ 500 KB, ≤ 1000×1000 px)";
  }, [pending, hasSaved]);

  return (
    <div className="space-y-4">
      <label
        htmlFor="logo-input"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex gap-4 items-center rounded-lg border border-dashed p-4 cursor-pointer transition-colors ${
          dragOver
            ? "border-gray-900 bg-gray-50"
            : "border-gray-300 bg-white hover:border-gray-400"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="relative w-20 h-20 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
          {status === "loading" ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          ) : displayUrl ? (
            <Image
              src={displayUrl}
              alt="Logo"
              fill
              sizes="80px"
              className="object-contain p-1.5"
              unoptimized
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-gray-900">
            {pending ? pending.file.name : hasSaved ? "Logo embebido activo" : "Subir logo"}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">{helperText}</p>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-700 shrink-0">
          <Upload className="w-3.5 h-3.5" />
          Explorar
        </div>

        <input
          ref={inputRef}
          id="logo-input"
          type="file"
          accept={CLIENT_ALLOWED_MIMES.join(",")}
          onChange={handleInput}
          disabled={busy}
          className="sr-only"
        />
      </label>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        >
          {status === "uploading" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Guardar logo
        </button>

        {pending && (
          <button
            type="button"
            onClick={handleDiscard}
            disabled={busy}
            className="inline-flex items-center px-3.5 py-2 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Descartar
          </button>
        )}

        {showDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteDisabled}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            {status === "deleting" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Quitar logo
          </button>
        )}
      </div>
    </div>
  );
}
