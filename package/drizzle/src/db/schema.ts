import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  json,
  integer,
} from "drizzle-orm/pg-core";

const timestampFields = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
};

export const pictureVocab = pgTable("picture_vocab", {
  id: varchar("id", { length: 16 }).primaryKey(),
  userId: text("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  moderationStatus: varchar("moderation_status", { length: 50 })
    .notNull()
    .default("approved"),
  moderationReason: varchar("moderation_reason", { length: 255 }),
  thumbnail: varchar("thumbnail", { length: 255 }).notNull(),
  preview: varchar("preview", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: json("content"),
  categoryId: integer("category_id").notNull(),
  ...timestampFields,
});

export const uploadImage = pgTable("upload_image", {
  id: serial("id").primaryKey(),
  url: varchar("url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const textSpeech = pgTable("text_speech", {
  id: serial("id").primaryKey(),
  text: varchar("text", { length: 255 }).notNull(),
  locale: varchar("locale", { length: 20 }).notNull(),
  voice: varchar("voice", { length: 20 }).notNull(),
  engine: varchar("engine", { length: 20 }).notNull(),
  hash: varchar("hash", { length: 64 }).notNull().unique(),
  audioUrl: varchar("audio_url", { length: 255 }).notNull(),
  ...timestampFields,
});

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestampFields,
});
