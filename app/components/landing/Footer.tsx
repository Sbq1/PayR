import Link from "next/link";

const columns = [
  {
    title: "Producto",
    links: [
      { label: "Cómo funciona", href: "#historia" },
      { label: "Features", href: "#features" },
      { label: "Precios", href: "#precios" },
      { label: "Integraciones", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "#" },
      { label: "Contacto", href: "mailto:hola@smart-checkout.co" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos", href: "#" },
      { label: "Privacidad", href: "#" },
      { label: "Seguridad", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative bg-white border-t border-gray-100">
      <div className="max-w-[1280px] mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-[13px] tracking-tighter">
                    SC
                  </span>
                </div>
              </div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight">
                Smart Checkout
              </span>
            </Link>
            <p className="text-[13px] text-gray-500 leading-relaxed max-w-[280px]">
              Pagos QR para restaurantes. Integrado con Wompi y Siigo.
              Hecho en Colombia.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-semibold text-gray-900 uppercase tracking-widest mb-4">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-gray-100">
          <p className="text-[12px] text-gray-400">
            © {new Date().getFullYear()} Smart Checkout · Todos los derechos reservados
          </p>
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Todos los sistemas operativos
          </div>
        </div>
      </div>
    </footer>
  );
}
