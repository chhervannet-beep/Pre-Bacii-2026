import { db } from './index.ts';
import { examsHistory, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { getOrCreateUser } from './users.ts';

export async function getExamsHistory(uid: string, email: string) {
  const user = await getOrCreateUser(uid, email || 'unknown');
  return db.select()
    .from(examsHistory)
    .where(eq(examsHistory.userId, user.id))
    .orderBy(desc(examsHistory.id));
}

export async function saveExamHistory(uid: string, email: string, exam: any) {
  const user = await getOrCreateUser(uid, email || 'unknown');
  const result = await db.insert(examsHistory)
    .values({
      ...exam,
      userId: user.id,
    })
    .onConflictDoNothing()
    .returning();
  return result[0];
}

export async function deleteExamHistory(uid: string, email: string, examId: number) {
  const user = await getOrCreateUser(uid, email || 'unknown');
  await db.delete(examsHistory)
    .where(eq(examsHistory.id, examId));
  return true;
}

export async function upsertExamsHistory(uid: string, email: string, exams: any[]) {
  if (!exams || typeof exams !== 'object') return [];
  const validExams = Array.isArray(exams) ? exams : [exams];
  if(validExams.length === 0) return [];
  
  const user = await getOrCreateUser(uid, email || 'unknown');
  const result = await db.insert(examsHistory)
    .values(validExams.map(exam => ({ ...exam, userId: user.id })))
    .onConflictDoNothing()
    .returning();
  return result;
}
