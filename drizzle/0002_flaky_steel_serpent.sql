CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"visible_to_clients" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "uploaded_image" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_image" ADD CONSTRAINT "uploaded_image_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;