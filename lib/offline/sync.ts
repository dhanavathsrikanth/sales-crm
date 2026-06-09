import { getSyncQueue, removeSyncQueueItem, markSynced } from "./db";

type SyncCallback = (status: { syncing: boolean; count: number; error?: string }) => void;

let syncInProgress = false;
let listeners: SyncCallback[] = [];

export function onSyncStatusChange(cb: SyncCallback) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function notify(status: { syncing: boolean; count: number; error?: string }) {
  listeners.forEach((l) => l(status));
}

export async function syncToServer() {
  if (syncInProgress) return;
  syncInProgress = true;

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    syncInProgress = false;
    notify({ syncing: false, count: 0 });
    return;
  }

  notify({ syncing: true, count: queue.length });

  let synced = 0;
  const errors: string[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(
        item.table === "leads"
          ? "/api/leads"
          : item.table === "followups"
            ? "/api/followups"
            : "/api/visits",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        },
      );

      if (res.ok) {
        const result = await res.json();
        if (item.recordId) {
          await markSynced(item.table as any, item.recordId);
        }
        await removeSyncQueueItem(item.id!);
        synced++;
      } else {
        errors.push(`Failed to sync ${item.table} record: ${res.statusText}`);
        await removeSyncQueueItem(item.id!);
      }
    } catch (e) {
      errors.push(`Network error syncing ${item.table}: ${e}`);
      break;
    }
  }

  syncInProgress = false;

  if (errors.length > 0) {
    notify({ syncing: false, count: synced, error: errors[0] });
  } else {
    notify({ syncing: false, count: synced });
  }
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
