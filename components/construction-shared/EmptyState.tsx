import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
