import ConstrSidebar from "@/components/construction/ConstrSidebar";
import ConstructionMobileNav from "@/components/construction/ConstructionMobileNav";

export default function ConstructionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ConstrSidebar />
      <div className="flex flex-1 flex-col w-full max-w-full lg:ml-64 transition-all duration-300">
        <main className="flex-1 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 pb-20 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ConstructionMobileNav />
    </div>
  );
}
