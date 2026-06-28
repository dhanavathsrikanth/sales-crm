import Link from "next/link";
import ConstrSidebar from "@/components/construction/ConstrSidebar";
import ConstructionMobileNav from "@/components/construction/ConstructionMobileNav";
import { ArrowLeft } from "lucide-react";

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
        <div className="lg:hidden flex items-center gap-2 px-3 sm:px-4 pt-2 pb-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg bg-white border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to RMC
          </Link>
          <span className="text-xs text-zinc-400 font-medium">ConstruPanel</span>
        </div>
        <main className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 pb-20 lg:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <ConstructionMobileNav />
    </>
  );
}
