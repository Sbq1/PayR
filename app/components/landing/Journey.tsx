import { motion } from "framer-motion";
import { Receipt, CreditCard, PieChart } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const steps = [
  {
    id: 1,
    title: "1. Comandas inmediatas",
    desc: "Tus meseros toman el pedido o los clientes piden solos en la mesa. Las comandas y la cuenta se actualizan en tu dashboard instantáneamente.",
    icon: Receipt,
  },
  {
    id: 2,
    title: "2. Pago con cero fricción",
    desc: "A través de un código interactivo, el cliente visualiza su recibo en el momento exacto, divide la cuenta si lo desea y finaliza con su billetera preferida.",
    icon: CreditCard,
  },
  {
    id: 3,
    title: "3. Cierre automático",
    desc: "El sistema sincroniza el resultado cerrando la mesa de manera automática, dejándote reportes detallados y operaciones sin fallas en efectivo.",
    icon: PieChart,
  },
];

export function Journey() {
  const [activeStep, setActiveStep] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const progress = -rect.top / (rect.height - window.innerHeight);
      
      if (progress < 0.33) setActiveStep(1);
      else if (progress < 0.66) setActiveStep(2);
      else setActiveStep(3);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // init
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="historia" className="relative bg-white border-t border-gray-200" ref={containerRef}>
      <div className="h-[250vh] hidden lg:block">
        <div className="sticky top-0 h-screen flex items-center">
          <div className="max-w-[1200px] mx-auto w-full px-6 grid grid-cols-2 gap-16">
            
            <div className="flex flex-col justify-center h-screen py-20 pr-12">
              <span className="text-[12px] font-medium text-gray-500 uppercase tracking-widest mb-6 block">
                La experiencia completa
              </span>
              
              <div className="relative">
                {steps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`absolute inset-x-0 top-0 transition-all duration-700 ease-out transform ${
                      activeStep === step.id 
                        ? 'opacity-100 translate-y-0 relative' 
                        : activeStep > step.id 
                          ? 'opacity-0 -translate-y-12 absolute pointer-events-none'
                          : 'opacity-0 translate-y-12 absolute pointer-events-none'
                    }`}
                  >
                    <h3 className="text-[32px] font-bold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-[18px] text-gray-500 leading-relaxed pr-8">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center p-12 relative overflow-hidden transition-all duration-500 shadow-sm">
                
                {steps.map((step) => (
                  <motion.div
                    key={`visual-${step.id}`}
                    initial={false}
                    animate={{
                      opacity: activeStep === step.id ? 1 : 0,
                      scale: activeStep === step.id ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ pointerEvents: activeStep === step.id ? 'auto' : 'none' }}
                  >
                    <div className="w-24 h-24 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center">
                      <step.icon className="w-10 h-10 text-gray-900" />
                    </div>
                    {/* UI Context */}
                    <div className="w-3/4 h-1/3 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[12px] font-mono text-gray-400 bg-white">
                      SYS_STATE: {activeStep === 1 ? 'WAITING_PAYMENT' : activeStep === 2 ? 'PROCESSING_TX' : 'CLOSED_SUCCESS'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="lg:hidden py-24 bg-white">
        <div className="px-6 mb-12">
          <span className="text-[12px] font-medium text-gray-500 uppercase tracking-widest block mb-4">
            La experiencia completa
          </span>
          <h2 className="text-[28px] font-bold tracking-tight text-gray-900 leading-tight">
            Así funciona la orquestación en la mesa.
          </h2>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-6 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {steps.map((step) => (
            <div key={`mobile-${step.id}`} className="min-w-[85vw] sm:min-w-[400px] snap-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 h-full flex flex-col shadow-sm">
                <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center mb-6 shadow-sm">
                  <step.icon className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-[20px] font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-[15px] text-gray-500 leading-relaxed pb-6">
                  {step.desc}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <span className="text-[11px] font-mono text-gray-400 uppercase">
                    Paso {step.id} / 3
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
