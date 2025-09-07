CREATE TABLE "emotion_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"trade_id" varchar,
	"emotion_id" varchar,
	"user_emotion_id" varchar,
	"notes" text,
	"intensity" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emotions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"icon" varchar NOT NULL,
	"category" varchar NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL,
	CONSTRAINT "emotions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" varchar NOT NULL,
	"name" varchar NOT NULL,
	"tick_value" numeric(10, 2) NOT NULL,
	"tick_size" numeric(10, 4) NOT NULL,
	"multiplier" integer DEFAULT 1 NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	CONSTRAINT "instruments_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"account_id" varchar NOT NULL,
	"instrument_id" varchar,
	"custom_instrument" varchar,
	"direction" varchar NOT NULL,
	"entry_price" numeric(10, 4),
	"exit_price" numeric(10, 4),
	"lot_size" integer NOT NULL,
	"pnl" numeric(12, 2),
	"custom_pnl" numeric(12, 2),
	"status" varchar DEFAULT 'open' NOT NULL,
	"result" varchar,
	"notes" text,
	"image_url" varchar,
	"entry_time" timestamp DEFAULT now(),
	"exit_time" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trading_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"account_type" varchar NOT NULL,
	"initial_capital" numeric(15, 2) NOT NULL,
	"current_capital" numeric(15, 2) NOT NULL,
	"currency" varchar DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_emotions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"icon" varchar NOT NULL,
	"category" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"is_public_profile" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "emotion_logs" ADD CONSTRAINT "emotion_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotion_logs" ADD CONSTRAINT "emotion_logs_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotion_logs" ADD CONSTRAINT "emotion_logs_emotion_id_emotions_id_fk" FOREIGN KEY ("emotion_id") REFERENCES "public"."emotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotion_logs" ADD CONSTRAINT "emotion_logs_user_emotion_id_user_emotions_id_fk" FOREIGN KEY ("user_emotion_id") REFERENCES "public"."user_emotions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_account_id_trading_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emotions" ADD CONSTRAINT "user_emotions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");