import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
