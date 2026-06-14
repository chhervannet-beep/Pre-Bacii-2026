import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const examsHistory = pgTable('exams_history', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title'),
  level: text('level'),
  subject: text('subject'),
  duration: text('duration'),
  score: text('score'),
  examContent: text('examContent'),
  solutionContent: text('solutionContent'),
  data: jsonb('data'),
  date: text('date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table.
export const usersRelations = relations(users, ({ many }) => ({
  examsHistory: many(examsHistory),
}));

// Define relationships for the 'exams_history' table.
export const examsHistoryRelations = relations(examsHistory, ({ one }) => ({
  author: one(users, {
    fields: [examsHistory.userId],
    references: [users.id],
  }),
}));
