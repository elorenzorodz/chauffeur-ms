import { relations } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, integer } from "drizzle-orm/pg-core";

// Tables.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phonee_number", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  pickupDate: timestamp("pickup_date").notNull(),
  pickup: varchar("pickup", { length: 255 }).notNull(),
  dropoff: varchar("dropoff", { length: 255 }).notNull(),
  numberOfPassengers: integer("number_of_passengers").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});

export const bookingStops = pgTable("booking_stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  stop: varchar("stop", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
  bookingId: uuid("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" })
    .notNull(),
});

// Relations.
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  bookingStops: many(bookingStops),
}));

export const bookingStopsRelations = relations(bookingStops, ({ one }) => ({
  bookings: one(bookings, {
    fields: [bookingStops.bookingId],
    references: [bookings.id],
  }),
}));
