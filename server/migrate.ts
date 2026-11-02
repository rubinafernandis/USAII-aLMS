/**
 * Upgrades a saved database to the current format without losing learners' work.
 *
 * 7 → 8 (LMS 5.6):
 *  - The four starter accounts move from the old published passwords to strong ones. Only an account
 *    whose password is STILL the old published one is changed; a password someone already changed is kept.
 *    Changing it also ends any sign-in made with the old password.
 *  - The shared cache for transcript translations is created.
 *
 * 8 → 9 (LMS 5.7):
 *  - Video "transcripts" that 5.6 copied from the lesson text are removed. Transcripts now come from
 *    each video's own captions. Transcripts an instructor added themselves are kept.
 *  - Payment records are created. Learners who joined a PAID course without paying keep their
 *    progress, but the course stays locked until they pay or an instructor gives access.
 *
 * 9 → 10 (LMS 5.9):
 *  - Course 1's Day 10 evidence package gets the Pass / Needs Work rubric from the USAII grading
 *    sheet, and the certificate waits for its approval. Only when that activity has no rubric yet:
 *    an instructor's own rubric is kept. Certificates already issued are kept.
 *
 * 10 → 11 (LMS 5.10):
 *  - Courses 6, 7 and 8 (AI-Assisted Project Delivery; AI for HR, Recruiting, and Workforce Planning;
 *    AI for Marketing and Content Creation) are added as drafts, each with its capstone rubric.
 *    A course already on the site with the same id is left exactly as it is.
 */
import type { Database } from '../shared/types';
import { hashPassword, verifyPassword } from './auth';
import { buildUsaiiCourses, clearLessonTextTranscripts, USAII_COURSE_IDS } from './content/usaiiCourses';
import { applyCapstoneRubric } from './content/rubrics';
import { SEED_ACCOUNTS, seedPasswords } from './seed';

const OLD_PUBLISHED = { instructor: 'Instructor@2026', learner: 'Learner@2026' };

export function migrateDatabase(d: Database): boolean {
  if (d.version < 7 || d.version > 10) return false;
  if (d.version <= 8) migrateTo9(d);
  if (d.version <= 9) {
    // 9 → 10 (LMS 5.9): capstone rubrics from the USAII grading sheets.
    let rubrics = 0;
    for (const c of d.courses) if (USAII_COURSE_IDS.has(c.id) && applyCapstoneRubric(c)) rubrics += 1;
    d.version = 10;
    console.log(`[migrate] 9 → 10: capstone rubric added to ${rubrics} course(s).`);
  }
  // 10 → 11 (LMS 5.10): Courses 6, 7 and 8, as drafts for the instructor to review and publish.
  const instructor = d.users.find((u) => u.role === 'instructor')?.id ?? 'u_instructor';
  const added = buildUsaiiCourses(instructor, new Date().toISOString()).filter((c) => ADDED_IN_V11.has(c.id) && !d.courses.some((x) => x.id === c.id));
  d.courses.push(...added);
  d.version = 11;
  console.log(`[migrate] 10 → 11: ${added.length} new course(s) added as drafts: ${added.map((c) => c.title).join('; ') || 'none'}.`);
  return true;
}

/** The USAII courses first shipped in LMS 5.10. */
export const ADDED_IN_V11 = new Set(['c_project_delivery', 'c_hr_workforce', 'c_marketing_content']);

function migrateTo9(d: Database) {
  if (d.version === 7) {
    const pw = seedPasswords();
    const now = new Date().toISOString();
    let rotated = 0;
    for (const a of SEED_ACCOUNTS) {
      const u = d.users.find((x) => x.id === a.id && x.email.toLowerCase() === a.email);
      if (!u) continue;
      if (verifyPassword(OLD_PUBLISHED[a.role], u)) {
        Object.assign(u, hashPassword(pw[a.id]), { passwordChangedAt: now });
        rotated += 1;
      }
    }
    d.transcriptTranslations ??= {};
    d.version = 8;
    console.log(`[migrate] 7 → 8: ${rotated} starter password(s) replaced with strong ones.`);
  }
  // 8 → 9 (LMS 5.7): transcripts are the video's own captions; payments are recorded.
  let cleared = 0;
  for (const c of d.courses) if (USAII_COURSE_IDS.has(c.id)) cleared += clearLessonTextTranscripts(c);
  // Translations made from that lesson text are no longer the video's words.
  d.transcriptTranslations = {};
  d.videoCaptions ??= {};
  d.payments ??= [];
  d.version = 9;
  console.log(`[migrate] 8 → 9: ${cleared} video transcript(s) that were copied from lesson text removed; payments enabled.`);
}
