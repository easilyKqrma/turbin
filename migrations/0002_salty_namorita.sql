ALTER TABLE "announcements" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "announcements" CASCADE;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "entry_price" SET DATA TYPE numeric(15, 4);--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "exit_price" SET DATA TYPE numeric(15, 4);--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "pnl" SET DATA TYPE numeric(18, 2);--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "custom_pnl" SET DATA TYPE numeric(18, 2);--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "trade_type" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_trade_input" varchar DEFAULT 'modal';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "default_trade_visibility" varchar DEFAULT 'private';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_theme" varchar DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_completed_onboarding" boolean DEFAULT false NOT NULL;