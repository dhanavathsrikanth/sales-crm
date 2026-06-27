import ConstrSidebar from "@/components/construction/ConstrSidebar";

export default function ConstructionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ConstrSidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50 pt-14 md:pt-0 md:ml-64">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
