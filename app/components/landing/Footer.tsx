export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <span className="text-white font-semibold text-[10px]">SC</span>
            </div>
            <span className="text-[14px] font-semibold text-gray-900">Smart Checkout</span>
          </div>
          <div className="flex items-center gap-8 text-[13px] text-gray-500">
            {["Flujo", "Precios"].map((item) => (
              <a
                key={item}
                href={`#${item === "Flujo" ? "historia" : "precios"}`}
                className="hover:text-gray-900 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <p className="text-[13px] text-gray-400">
            © {new Date().getFullYear()} Smart Checkout
          </p>
        </div>
      </div>
    </footer>
  );
}
