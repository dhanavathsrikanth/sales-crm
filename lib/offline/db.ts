import Dexie, { type EntityTable } from "dexie";

export interface OfflineLead {
  id?: string;
  userId?: string;
  companyName?: string;
  clientCompany?: string;
  builderName?: string;
  projectName?: string;
  contactPerson?: string;
  designation?: string;
  mobile?: string;
  email?: string;
  siteAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: string;
  longitude?: string;
  existingVendor?: string;
  competitorNotes?: string;
  remarks?: string;
  stage?: string;
  leadScore?: number;
  projectType?: string;
  projectStatus?: string;
  estimatedValue?: string;
  numberOfFloors?: number;
  builtUpArea?: string;
  estimatedM3?: string;
  monthlyM3?: string;
  immediateM3?: string;
  gradeRequirements?: string[];
  expectedSupplyDate?: string;
  synced: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OfflineFollowup {
  id?: string;
  leadId: string;
  userId?: string;
  followupDate: string;
  followupTime?: string;
  type?: string;
  priority?: string;
  status?: string;
  notes?: string;
  completedAt?: string;
  synced: boolean;
  createdAt: string;
}

export interface OfflineVisit {
  id?: string;
  leadId: string;
  userId?: string;
  checkInTime?: string;
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

export interface OfflineActivity {
  id?: string;
  leadId: string;
  userId?: string;
  type?: string;
  description?: string;
  metadata?: any;
  synced: boolean;
  createdAt: string;
}

export interface SyncQueueItem {
  id?: number;
  action: "create" | "update" | "delete";
  table: "leads" | "followups" | "visits" | "activities";
  recordId?: string;
  data: any;
  createdAt: string;
}

const db = new Dexie("PrismCRM") as Dexie & {
  leads: EntityTable<OfflineLead, "id">;
  followups: EntityTable<OfflineFollowup, "id">;
  visits: EntityTable<OfflineVisit, "id">;
  activities: EntityTable<OfflineActivity, "id">;
  syncQueue: EntityTable<SyncQueueItem, "id">;
};

db.version(1).stores({
  leads: "id, synced, createdAt",
  followups: "id, leadId, synced, createdAt",
  visits: "id, leadId, synced, createdAt",
  activities: "id, leadId, synced, createdAt",
  syncQueue: "++id, createdAt, table",
});

export async function saveOfflineLead(lead: Omit<OfflineLead, "synced">) {
  await db.leads.put({ ...lead, synced: false });
}

export async function getOfflineLeads() {
  return db.leads.toArray();
}

export async function getOfflineLeadById(id: string) {
  return db.leads.get(id);
}

export async function saveOfflineFollowup(followup: Omit<OfflineFollowup, "synced">) {
  await db.followups.put({ ...followup, synced: false });
}

export async function getOfflineFollowups() {
  return db.followups.toArray();
}

export async function saveOfflineVisit(visit: Omit<OfflineVisit, "synced">) {
  await db.visits.put({ ...visit, synced: false });
}

export async function getOfflineVisits() {
  return db.visits.toArray();
}

export async function getActiveOfflineVisit() {
  const all = await db.visits.filter((v) => !v.checkOutTime).toArray();
  return all[0] || null;
}

export async function checkoutOfflineVisit(id: string, data: Partial<OfflineVisit>) {
  await db.visits.update(id, { ...data, synced: false });
}

export async function saveOfflineActivity(activity: Omit<OfflineActivity, "synced">) {
  await db.activities.put({ ...activity, synced: false });
}

export async function getOfflineActivities(leadId?: string) {
  if (leadId) return db.activities.where("leadId").equals(leadId).toArray();
  return db.activities.toArray();
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "createdAt">) {
  await db.syncQueue.add({ ...item, createdAt: new Date().toISOString() });
}

export async function getSyncQueue() {
  return db.syncQueue.orderBy("createdAt").toArray();
}

export async function removeSyncQueueItem(id: number) {
  await db.syncQueue.delete(id);
}

export async function clearSyncQueue() {
  await db.syncQueue.clear();
}

export async function markSynced(table: "leads" | "followups" | "visits" | "activities", id: string) {
  await db[table].update(id, { synced: true });
}

export async function getUnsyncedRecords(table: "leads" | "followups" | "visits" | "activities") {
  return db[table].where("synced").equals(0).toArray() as unknown as any[];
}

export default db;
