"use client";

import { useEffect, useState, useCallback } from "react";
import { WifiOff, CloudUpload, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { syncToServer, onSyncStatusChange } from "@/lib/offline/sync";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [showSynced, setShowSynced] = useState(false);

  const goOnline = useCallback(() => {
    setOffline(false);
    setSyncing(true);
    syncToServer().finally(() => {
      setSyncing(false);
    });
  }, []);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const handleOnline = () => goOnline();
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsub = onSyncStatusChange((status) => {
      setSyncing(status.syncing);
      if (!status.syncing && status.count > 0) {
        setSyncCount(status.count);
        setShowSynced(true);
        setTimeout(() => setShowSynced(false), 4000);
      }
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsub();
    };
  }, [goOnline]);

  if (showSynced) {
    return (
      <div className="flex items-center justify-center gap-2 bg-emerald-500 px-4 py-2 text-sm font-medium text-white">
        <CheckCircle2 className="h-4 w-4" />
        Synced {syncCount} record{syncCount !== 1 ? "s" : ""} successfully
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-500 px-4 py-2 text-sm font-medium text-white">
        <CloudUpload className="h-4 w-4 animate-bounce" />
        Syncing offline records...
      </div>
    );
  }

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" />
      Offline Mode &mdash; changes will sync when connected
    </div>
  );
}
