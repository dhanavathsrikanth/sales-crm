CREATE TYPE "public"."vehicle_type" AS ENUM('motorbike', 'car', 'other');--> statement-breakpoint
CREATE TABLE "odometer_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"start_reading" numeric NOT NULL,
	"end_reading" numeric,
	"distance_km" numeric,
	"vehicle_type" "vehicle_type" DEFAULT 'motorbike',
	"vehicle_number" text,
	"fuel_filled" numeric,
	"fuel_cost" numeric,
	"ta_rate_per_km" numeric DEFAULT '4',
	"ta_amount" numeric,
	"purpose" text,
	"linked_visit_ids" uuid[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_vehicle_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_ta_rate" numeric DEFAULT '4';--> statement-breakpoint
ALTER TABLE "odometer_logs" ADD CONSTRAINT "odometer_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;