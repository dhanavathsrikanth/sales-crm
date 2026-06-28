import ConstrSidebar from "@/components/construction/ConstrSidebar";
import ConstructionMobileNav from "@/components/construction/ConstructionMobileNav";

export default function ConstructionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .constr-content { margin-left: 16rem; }
        }
      `}</style>
      <ConstrSidebar />
      <div className="constr-content min-h-screen bg-zinc-50">
        <main className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 pb-20 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ConstructionMobileNav />
    </>
  );
}
