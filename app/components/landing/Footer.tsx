"use client";

import Link from "next/link";

// Inline SVGs — lucide-react ya no incluye brand icons por temas de licencia.
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-[#1c1410] text-[#fdfaf6] border-t border-[#3f2a24]">
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Logo & Info */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
               <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c2410c] text-white">
                 <span className="font-serif font-bold text-lg leading-none -translate-y-px">P</span>
               </div>
               <span className="font-serif font-bold text-[24px] tracking-tight text-white">PayR</span>
            </Link>
            <p className="text-[15px] leading-6 text-[#a8a29e] max-w-sm">
              El stack financiero moderno para restaurantes en Colombia. Sin contacto, sin hardware, sin fricción.
            </p>
            <div className="flex space-x-5">
              <a href="#" className="text-[#a8a29e] hover:text-[#fbbf24] transition-colors">
                <span className="sr-only">Twitter</span>
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-[#a8a29e] hover:text-[#fbbf24] transition-colors">
                <span className="sr-only">Instagram</span>
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-[#a8a29e] hover:text-[#fbbf24] transition-colors">
                <span className="sr-only">LinkedIn</span>
                <LinkedinIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-[14px] font-semibold text-white uppercase tracking-wider">Plataforma</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="#producto" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Características</Link></li>
                  <li><Link href="/pricing" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Tarifas</Link></li>
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Sincronización POS</a></li>
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Enterprise</a></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-[14px] font-semibold text-white uppercase tracking-wider">Compañía</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Sobre Nosotros</a></li>
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Prensa</a></li>
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Partner Network</a></li>
                  <li><a href="mailto:hola@smartcheckout.co" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Contacto</a></li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-[14px] font-semibold text-white uppercase tracking-wider">Recursos</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Centro de Ayuda</a></li>
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">API & Docs</a></li>
                  <li><a href="#" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Community</a></li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-[14px] font-semibold text-white uppercase tracking-wider">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li><Link href="/privacy" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Privacidad</Link></li>
                  <li><Link href="/terms" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Términos</Link></li>
                  <li><Link href="/cookies" className="text-[14px] text-[#a8a29e] hover:text-white transition-colors">Cookies</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="mt-16 border-t border-[#3f2a24] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] text-[#78716c]">
            &copy; {new Date().getFullYear()} PayR (Smart Checkout). Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-[13px] text-[#78716c]">
             <span>Hecho en 🇨🇴 para el mundo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
