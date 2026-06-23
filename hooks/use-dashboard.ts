import { useQuery } from "@tanstack/react-query";

export interface OverdueFollowup {
  id: string;
  leadId: string | null;
  followupDate: string | null;
  followupTime: string | null;
  type: string | null;
  priority: string | null;
  notes: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
}

export interface StaleLead {
  id: string;
  companyName: string | null;
  contactPerson: string | null;
  stage: string | null;
  mobile: string | null;
  createdAt: string | null;
}

export interface HotLead {
  id: string;
  companyName: string | null;
  contactPerson: string | null;
  stage: string | null;
  estimatedValue: string | null;
  estimatedM3: string | null;
  mobile: string | null;
  email: string | null;
}

export interface TodayFollowup {
  id: string;
  leadId: string | null;
  followupTime: string | null;
  type: string | null;
  priority: string | null;
  notes: string | null;
  status: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
}

export interface TodayVisit {
  id: string;
  leadId: string | null;
  checkInAddress: string | null;
  notes: string | null;
  leadCompanyName: string | null;
}

export interface PeopleDue {
  id: string;
  leadId: string | null;
  leadCompanyName: string | null;
  leadContactPerson: string | null;
  followupType: string | null;
  reason: string;
  mobile: string | null;
  contactPerson: string | null;
}

export interface BirthdayContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  mobile: string | null;
  whatsapp: string | null;
  birthday: string | null;
  leadId: string | null;
}

export interface FrequencyContact {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  mobile: string | null;
  whatsapp: string | null;
  contactFrequency: string | null;
  lastContactedAt: string | null;
  leadId: string | null;
}

export interface HotStaleContact {
  id: string;
  companyName: string | null;
  contactPerson: string | null;
  stage: string | null;
  mobile: string | null;
}

export interface Activity {
  id: string;
  type: string | null;
  description: string | null;
  createdAt: string | null;
}

export interface PinnedNote {
  id: string;
  userId: string;
  contactId: string | null;
  leadId: string | null;
  content: string;
  color: string | null;
  isPinned: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Goal {
  id: string;
  userId: string;
  month: number | null;
  year: number | null;
  targetLeads: number | null;
  targetVisits: number | null;
  targetM3: string | null;
  targetRevenue: string | null;
  targetConversions: number | null;
}

export interface DashboardData {
  user: { name: string };
  dailyFocus: {
    overdueFollowups: OverdueFollowup[];
    staleLeads: StaleLead[];
    hotLeads: HotLead[];
    todayFollowups: TodayFollowup[];
    todayVisits: TodayVisit[];
    upcomingWeekFollowupsCount: number;
    weekLeadsNeedingMovement: number;
  };
  myNumbers: {
    leadsCreatedThisMonth: number;
    visitsThisMonth: number;
    dealsWonThisMonth: number;
    m3Pipeline: number;
    goals: Goal | null;
  };
  stageCounts: { stage: string | null; count: number }[];
  peopleToContact: {
    followupsDue: PeopleDue[];
    birthdays: BirthdayContact[];
    frequencyDue: FrequencyContact[];
    hotStale: HotStaleContact[];
  };
  recentActivities: Activity[];
  pinnedNotes: PinnedNote[];
  pendingCount: number;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
}
