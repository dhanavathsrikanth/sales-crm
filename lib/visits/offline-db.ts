import Dexie, { type EntityTable } from "dexie";

interface OfflineVisit {
  id?: string;
  leadId: string;
  leadName?: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLat?: string;
  checkInLng?: string;
  checkInAddress?: string;
  checkOutLat?: string;
  checkOutLng?: string;
  durationMinutes?: number;
  notes?: string;
  synced: boolean;
  createdAt: string;
}

interface SyncQueueItem {
  id?: number;
  action: "checkin" | "checkout";
  payload: string;
  createdAt: string;
}

const db = new Dexie("VisitTracker") as Dexie & {
  offlineVisits: EntityTable<OfflineVisit, "id">;
  syncQueue: EntityTable<SyncQueueItem, "id">;
};

db.version(1).stores({
  offlineVisits: "id, leadId, synced, createdAt",
  syncQueue: "++id, createdAt",
});

export async function saveVisitOffline(visit: Omit<OfflineVisit, "synced">) {
  await db.offlineVisits.put({ ...visit, synced: false });
}

export async function getOfflineVisits() {
  return db.offlineVisits.toArray();
}

export async function getUnsyncedVisits() {
  return db.offlineVisits.where("synced").equals(0).toArray();
}

export async function markVisitSynced(id: string) {
  await db.offlineVisits.update(id, { synced: true });
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "createdAt">) {
  await db.syncQueue.add({ ...item, createdAt: new Date().toISOString() });
}

export async function getSyncQueue() {
  return db.syncQueue.orderBy("createdAt").toArray();
}

export async function clearSyncQueue() {
  await db.syncQueue.clear();
}

export async function removeSyncQueueItem(id: number) {
  await db.syncQueue.delete(id);
}

export async function getActiveOfflineVisit() {
  const all = await db.offlineVisits
    .filter((v) => !v.synced || !v.checkOutTime)
    .toArray();
  return all.find((v) => !v.checkOutTime) || null;
}

export async function checkoutOfflineVisit(id: string, data: { checkOutTime: string; checkOutLat?: string; checkOutLng?: string; durationMinutes?: number; notes?: string }) {
  await db.offlineVisits.update(id, { ...data, synced: false });
}

export default db;
