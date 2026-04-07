"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    restaurantName: "",
    restaurantSlug: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generar slug del nombre del restaurante
    if (field === "restaurantName") {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setForm((prev) => ({ ...prev, restaurantSlug: slug }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar");
        setLoading(false);
        return;
      }

      // Redirigir al login
      router.push("/login?registered=true");
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-2">
          <span className="text-primary-foreground font-bold">SC</span>
        </div>
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Registra tu restaurante</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Tu nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Samuel Bastidas"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="tu@restaurante.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Contrasena</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>Nombre del restaurante</Label>
            <Input
              value={form.restaurantName}
              onChange={(e) => updateField("restaurantName", e.target.value)}
              placeholder="Mi Restaurante"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>URL del restaurante</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">smartcheckout.co/</span>
              <Input
                value={form.restaurantSlug}
                onChange={(e) => updateField("restaurantSlug", e.target.value)}
                placeholder="mi-restaurante"
                required
                className="flex-1"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Crear cuenta gratis"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
