"use client";

import { useState, useMemo } from "react";
import { useConstrTodayOdometerLog, useConstrOdometerLogs, useConstrOdometerStats, useCreateOrUpdateConstrOdometerLog, useDeleteConstrOdometerLog } from "@/hooks/construction/use-mileage";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/construction-shared/PageHeader";
import LoadingSpinner from "@/components/construction-shared/LoadingSpinner";
import { toast } from "sonner";
import {
  Gauge,
  Fuel,
  TrendingUp,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Bike,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  IndianRupee,
} from "lucide-react";

export default function ConstrMileagePage() {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  const [filterKey, setFilterKey] = useState<"week" | "month">("week");
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [purpose, setPurpose] = useState("");

  const todayLogQ = useConstrTodayOdometerLog();
  const saveLog = useCreateOrUpdateConstrOdometerLog();
  const deleteLog = useDeleteConstrOdometerLog();

  const filterParams = useMemo(() => {
    if (filterKey === "week") {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      const e = endOfWeek(now, { weekStartsOn: 1 });
      return { dateFrom: format(s, "yyyy-MM-dd"), dateTo: format(e, "yyyy-MM-dd") };
    }
    const s = startOfMonth(now);
    const e = endOfMonth(now);
    return { dateFrom: format(s, "yyyy-MM-dd"), dateTo: format(e, "yyyy-MM-dd") };
  }, [filterKey]);

  const logsQ = useConstrOdometerLogs(filterParams);
  const statsQ = useConstrOdometerStats();

  const todayLog = todayLogQ.data;
  const isPartial = todayLog && !todayLog.endReading;
  const isComplete = !!(todayLog && todayLog.endReading);
  const distanceToday = todayLog?.startReading && todayLog?.endReading
    ? Number(todayLog.endReading) - Number(todayLog.startReading)
    : 0;
  const taToday = distanceToday * Number(todayLog?.taRatePerKm || 4);

  const previewDistance = endValue && Number(endValue) > Number(todayLog?.startReading)
    ? Number(endValue) - Number(todayLog?.startReading)
    : 0;
  const previewTA = previewDistance * 4;

  const handleSaveStart = () => {
    if (!startValue || isPartial || isComplete) return;
    saveLog.mutate(
      { logDate: today, startReading: startValue, vehicleNumber: vehicleNumber || undefined, purpose: purpose || undefined },
      {
        onSuccess: () => { toast.success("Start reading logged"); setStartValue(""); setVehicleNumber(""); setPurpose(""); },
        onError: () => toast.error("Failed to save"),
      },
    );
  };

  const handleCloseDay = () => {
    if (!endValue || !todayLog || isComplete) return;
    saveLog.mutate(
      {
        logDate: todayLog.logDate,
        startReading: todayLog.startReading,
        endReading: endValue,
        taRatePerKm: todayLog.taRatePerKm || "4",
        vehicleNumber: todayLog.vehicleNumber || undefined,
        purpose: todayLog.purpose || undefined,
      },
      { onSuccess: () => { toast.success("Day closed!"); setEndValue(""); } },
    );
  };

  const fmtNum = (n: number) => n.toLocaleString("en-IN");

  return (
    <div className="space-y-6">
      <PageHeader title="Mileage" subtitle="Track your daily travel and TA" />

      {/* Today's Odometer Card */}
      <div className={cn("rounded-xl border bg-white p-5", isComplete ? "border-emerald-200" : "border-zinc-200")}>
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-zinc-900">
            {isComplete ? "Today's Log Complete" : isPartial ? "End Today's Reading" : "Log Today's Reading"}
          </h2>
        </div>

        {todayLogQ.isLoading ? (
          <LoadingSpinner />
        ) : isComplete ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-700">
                    {Number(todayLog.startReading).toLocaleString("en-IN")} → {Number(todayLog.endReading).toLocaleString("en-IN")} km
                  </p>
                  <p className="text-xs text-emerald-600">
                    {todayLog.vehicleNumber && `${todayLog.vehicleNumber} · `}{todayLog.purpose || "No purpose noted"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase">Distance</p>
                  <p className="text-xl font-bold text-emerald-900">{fmtNum(distanceToday)} km</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase">TA Earned</p>
                  <p className="text-xl font-bold text-emerald-900">₹{fmtNum(taToday)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase">TA Rate</p>
                  <p className="text-xl font-bold text-emerald-900">₹{todayLog.taRatePerKm}/km</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isPartial && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                Started at <strong>{Number(todayLog.startReading).toLocaleString("en-IN")} km</strong> — enter end reading to close the day.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">Start Reading (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 12450"
                  value={startValue}
                  onChange={(e) => setStartValue(e.target.value)}
                  disabled={isPartial || saveLog.isPending}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 block">End Reading (km)</label>
                <input
                  type="number"
                  placeholder={isPartial ? "Enter end reading" : "Fill at day end"}
                  value={endValue}
                  onChange={(e) => setEndValue(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {!isPartial && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-01-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1 block">Purpose</label>
                  <input
                    type="text"
                    placeholder="e.g. Site visit, client meeting..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {isPartial && endValue && Number(endValue) > Number(todayLog.startReading) && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                Today's distance: <strong>{fmtNum(Number(endValue) - Number(todayLog.startReading))} km</strong> · TA: <strong>₹{fmtNum(previewTA)}</strong>
              </div>
            )}

            {isPartial ? (
              <button
                onClick={handleCloseDay}
                disabled={!endValue || saveLog.isPending || isComplete}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveLog.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Close Day
              </button>
            ) : (
              <button
                onClick={handleSaveStart}
                disabled={!startValue || saveLog.isPending || isPartial || isComplete}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveLog.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Log Start
              </button>
            )}
          </div>
        )}
      </div>

      {/* Monthly Stats */}
      {statsQ.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-900">{fmtNum(statsQ.data.totalDistanceKm)}</p>
            <p className="text-[10px] text-zinc-500">This Month (km)</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
            <CalendarDays className="h-5 w-5 text-violet-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-900">{statsQ.data.totalDays}</p>
            <p className="text-[10px] text-zinc-500">Working Days</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
            <IndianRupee className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-900">₹{fmtNum(statsQ.data.totalTaAmount)}</p>
            <p className="text-[10px] text-zinc-500">Total TA</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center">
            <Gauge className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-900">{fmtNum(statsQ.data.avgDailyKm)}</p>
            <p className="text-[10px] text-zinc-500">Avg/Day (km)</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilterKey("week")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            filterKey === "week" ? "bg-white text-blue-700 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          )}
        >
          This Week
        </button>
        <button
          onClick={() => setFilterKey("month")}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            filterKey === "month" ? "bg-white text-blue-700 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          )}
        >
          This Month
        </button>
      </div>

      {/* Logs Table */}
      {logsQ.isLoading ? (
        <LoadingSpinner />
      ) : !logsQ.data?.logs.length ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <Gauge className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-900">No odometer logs found</p>
          <p className="mt-1 text-xs text-zinc-500">Start by logging today's reading above.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Vehicle</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Start</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">End</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">Distance</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">TA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logsQ.data.logs.map((log) => {
                  const isIncomplete = !log.endReading;
                  return (
                    <tr key={log.id} className={cn(isIncomplete ? "bg-amber-50" : "bg-emerald-50/30")}>
                      <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
                        {log.logDate ? format(new Date(log.logDate), "MMM d") : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        <span className="flex items-center gap-1">
                          {log.vehicleType === "car" ? <Car className="h-3 w-3" /> : <Bike className="h-3 w-3" />}
                          {log.vehicleNumber || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-900">
                        {Number(log.startReading).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-900">
                        {log.endReading ? Number(log.endReading).toLocaleString("en-IN") : (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-zinc-900">
                        {log.distanceKm ? `${fmtNum(Number(log.distanceKm))} km` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-900">
                        {log.taAmount ? `₹${fmtNum(Number(log.taAmount))}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 max-w-32 truncate">
                        {log.purpose || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
