import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  date,
  time,
  boolean,
  jsonb,
  foreignKey,
  vector,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "contacted",
  "meeting_scheduled",
  "site_visited",
  "requirement_received",
  "quotation_sent",
  "negotiation",
  "trial_order",
  "won",
  "lost",
]);

export const projectTypeEnum = pgEnum("project_type", [
  "residential",
  "commercial",
  "industrial",
  "infrastructure",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "excavation",
  "foundation",
  "structural",
  "finishing",
  "completed",
]);

export const followupTypeEnum = pgEnum("followup_type", [
  "call",
  "whatsapp",
  "meeting",
  "site_visit",
  "email",
]);

export const followupPriorityEnum = pgEnum("followup_priority", [
  "high",
  "medium",
  "low",
]);

export const followupStatusEnum = pgEnum("followup_status", [
  "pending",
  "completed",
  "missed",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "lead_created",
  "call",
  "followup_added",
  "visit",
  "photo_uploaded",
  "stage_changed",
  "note_added",
  "quotation_sent",
  "won",
  "lost",
]);

export const photoTypeEnum = pgEnum("photo_type", [
  "site",
  "project",
  "visiting_card",
  "document",
]);

export const fieldTypeEnum = pgEnum("field_type", [
  "text",
  "number",
  "dropdown",
  "date",
  "checkbox",
  "phone",
  "email",
  "textarea",
]);

export const relationshipEnum = pgEnum("relationship", [
  "customer",
  "contractor",
  "consultant",
  "competitor",
  "referral",
  "friend",
]);

export const interactionTypeEnum = pgEnum("interaction_type", [
  "call",
  "whatsapp",
  "meeting",
  "email",
  "site_visit",
  "lunch",
  "referral",
]);

export const directionEnum = pgEnum("direction", [
  "inbound",
  "outbound",
]);

export const sentimentEnum = pgEnum("sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const referralStatusEnum = pgEnum("referral_status", [
  "pending",
  "converted",
  "lost",
]);

export const callStatusEnum = pgEnum("call_status", [
  "connected",
  "missed",
  "no_answer",
  "busy",
]);

export const contactFrequencyEnum = pgEnum("contact_frequency", [
  "weekly",
  "monthly",
  "quarterly",
]);

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "motorbike",
  "car",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  role: text("role").default("sales"),
  defaultVehicleNumber: text("default_vehicle_number"),
  defaultTaRate: numeric("default_ta_rate").default("4"),
  defaultVehicleType: text("default_vehicle_type").default("motorbike"),
  vehicleModel: text("vehicle_model"),
  monthlyKmTarget: numeric("monthly_km_target"),
  remindStartTime: text("remind_start_time").default("08:30"),
  remindEndTime: text("remind_end_time").default("19:00"),
  alertMissingReadings: boolean("alert_missing_readings").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  companyName: text("company_name"),
  clientCompany: text("client_company"),
  builderName: text("builder_name"),
  projectName: text("project_name"),
  contactPerson: text("contact_person"),
  designation: text("designation"),
  mobile: text("mobile"),
  email: text("email"),
  siteAddress: text("site_address"),
  city: text("city"),
  district: text("district"),
  state: text("state"),
  pincode: text("pincode"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  existingVendor: text("existing_vendor"),
  competitorNotes: text("competitor_notes"),
  remarks: text("remarks"),
  stage: leadStageEnum("stage").default("new"),
  leadScore: integer("lead_score").default(0),
  projectType: projectTypeEnum("project_type"),
  projectStatus: projectStatusEnum("project_status"),
  estimatedValue: numeric("estimated_value"),
  numberOfFloors: integer("number_of_floors"),
  builtUpArea: numeric("built_up_area"),
  estimatedM3: numeric("estimated_m3"),
  monthlyM3: numeric("monthly_m3"),
  immediateM3: numeric("immediate_m3"),
  gradeRequirements: text("grade_requirements").array(),
  expectedSupplyDate: date("expected_supply_date"),
  lostReason: text("lost_reason"),
  embedding: vector("embedding", { dimensions: 384 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const followups = pgTable("followups", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  followupDate: date("followup_date").notNull(),
  followupTime: time("followup_time"),
  type: followupTypeEnum("type"),
  priority: followupPriorityEnum("priority"),
  status: followupStatusEnum("status").default("pending"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const visits = pgTable("visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  checkInLat: numeric("check_in_lat"),
  checkInLng: numeric("check_in_lng"),
  checkInAddress: text("check_in_address"),
  checkOutLat: numeric("check_out_lat"),
  checkOutLng: numeric("check_out_lng"),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: activityTypeEnum("type"),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  url: text("url").notNull(),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  type: photoTypeEnum("type"),
  caption: text("caption"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  address: text("address"),
  gpsAccuracy: numeric("gps_accuracy"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customFields = pgTable("custom_fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fieldName: text("field_name"),
  fieldLabel: text("field_label"),
  fieldType: fieldTypeEnum("field_type"),
  options: text("options").array(),
  isRequired: boolean("is_required").default(false),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customFieldValues = pgTable("custom_field_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => customFields.id, { onDelete: "cascade" }),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stageHistory = pgTable("stage_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  fromStage: leadStageEnum("from_stage"),
  toStage: leadStageEnum("to_stage"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    mobile: text("mobile"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    designation: text("designation"),
    company: text("company"),
    relationship: relationshipEnum("relationship"),
    tags: text("tags").array(),
    birthday: date("birthday"),
    anniversary: date("anniversary"),
    personalNotes: text("personal_notes"),
    lastContactedAt: timestamp("last_contacted_at"),
    contactFrequency: contactFrequencyEnum("contact_frequency"),
    referredBy: uuid("referred_by"),
    profilePhoto: text("profile_photo"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.referredBy],
      foreignColumns: [t.id],
    }).onDelete("set null"),
  ],
);

export const interactions = pgTable("interactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  type: interactionTypeEnum("type"),
  direction: directionEnum("direction"),
  duration: integer("duration"),
  summary: text("summary"),
  sentiment: sentimentEnum("sentiment"),
  nextAction: text("next_action"),
  occurredAt: timestamp("occurred_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const personalGoals = pgTable("personal_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: integer("month"),
  year: integer("year"),
  targetLeads: integer("target_leads"),
  targetVisits: integer("target_visits"),
  targetM3: numeric("target_m3"),
  targetRevenue: numeric("target_revenue"),
  targetConversions: integer("target_conversions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quickNotes = pgTable("quick_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  color: text("color").default("yellow"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredByContactId: uuid("referred_by_contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  status: referralStatusEnum("status").default("pending"),
  referralDate: date("referral_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const callLog = pgTable("call_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  phoneNumber: text("phone_number"),
  direction: directionEnum("direction"),
  status: callStatusEnum("status"),
  duration: integer("duration"),
  notes: text("notes"),
  calledAt: timestamp("called_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const odometerLogs = pgTable("odometer_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  startReading: numeric("start_reading").notNull(),
  endReading: numeric("end_reading"),
  distanceKm: numeric("distance_km"),
  vehicleType: vehicleTypeEnum("vehicle_type").default("motorbike"),
  vehicleNumber: text("vehicle_number"),
  fuelFilled: numeric("fuel_filled"),
  fuelCost: numeric("fuel_cost"),
  taRatePerKm: numeric("ta_rate_per_km").default("4"),
  taAmount: numeric("ta_amount"),
  purpose: text("purpose"),
  linkedVisitIds: uuid("linked_visit_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  leads: many(leads),
  followups: many(followups),
  visits: many(visits),
  activities: many(activities),
  photos: many(photos),
  customFields: many(customFields),
  stageHistory: many(stageHistory),
  contacts: many(contacts),
  interactions: many(interactions),
  personalGoals: many(personalGoals),
  quickNotes: many(quickNotes),
  referrals: many(referrals),
  callLog: many(callLog),
  odometerLogs: many(odometerLogs),
}));

export const odometerLogsRelations = relations(odometerLogs, ({ one }) => ({
  user: one(users, {
    fields: [odometerLogs.userId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  followups: many(followups),
  visits: many(visits),
  activities: many(activities),
  photos: many(photos),
  customFieldValues: many(customFieldValues),
  stageHistory: many(stageHistory),
  contacts: many(contacts),
  interactions: many(interactions),
  quickNotes: many(quickNotes),
  referrals: many(referrals),
  callLog: many(callLog),
}));

export const followupsRelations = relations(followups, ({ one }) => ({
  lead: one(leads, {
    fields: [followups.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [followups.userId],
    references: [users.id],
  }),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
  lead: one(leads, {
    fields: [visits.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [visits.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  lead: one(leads, {
    fields: [activities.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  lead: one(leads, {
    fields: [photos.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
}));

export const customFieldsRelations = relations(customFields, ({ one, many }) => ({
  user: one(users, {
    fields: [customFields.userId],
    references: [users.id],
  }),
  values: many(customFieldValues),
}));

export const customFieldValuesRelations = relations(customFieldValues, ({ one }) => ({
  lead: one(leads, {
    fields: [customFieldValues.leadId],
    references: [leads.id],
  }),
  field: one(customFields, {
    fields: [customFieldValues.fieldId],
    references: [customFields.id],
  }),
}));

export const stageHistoryRelations = relations(stageHistory, ({ one }) => ({
  lead: one(leads, {
    fields: [stageHistory.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [stageHistory.userId],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, {
    fields: [contacts.userId],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [contacts.leadId],
    references: [leads.id],
  }),
  referredBy: one(contacts, {
    fields: [contacts.referredBy],
    references: [contacts.id],
  }),
  referrals: many(referrals, { relationName: "referrals_given" }),
  interactions: many(interactions),
  quickNotes: many(quickNotes),
  callLog: many(callLog),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [interactions.contactId],
    references: [contacts.id],
  }),
  lead: one(leads, {
    fields: [interactions.leadId],
    references: [leads.id],
  }),
}));

export const personalGoalsRelations = relations(personalGoals, ({ one }) => ({
  user: one(users, {
    fields: [personalGoals.userId],
    references: [users.id],
  }),
}));

export const quickNotesRelations = relations(quickNotes, ({ one }) => ({
  user: one(users, {
    fields: [quickNotes.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [quickNotes.contactId],
    references: [contacts.id],
  }),
  lead: one(leads, {
    fields: [quickNotes.leadId],
    references: [leads.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  user: one(users, {
    fields: [referrals.userId],
    references: [users.id],
  }),
  referredByContact: one(contacts, {
    fields: [referrals.referredByContactId],
    references: [contacts.id],
    relationName: "referrals_given",
  }),
  lead: one(leads, {
    fields: [referrals.leadId],
    references: [leads.id],
  }),
}));

export const callLogRelations = relations(callLog, ({ one }) => ({
  user: one(users, {
    fields: [callLog.userId],
    references: [users.id],
  }),
  contact: one(contacts, {
    fields: [callLog.contactId],
    references: [contacts.id],
  }),
  lead: one(leads, {
    fields: [callLog.leadId],
    references: [leads.id],
  }),
}));
