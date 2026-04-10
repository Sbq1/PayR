import Link from "next/link";
import { motion, MotionValue } from "framer-motion";
import { ArrowRight, QrCode } from "lucide-react";

export function Hero({ heroY, heroOpacity }: { heroY: MotionValue<number>; heroOpacity: MotionValue<number> }) {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden bg-white">
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="max-w-[1200px] mx-auto px-6"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 mb-6 uppercase tracking-wider">
                La experiencia Smart
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[48px] md:text-[64px] lg:text-[76px] font-black tracking-tighter leading-[1.0] text-gray-900 mb-6"
            >
              Cobra en <br className="hidden md:block"/> la mesa <br className="hidden md:block"/>
              <span className="text-gray-400">sin terminal.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[16px] md:text-[18px] text-gray-500 max-w-md leading-relaxed mb-10"
            >
              Revoluciona el proceso de pago. Genera un recibo y código únicos. Los clientes escanean, pagan y se van al instante. 
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 text-[15px] font-medium text-white bg-gray-900 px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto shadow-sm"
                >
                  Empezar gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center lg:justify-end">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[340px] aspect-[4/5] bg-gray-50 border border-gray-200 rounded-lg shadow-sm flex flex-col items-center p-8 overflow-hidden group"
            >
              <div className="w-full flex justify-between items-center pb-6 border-b border-gray-200 mb-8">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-[14px]">M5</span>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-medium text-gray-400 uppercase tracking-widest">Mesa 05</p>
                  <p className="text-[14px] font-bold text-gray-900">$84.500</p>
                </div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-40 h-40 md:w-48 md:h-48 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-4 relative"
              >
                <div className="absolute inset-0 bg-gray-100 rounded-lg animate-pulse opacity-50" />
                <QrCode className="w-full h-full text-gray-900 relative z-10" />
              </motion.div>
              
              <p className="text-[13px] text-gray-500 font-medium mt-8 mb-2">Escanea para pagar</p>
              
              <motion.div 
                animate={{ y: [0, 150, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-[140px] md:top-[150px] left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gray-900 shadow-[0_0_8px_rgba(0,0,0,0.5)] z-20"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
