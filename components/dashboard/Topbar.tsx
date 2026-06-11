"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Bell, Search, Menu, X, AlertCircle, CalendarCheck, Flame, CheckCircle2, Settings } from "lucide-react";
import { useAppStore } from "@/store";
import { UserButton } from "@clerk/nextjs";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

const quotes = [
  "\"Your attitude determines your altitude\"",
  "\"Success is not final, failure is not fatal\"",
  "\"The only way to do great work is to love what you do\"",
  "\"Believe you can and you're halfway there\"",
  "\"Small daily improvements lead to big results\"",
  "\"Every sale begins with a conversation\"",
  "\"The best time to plant a tree was 20 years ago\"",
  "\"Don't watch the clock; do what it does. Keep going\"",
  "\"The expert in anything was once a beginner\"",
  "\"Your only limit is your mind\"",
  "\"Effort is the bridge between a goal and achievement\"",
  "\"Be the reason someone smiles today\"",
  "\"Success is walking from failure to failure with enthusiasm\"",
  "\"Action is the foundational key to all success\"",
  "\"Dream big. Start small. Act now\"",
  "\"Hard work beats talent when talent doesn't work hard\"",
  "\"The secret of getting ahead is getting started\"",
  "\"Opportunities don't happen. You create them\"",
  "\"Do what you can, with what you have, where you are\"",
  "\"It always seems impossible until it's done\"",
  "\"Push yourself, because no one else is going to do it for you\"",
  "\"Great things never come from comfort zones\"",
  "\"Dream it. Wish it. Do it\"",
  "\"The only bad sale is the one you didn't try to make\"",
  "\"Your biggest competition is your own doubt\"",
  "\"Fall seven times, stand up eight\"",
  "\"The pain you feel today is the strength you feel tomorrow\"",
  "\"Be stronger than your strongest excuse\"",
  "\"Make today so awesome that yesterday gets jealous\"",
  "\"You don't have to be great to start, but you have to start to be great\"",
  "\"The future depends on what you do today\"",
  "\"Winning isn't everything, but wanting to win is\"",
  "\"Nothing worth having comes easy\"",
  "\"Turn your obstacles into opportunities\"",
  "\"Consistency beats intensity\"",
  "\"Your vibe attracts your tribe\"",
  "\"Stay hungry, stay foolish\"",
  "\"Every expert was once a beginner\"",
  "\"The key is not to prioritize what's on your schedule, but to schedule your priorities\"",
  "\"In the middle of difficulty lies opportunity\"",
  "\"What you get by achieving your goals is not as important as what you become\"",
  "\"Be so good they can't ignore you\"",
  "\"Pressure is a privilege\"",
  "\"The way to get started is to quit talking and begin doing\"",
  "\"If you can dream it, you can do it\"",
  "\"Done is better than perfect\"",
  "\"Progress, not perfection\"",
  "\"Make it happen. Shock everyone\"",
  "\"Your only obligation is to fulfill your own potential\"",
  "\"Don't count the days, make the days count\"",
];

function getDailyQuote(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}

const NOTIF_KEY = "prism_crm_notif_settings";

export function getNotifSettings() {
  if (typeof window === "undefined") return { followups: true, daily: true, missed: true };
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    return stored ? JSON.parse(stored) : { followups: true, daily: true, missed: true };
  } catch {
    return { followups: true, daily: true, missed: true };
  }
}

export function saveNotifSettings(s: { followups: boolean; daily: boolean; missed: boolean }) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(s));
}

export default function Topbar() {
  const { user } = useUser();
  const { toggleSidebar, setCommandPaletteOpen } = useAppStore();
  const { data: dashboard } = useDashboard();

  const [notifOpen, setNotifOpen] = useState(false);

  const firstName = user?.firstName || "there";

  const overdueFollowups = dashboard?.dailyFocus?.overdueFollowups?.length || 0;
  const todayFollowups = dashboard?.dailyFocus?.todayFollowups?.length || 0;
  const hotStale = dashboard?.peopleToContact?.hotStale?.length || 0;
  const total = overdueFollowups + hotStale;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 lg:h-14 items-center gap-2 lg:gap-3 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-3 lg:px-6">
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0 lg:flex-none">
          <svg className="h-5 w-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900 truncate">
              {getGreeting()}, {firstName}
            </h2>
            <p className="text-[10px] leading-tight text-zinc-400 truncate">
              {getDailyQuote()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>

          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-md transition-all",
              notifOpen ? "bg-blue-50 text-blue-600" : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            )}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {total > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                {total > 9 ? "9+" : total}
              </span>
            )}
          </button>

          <div className="hidden sm:block">
            <UserButton />
          </div>
        </div>
      </header>

      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
          <div className="absolute right-2 sm:right-4 top-14 z-50 w-[calc(100vw-1rem)] sm:w-80 rounded-xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <h3 className="font-semibold text-sm text-zinc-900">Notifications</h3>
              <div className="flex items-center gap-1">
                <Link
                  href="/settings?tab=notifications"
                  onClick={() => setNotifOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 text-[10px] font-medium"
                  title="Notification Settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {total === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-medium text-zinc-600">All caught up!</p>
                  <p className="text-xs text-zinc-400 mt-1">No pending tasks</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {overdueFollowups > 0 && (
                    <Link
                      href="/followups"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 active:bg-zinc-50 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">Overdue Follow-ups</p>
                        <p className="text-xs text-zinc-500">{overdueFollowups} past due</p>
                      </div>
                    </Link>
                  )}

                  {todayFollowups > 0 && (
                    <Link
                      href="/followups"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 active:bg-zinc-50 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <CalendarCheck className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">Today&apos;s Follow-ups</p>
                        <p className="text-xs text-zinc-500">{todayFollowups} scheduled</p>
                      </div>
                    </Link>
                  )}

                  {hotStale > 0 && (
                    <Link
                      href="/leads"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 active:bg-zinc-50 transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                        <Flame className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900">Hot & Stale Leads</p>
                        <p className="text-xs text-zinc-500">{hotStale} need attention</p>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              <div className="border-t border-zinc-100 px-4 py-2">
                <Link
                  href="/followups"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View all follow-ups
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}