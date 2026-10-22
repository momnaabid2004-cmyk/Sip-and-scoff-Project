-- Supabase exposes the public schema through its REST API (PostgREST) to anyone holding the anon key.
-- Enabling Row Level Security with NO policies blocks that API completely for these tables.
-- The website itself connects as the database owner (DATABASE_URL), which bypasses RLS, so nothing else changes.
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "features" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscribers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enquiries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_conversations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;
