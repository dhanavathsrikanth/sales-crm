ALTER TABLE "users" ADD COLUMN "default_vehicle_type" text DEFAULT 'motorbike';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vehicle_model" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "monthly_km_target" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "remind_start_time" text DEFAULT '08:30';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "remind_end_time" text DEFAULT '19:00';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "alert_missing_readings" boolean DEFAULT true;