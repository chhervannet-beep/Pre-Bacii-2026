import { db } from './index.ts';
import { examsHistory, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { getOrCreateUser } from './users.ts';
import { supabaseServer } from '../lib/supabase-server.ts';

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
    
  if (supabaseServer) {
    try {
      await supabaseServer.from('exams_history').upsert({
        id: exam.id || Date.now(),
        user_id: uid,
        email: email,
        title: exam.title,
        level: exam.level,
        subject: exam.subject,
        duration: exam.duration,
        score: exam.score,
        exam_content: exam.examContent,
        solution_content: exam.solutionContent,
        data: exam.data,
        created_at: exam.date || new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to sync save to Supabase:", e);
    }
  }
  
  return result[0];
}

export async function deleteExamHistory(uid: string, email: string, examId: number) {
  const user = await getOrCreateUser(uid, email || 'unknown');
  await db.delete(examsHistory)
    .where(eq(examsHistory.id, examId));
    
  if (supabaseServer) {
    try {
      await supabaseServer.from('exams_history').delete().eq('id', examId);
    } catch (e) {
      console.error("Failed to sync delete to Supabase:", e);
    }
  }
    
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

  if (supabaseServer) {
    try {
      const sbData = validExams.map((exam: any) => ({
        id: exam.id,
        user_id: uid,
        email: email,
        title: exam.title,
        level: exam.level,
        subject: exam.subject,
        duration: exam.duration,
        score: exam.score,
        exam_content: exam.examContent,
        solution_content: exam.solutionContent,
        data: exam.data,
        created_at: exam.date || new Date().toISOString()
      }));
      await supabaseServer.from('exams_history').upsert(sbData);
    } catch (e) {
      console.error("Failed to sync upsert to Supabase:", e);
    }
  }
    
  return result;
}
