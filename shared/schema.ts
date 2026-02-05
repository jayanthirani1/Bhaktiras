import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Timeline Items
export const timelineItems = pgTable("timeline_items", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
});

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  time: text("time").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  isLive: boolean("is_live").default(false),
});

// Community / Gratitude Wall
export const gratitudeMessages = pgTable("gratitude_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Volunteer / Seva Roles
export const volunteerRoles = pgTable("volunteer_roles", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  timeSlot: text("time_slot").notNull(),
  isFilled: boolean("is_filled").default(false),
});

// Time Capsule / Legacy
export const timeCapsuleMessages = pgTable("time_capsule_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Insert Schemas
export const insertGratitudeSchema = createInsertSchema(gratitudeMessages).omit({ id: true, createdAt: true });
export const insertVolunteerSchema = createInsertSchema(volunteerRoles).omit({ id: true });
export const insertTimeCapsuleSchema = createInsertSchema(timeCapsuleMessages).omit({ id: true, submittedAt: true });

// Types
export type TimelineItem = typeof timelineItems.$inferSelect;
export type Event = typeof events.$inferSelect;
export type GratitudeMessage = typeof gratitudeMessages.$inferSelect;
export type VolunteerRole = typeof volunteerRoles.$inferSelect;
export type TimeCapsuleMessage = typeof timeCapsuleMessages.$inferSelect;

export type InsertGratitude = z.infer<typeof insertGratitudeSchema>;
export type InsertTimeCapsule = z.infer<typeof insertTimeCapsuleSchema>;
