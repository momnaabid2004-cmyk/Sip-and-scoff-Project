ALTER TYPE "public"."order_status" ADD VALUE 'confirmed' BEFORE 'preparing';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "confirmed_at" timestamp with time zone;