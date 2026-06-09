import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  contactPerson: string | null;
  projectName: string | null;
  city: string | null;
  mobile: string | null;
  userName: string;
}

export default function QuickShare({ contactPerson, projectName, city, mobile, userName }: Props) {
  const message = `Hi ${contactPerson || "there"}, I'm ${userName} from PRISM RMC. Following up on your project ${projectName || "your project"} at ${city || "your site"}. Please let me know a good time to discuss your concrete requirements.`;

  const waUrl = mobile
    ? `https://wa.me/${mobile.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`
    : "#";

  return (
    <a href={waUrl} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="gap-1.5">
        <MessageSquare className="h-4 w-4 text-emerald-500" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
    </a>
  );
}
