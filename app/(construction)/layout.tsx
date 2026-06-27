import ConstrSidebar from "@/components/construction/ConstrSidebar";
import ConstructionMobileNav from "@/components/construction/ConstructionMobileNav";

export default function ConstructionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <ConstrSidebar />
      <div className="flex-1 w-full max-w-full lg:ml-64">
        <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 pb-20 lg:pb-6">
          {children}
        </div>
      </div>
      <ConstructionMobileNav />
    </div>
  );
}
