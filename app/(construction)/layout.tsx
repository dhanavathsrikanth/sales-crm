import ConstrSidebar from "@/components/construction/ConstrSidebar";

export default function ConstructionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ConstrSidebar />
      <div className="flex-1 w-full max-w-full md:ml-64">
        <div className="px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 pt-14 md:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
