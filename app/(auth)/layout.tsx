export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
