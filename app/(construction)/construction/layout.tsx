import ConstrSidebar from "@/components/construction/ConstrSidebar";

export default function ConstructionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ConstrSidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50 ml-64">{children}</main>
    </div>
  );
}
