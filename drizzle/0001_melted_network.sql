CREATE TABLE "uploaded_image" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"original_name" text,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uploaded_image" ADD CONSTRAINT "uploaded_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;