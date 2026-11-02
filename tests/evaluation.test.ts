/**
 * Activity evaluation: the Course 1 capstone rubric, automatic pre-checks, the revision limit,
 * the certificate gate, the learner's next step, and the 9 → 10 data upgrade.
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'lms-eval-')));

const { buildUsaiiCourses } = await import('../server/content/usaiiCourses');
const { applyCapstoneRubric } = await import('../server/content/rubrics');
const { seedDatabase } = await import('../server/seed');
const { migrateDatabase } = await import('../server/migrate');
const { runAutoChecks, evidencePages, findPersonalData, wordRange, looksUnfinished, dimensionChecks, generalChecks } = await import('../shared/autocheck');
const { canResubmit, canReturnForRevision, certificateGate, gateMet, hasRubric, needsReview, revisionLimit, rubricKind, versionOf } = await import('../shared/metrics');
const { buildSnapshot, emptyProgress, flattenLessons } = await import('../shared/analytics');
import type { ActivitySubmission, Course, Enrollment } from '../shared/types';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const course1 = (): Course => {
  const c = buildUsaiiCourses('u_i', new Date(NOW - 30 * 86_400_000).toISOString())[0];
  c.status = 'published';
  return c;
};
const lesson = (c: Course, id: string) => flattenLessons(c).find((f) => f.lesson.id === id)!.lesson;

/** Fill every answer of an activity with real-looking text. */
const fillAll = (c: Course, id: string, text = 'Weekly supplier status update for my operations manager') =>
  Object.fromEntries(lesson(c, id).activity!.fields.map((f) => [f.id, text]));

/* ---------------- The Course 1 rubric, as in the USAII grading sheet ---------------- */

test('Course 1: only the Day 10 evidence package is reviewed; it has the five-dimension rubric and gates the certificate', () => {
  const c = course1();
  const flat = flattenLessons(c);
  const d10 = lesson(c, 'af-d10').activity!;
  assert.equal(rubricKind(d10), 'pass');
  assert.deepEqual(
    d10.passRubric!.dimensions.map((d) => d.label),
    ['Completeness', 'Correctness', 'Robustness', 'Applicability', 'Deployability'],
  );
  assert.equal(d10.passRubric!.revisionLimit, 1, 'revision capped at one round');
  assert.equal(d10.requiredForCertificate, true);
  // Completeness looks at the pages the sheet names: use cases, writing and planning workflows, quality review, safe use, adoption plan.
  assert.deepEqual(d10.passRubric!.dimensions[0].evidence, ['af-d2', 'af-d4', 'af-d5', 'af-d6', 'af-d7', 'af-d9']);
  assert.deepEqual(d10.passRubric!.dimensions[4].evidence, ['af-d9'], 'deployability = the adoption plan');
  // Days 1 to 9: complete once submitted, no review queue.
  for (const f of flat.filter((x) => x.lesson.id !== 'af-d10')) {
    assert.equal(hasRubric(f.lesson.activity), false, f.lesson.id);
    assert.equal(needsReview(f.lesson.activity), false, f.lesson.id);
  }
  assert.equal(needsReview(d10), true);
  // Courses 2 to 5 have no grading sheet in the LMS yet, so they are not changed.
  for (const other of buildUsaiiCourses('u_i', new Date().toISOString()).slice(1, 5))
    assert.ok(flattenLessons(other).every((f) => !f.lesson.activity?.passRubric && !f.lesson.activity?.requiredForCertificate), other.id);
});

test('an instructor’s own rubric is never overwritten', () => {
  const c = course1();
  const act = lesson(c, 'af-d10').activity!;
  delete act.passRubric;
  delete act.requiredForCertificate;
  act.rubricPdf = { url: '/uploads/mine.pdf', name: 'mine.pdf', maxPoints: 50 };
  assert.equal(applyCapstoneRubric(c), false);
  assert.equal(act.passRubric, undefined);
  assert.equal(rubricKind(act), 'pdf');
});

/* ---------------- Automatic checks ---------------- */

test('automatic checks: blanks, placeholders, word limit, repeated text, personal data', () => {
  const c = course1();
  const d10 = lesson(c, 'af-d10');
  const note = Array(180).fill('word').join(' ');
  const good = { 'af-d10-f1': 'Cover page and the nine pages in order.', 'af-d10-f2': note, 'af-d10-f3': 'I ran the workflow on last Monday’s status update and fixed two dates.', 'af-d10-f4': 'Mask names; verify figures; I approve every send.' };
  const ok = runAutoChecks({ course: c, lesson: d10, fields: good });
  const byId = (r: ReturnType<typeof runAutoChecks>, id: string) => r.checks.find((x) => x.id === id)!;
  assert.equal(byId(ok, 'answered').ok, true);
  assert.equal(byId(ok, 'unfinished').ok, true);
  assert.equal(byId(ok, 'words-af-d10-f2').ok, true, '150 to 250 words read from the question');
  assert.equal(byId(ok, 'personal-data').ok, true);

  const bad = runAutoChecks({
    course: c,
    lesson: d10,
    fields: { 'af-d10-f1': 'test', 'af-d10-f2': 'Too short.', 'af-d10-f3': '', 'af-d10-f4': 'Send it to priya.k@acme-corp.com or call +91 98765 43210 first.' },
  });
  assert.equal(byId(bad, 'answered').ok, false);
  assert.match(byId(bad, 'answered').detail!, /Your evidence of testing/);
  assert.equal(byId(bad, 'unfinished').ok, false);
  assert.equal(byId(bad, 'words-af-d10-f2').ok, false);
  assert.match(byId(bad, 'words-af-d10-f2').detail!, /2 words/);
  assert.equal(byId(bad, 'personal-data').ok, false);
  assert.match(byId(bad, 'personal-data').detail!, /email address/);
  assert.match(byId(bad, 'personal-data').detail!, /phone or ID number/);

  const twice = 'Mask client names and account numbers before anything goes into the tool.';
  const rep = runAutoChecks({ course: c, lesson: d10, fields: { ...good, 'af-d10-f3': twice, 'af-d10-f4': twice } });
  assert.equal(byId(rep, 'repeated').ok, false);
});

test('automatic checks: helpers stay conservative', () => {
  assert.deepEqual(wordRange({ label: 'Your implementation note of 150 to 250 words' }), { min: 150, max: 250 });
  assert.deepEqual(wordRange({ label: 'Summary', hint: 'at least 50 words' }), { min: 50, max: undefined });
  assert.equal(wordRange({ label: 'Task 1' }), null);
  // "None" and "N/A" are real answers (for example "Approval I need first: None").
  for (const real of ['None', 'N/A', '1', 'Mon', 'No approval needed']) assert.equal(looksUnfinished(real), false, real);
  for (const junk of ['test', 'asdf', 'xxxx', 'TBD', 'lorem ipsum dolor', 'aaaaaa']) assert.equal(looksUnfinished(junk), true, junk);
  // Dates, times and short numbers are not personal data.
  assert.deepEqual(findPersonalData('Run it on 2026-10-31 at 9:00-10:30, rank 1 of 5, Q3 2025-2026.'), []);
  assert.deepEqual(findPersonalData('Card 4111 1111 1111 1111'), ['a card or account number']);
  assert.deepEqual(findPersonalData('PAN ABCDE1234F'), ['a tax ID (PAN) number']);
});

test('automatic checks: each dimension sees whether its evidence pages are submitted and filled in', () => {
  const c = course1();
  const d10 = lesson(c, 'af-d10');
  const enr: Enrollment = { id: 'e', userId: 'u', courseId: c.id, enrolledAt: new Date(NOW).toISOString(), lessons: {} };
  const submit = (id: string, fields: Record<string, string>) => {
    enr.lessons[id] = { ...emptyProgress(), status: 'done', activity: { fields, submittedAt: new Date(NOW).toISOString() } };
  };
  // Day 9 (the adoption plan) is submitted with every answer; Day 7 has a gap; Day 2 is missing.
  submit('af-d9', fillAll(c, 'af-d9'));
  submit('af-d7', { ...fillAll(c, 'af-d7'), 'af-d7-f4': '' });
  const r = runAutoChecks({ course: c, lesson: d10, fields: fillAll(c, 'af-d10'), enrollment: enr });
  const deploy = dimensionChecks(r, 'deployability');
  assert.deepEqual([deploy.passed, deploy.total], [1, 1], 'deployability: the adoption plan is complete');
  const complete = dimensionChecks(r, 'completeness');
  assert.equal(complete.total, 6);
  assert.equal(complete.checks.find((x) => x.id === 'completeness-af-d2')!.detail, 'Not submitted yet (Day 2: Common workplace AI use cases)');
  assert.match(complete.checks.find((x) => x.id === 'completeness-af-d7')!.detail!, /3 of 4 answers/);
  // Robustness includes the evidence package itself (evidence of testing and the completed safe-use checklist).
  assert.ok(dimensionChecks(r, 'robustness').checks.some((x) => x.label.includes('this submission')));
  // The reviewer gets the nine earlier pages, in course order.
  const pages = evidencePages(c, d10, enr);
  assert.deepEqual(pages.map((p) => p.lessonId), ['af-d1', 'af-d2', 'af-d3', 'af-d4', 'af-d5', 'af-d6', 'af-d7', 'af-d8', 'af-d9']);
  assert.equal(pages.find((p) => p.lessonId === 'af-d9')!.fields.length, 9);
  assert.equal(pages.find((p) => p.lessonId === 'af-d2')!.submittedAt, undefined);
  // Personal data in an earlier page is found too.
  submit('af-d4', { ...fillAll(c, 'af-d4'), 'af-d4-f7': 'my manager, raj@example.org' });
  const leak = generalChecks(runAutoChecks({ course: c, lesson: d10, fields: fillAll(c, 'af-d10'), enrollment: enr })).find((x) => x.id === 'personal-data')!;
  assert.equal(leak.ok, false);
  assert.match(leak.detail!, /My Writing Workflow/);
});

/* ---------------- Revision limit and certificate gate ---------------- */

test('revision limit: returned once, then the decision stands; approved work is final', () => {
  const act = lesson(course1(), 'af-d10').activity!;
  assert.equal(revisionLimit(act), 1);
  const v1: ActivitySubmission = { fields: {}, submittedAt: 'x', version: 1 };
  assert.equal(canReturnForRevision(act, v1), true);
  assert.equal(canResubmit(act, v1), true, 'not reviewed yet: can still edit');
  assert.equal(canResubmit(act, { ...v1, review: 'resubmit' }), true, 'the one revision');
  const v2: ActivitySubmission = { fields: {}, submittedAt: 'y', version: 2 };
  assert.equal(canReturnForRevision(act, v2), false, 'cannot be returned a second time');
  assert.equal(canResubmit(act, { ...v2, review: 'not_approved' }), false, 'decision is final');
  assert.equal(canResubmit(act, { ...v1, review: 'approved' }), false, 'approved work is final');
  // Older records without a version number: a resubmission is version 2.
  assert.equal(versionOf({ previous: { submittedAt: 'x' } }), 2);
  assert.equal(versionOf({}), 1);
  // Activities without a limit behave as before.
  const free = lesson(course1(), 'af-d3').activity!;
  assert.equal(canResubmit(free, { ...v2, review: 'not_approved' }), true);
});

test('certificate gate: states and the learner’s next step', () => {
  const c = course1();
  const flat = flattenLessons(c);
  // Everything done, final passed with 14 of 16.
  const lessons: Enrollment['lessons'] = {};
  for (const f of flat) {
    const p = emptyProgress();
    p.status = 'done';
    p.startedAt = p.completedAt = new Date(NOW - 86_400_000).toISOString();
    if (f.lesson.check.length) p.attempts.push({ at: p.completedAt, score: 100, answers: f.lesson.check.map((q) => q.correctIndex), kind: 'check' });
    p.activity = { fields: fillAll(c, f.lesson.id), submittedAt: p.completedAt, version: 1 };
    lessons[f.lesson.id] = p;
  }
  const enr: Enrollment = { id: 'e', userId: 'u', courseId: c.id, enrolledAt: new Date(NOW - 20 * 86_400_000).toISOString(), lessons };
  const qs = c.finalExam!.questions;
  enr.finalExam = { attempts: [{ at: new Date(NOW).toISOString(), score: 88, answers: qs.map((q, i) => (i < 14 ? q.correctIndex : (q.correctIndex + 1) % q.options.length)), kind: 'check' }] };
  const snap = () => buildSnapshot({ course: c, enrollment: enr, userId: 'u', events: [], threads: [], now: NOW });

  assert.deepEqual(certificateGate(c, enr).map((g) => g.state), ['awaiting']);
  assert.match(snap().nextStep.title, /Evidence package” is with your instructor/);

  const d10 = enr.lessons['af-d10'].activity!;
  d10.review = 'resubmit';
  assert.deepEqual(certificateGate(c, enr).map((g) => g.state), ['returned']);
  assert.match(snap().nextStep.title, /^Revise and resubmit: Evidence package/);

  Object.assign(d10, { version: 2, review: 'not_approved' });
  assert.deepEqual(certificateGate(c, enr).map((g) => g.state), ['closed']);
  assert.equal(snap().nextStep.title, 'Talk with your instructor', 'never "revise" work that cannot be resubmitted');
  assert.ok(!snap().recommendations.some((r) => r.id === 'rubric-af-d10'));

  Object.assign(d10, { review: 'approved', rubric: { scores: [], dimensions: [], percent: 100, scoredBy: 'I', scoredAt: 'z' } });
  assert.equal(gateMet(certificateGate(c, enr)), true);
  assert.notEqual(snap().nextStep.title, 'Talk with your instructor');
});

test('grading: Days 1 to 9 no longer score 100% just for being submitted', () => {
  const c = course1();
  const enr: Enrollment = { id: 'e', userId: 'u', courseId: c.id, enrolledAt: new Date(NOW).toISOString(), lessons: {} };
  for (const f of flattenLessons(c).slice(0, 9)) enr.lessons[f.lesson.id] = { ...emptyProgress(), status: 'done', activity: { fields: { x: 'a' }, submittedAt: new Date(NOW).toISOString() } };
  const s = buildSnapshot({ course: c, enrollment: enr, userId: 'u', events: [], threads: [], now: NOW });
  const applied = s.prediction.breakdown.find((b) => b.label.startsWith('Applied'))!;
  assert.equal(applied.label, 'Applied activities (rubric scores)');
  assert.equal(applied.score, null, 'nothing scored yet, so no applied-work grade');
});

/* ---------------- Data upgrade 9 → 10 ---------------- */

test('migration 9 → 10 adds the capstone rubric, keeps learner data and certificates', () => {
  const d = seedDatabase();
  const act = lesson(d.courses[0], 'af-d10').activity!;
  delete act.passRubric;
  delete act.requiredForCertificate;
  act.fields[0].hint = undefined;
  d.version = 9;
  d.enrollments.push({ id: 'e1', userId: 'u_alex', courseId: d.courses[0].id, enrolledAt: new Date().toISOString(), lessons: {}, certificateId: 'USAII-X', certificateIssuedAt: new Date().toISOString() });
  assert.equal(migrateDatabase(d), true);
  assert.equal(d.version, 11);
  assert.equal(act.passRubric!.dimensions.length, 5);
  assert.equal(act.requiredForCertificate, true);
  assert.match(act.fields[0].hint ?? '', /reach your reviewer automatically/);
  assert.equal(d.enrollments[0].certificateId, 'USAII-X', 'an issued certificate is kept');
  // Running it again changes nothing.
  d.version = 9;
  assert.equal(migrateDatabase(d), true);
  assert.equal(act.passRubric!.dimensions.length, 5);
});

test('migration 7 → 11 runs every step', () => {
  const d = seedDatabase();
  delete lesson(d.courses[0], 'af-d10').activity!.passRubric;
  d.version = 7;
  assert.equal(migrateDatabase(d), true);
  assert.equal(d.version, 11);
  assert.ok(lesson(d.courses[0], 'af-d10').activity!.passRubric);
  assert.deepEqual(d.payments, []);
});

/* ---------------- Courses 6, 7 and 8 ---------------- */

const NEW_COURSES = [
  { id: 'c_project_delivery', p: 'pd', title: 'AI-Assisted Project Delivery', artifact: 'toolkit', checklist: 'AI output review checklist' },
  { id: 'c_hr_workforce', p: 'hr', title: 'AI for HR, Recruiting, and Workforce Planning', artifact: 'playbook', checklist: 'HR risk checklist' },
  { id: 'c_marketing_content', p: 'mk', title: 'AI for Marketing and Content Creation', artifact: 'template', checklist: 'brand-voice and quality-control checklist' },
];
const count = (letters: string) => Object.fromEntries('ABCD'.split('').map((x) => [x, [...letters].filter((y) => y === x).length]));

test('eight USAII courses ship, in order, with unique ids', () => {
  const all = buildUsaiiCourses('u_i', new Date().toISOString());
  assert.deepEqual(all.map((c) => c.id), ['c_ai_fluency', 'c_prompt_context', 'c_agentic_ai', 'c_rag_assistants', 'c_data_analysis', ...NEW_COURSES.map((c) => c.id)]);
  const ids = all.flatMap((c) => [c.id, ...c.modules.map((m) => m.id), ...flattenLessons(c).map((f) => f.lesson.id)]);
  assert.equal(new Set(ids).size, ids.length, 'no id is used twice');
});

for (const spec of NEW_COURSES) {
  test(`${spec.title}: structure, answers and rubric follow the USAII documents`, () => {
    const c = buildUsaiiCourses('u_i', new Date().toISOString()).find((x) => x.id === spec.id)!;
    assert.equal(c.title, spec.title);
    assert.equal(c.status, 'draft', 'added as a draft for the instructor to review');
    assert.equal(c.passMark, 75);
    assert.equal(c.credentialName, `USAII Certificate of Completion: ${spec.title}`);
    const flat = flattenLessons(c).map((f) => f.lesson);
    assert.deepEqual(flat.map((l) => l.id), Array.from({ length: 10 }, (_, i) => `${spec.p}-d${i + 1}`));
    assert.equal(c.modules.at(-1)!.title, 'Day 10 · Assembly and knowledge check');
    // Days 1 to 9: framework step, concept, worked example (video on odd days), guided build, 3 checks, a template.
    for (const [i, l] of flat.slice(0, 9).entries()) {
      assert.equal(l.title, `Day ${i + 1}: ${l.topic}`);
      assert.equal(l.blocks[0].label, 'Framework step', l.id);
      assert.ok(l.blocks.some((b) => b.type === 'heading' && b.text === 'Concept teach · 10 minutes'), l.id);
      assert.ok(l.blocks.some((b) => b.type === 'heading' && b.text === 'Guided build on your own task · 35 minutes'), l.id);
      assert.equal(l.blocks.some((b) => b.type === 'video'), i % 2 === 0, `${l.id} video on Days 1, 3, 5, 7, 9`);
      assert.equal(l.check.length, 3, l.id);
      for (const q of l.check) assert.ok(q.options.length === 4 && q.rationale.length > 20, q.id);
      assert.ok(l.activity!.title.startsWith('My '), l.id);
      assert.ok(l.activity!.fields.length >= 9, l.id);
      assert.deepEqual(l.activity!.instructions, (l.blocks.find((b) => b.type === 'list')!.items ?? []), `${l.id}: activity steps = guided build`);
      assert.equal(new Set(l.activity!.fields.map((f) => f.label)).size, l.activity!.fields.length, `${l.id}: every field label names its own answer`);
    }
    // The data-safety rule opens Day 1 and closes Day 10.
    assert.equal(flat[0].blocks[1].label, 'Data-safety rule');
    assert.equal(flat[9].blocks.at(-1)!.label, 'Data-safety rule');
    // Answer positions match what each answer key declares.
    const daily = flat.slice(0, 9).flatMap((l) => l.check.map((q) => 'ABCD'[q.correctIndex])).join('');
    assert.deepEqual(count(daily), { A: 7, B: 7, C: 7, D: 6 });
    const final = c.finalExam!.questions.map((q) => 'ABCD'[q.correctIndex]).join('');
    assert.equal(final.length, 16);
    assert.deepEqual(count(final), { A: 4, B: 4, C: 4, D: 4 });
    // Day 10: the evidence package of four items, reviewed against the five-dimension rubric.
    const d10 = flat[9].activity!;
    assert.deepEqual(d10.fields.map((f) => f.label), [`The finished ${spec.artifact}`, 'Your implementation note of 150 to 250 words', 'Your evidence of testing', `Your completed ${spec.checklist}`]);
    assert.equal(rubricKind(d10), 'pass');
    assert.deepEqual(d10.passRubric!.dimensions.map((d) => d.label), ['Completeness', 'Correctness', 'Robustness', 'Applicability', 'Deployability']);
    assert.equal(d10.passRubric!.revisionLimit, 1);
    assert.equal(d10.requiredForCertificate, true);
    const lessonIds = new Set(flat.map((l) => l.id));
    for (const d of d10.passRubric!.dimensions) assert.ok(d.evidence!.length && d.evidence!.every((id) => lessonIds.has(id)), d.id);
    // Days 1 to 9 are complete once submitted; only the evidence package is reviewed.
    assert.ok(flat.slice(0, 9).every((l) => !needsReview(l.activity)));
  });
}

test('migration 10 → 11 adds Courses 6, 7 and 8 as drafts and keeps everything else', () => {
  const d = seedDatabase();
  const original = d.courses.filter((c) => !NEW_COURSES.some((n) => n.id === c.id));
  const edited = original[0];
  edited.title = 'Renamed by the instructor';
  d.courses = original;
  d.version = 10;
  assert.equal(migrateDatabase(d), true);
  assert.equal(d.version, 11);
  assert.deepEqual(d.courses.slice(-3).map((c) => [c.id, c.status]), NEW_COURSES.map((n) => [n.id, 'draft']));
  assert.equal(d.courses.length, 8);
  assert.equal(d.courses[0].title, 'Renamed by the instructor', 'existing courses are untouched');
  // A course already on the site with the same id is kept as it is, and the upgrade can run twice.
  d.courses.at(-1)!.title = 'Instructor copy';
  d.version = 10;
  migrateDatabase(d);
  assert.equal(d.courses.length, 8);
  assert.equal(d.courses.at(-1)!.title, 'Instructor copy');
});
