# How activities and artifacts are evaluated (LMS 5.10)

This is the reference for what the LMS evaluates by itself, what a person has to evaluate, and how
Course 1 (AI Fluency for the Workplace) applies the USAII rubric grading sheet.

## 1. Every kind of assessed work

| Work | Evaluated by | How |
|---|---|---|
| Check Your Understanding (lesson quiz) | LMS, automatically | Graded against the answer key. Practice checks allow retakes; the best score counts toward the grade. |
| Final assessment | LMS, automatically | Graded against the answer key. Course 1: 16 questions, pass mark 75% (12 of 16), 30 minutes, 3 attempts. |
| Activity set to **Complete once submitted** | LMS, automatically | Complete when submitted. Not in the review queue. Counts toward progress, not Mastery or the grade. |
| Activity with a **Pass / Needs Work rubric** | LMS pre-check, then the instructor | The LMS runs the automatic checks below; the instructor marks each dimension Pass or Needs Work. |
| Activity with a **rubric PDF** | Instructor | The instructor enters the points awarded. With an AI key, a suggested score can pre-fill the form. |

AI suggestions never decide anything. They only appear when `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` is set,
and the instructor has to press "Use these decisions" or "Use this score".

## 2. Course 1: what needs a person

| Day | Activity | Evaluation |
|---|---|---|
| 1 | My AI Capability Checklist | Complete once submitted |
| 2 | My Personal Use-case List | Complete once submitted |
| 3 | My Useful Prompt | Complete once submitted |
| 4 | My Writing Workflow | Complete once submitted |
| 5 | My Planning Workflow | Complete once submitted |
| 6 | My Quality Review Checklist | Complete once submitted |
| 7 | My Safe-use Checklist | Complete once submitted |
| 8 | My Personal AI Workflow | Complete once submitted |
| 9 | My 7-Day Adoption Plan | Complete once submitted |
| 10 | Evidence package (the Personal AI Productivity Playbook) | **Pass / Needs Work rubric, reviewed by the instructor** |

Days 1 to 9 are the nine pages of the playbook. They are not reviewed one by one: they are reviewed
together, as part of the Day 10 evidence package, and the reviewer sees all nine pages beside it.

## 3. The Course 1 rubric: automatic and human parts

The five dimensions and their Pass definitions are copied from the USAII grading sheet.

| Dimension | What the LMS checks automatically | What only the reviewer can judge |
|---|---|---|
| **Completeness** | Days 2, 4, 5, 6, 7 and 9 are submitted with every answer filled in (use cases, writing workflow, planning workflow, quality review, safe use, adoption plan). | Almost nothing. Confirm the pieces are real content. |
| **Correctness** | Days 1, 3, 4, 5 and 8 are submitted and filled in (capability checklist, prompt, workflows). | Can a colleague follow the workflows and get the same result? Does the checklist separate AI tasks correctly? |
| **Robustness** | Days 6, 7 and 8 and the evidence package are filled in (privacy, accuracy and judgment rules; review and safeguard steps; evidence of testing). No email, phone, card or PAN number is left anywhere in the playbook. | Is the safe-use checklist applied, not just named? Do they show they review outputs before relying on them? |
| **Applicability** | Days 1 and 2 are filled in; no answer is a placeholder ("test", "asdf", "TBD") or a copy of the question. | Is it grounded in a specific, real task rather than a template? |
| **Deployability** | Day 9 is filled in: day, time, who receives or reviews it, approval needed, how to get it. | Is it a real plan (a real day, a real person)? |

Checks on the evidence package itself: every answer filled in; no placeholder answers; the implementation note
is 150 to 250 words (the limit is read from the question); the same text is not pasted into several answers.

The learner sees the same automatic checks under **Before you submit**, so most gaps are fixed before review.
None of the checks block submitting, and none changes a decision.

**In short:** Completeness and Deployability are close to fully automatic; Robustness is about half automatic;
Correctness and Applicability are judgment calls (an AI suggestion can help).

## 4. Decisions, the revision limit, and the certificate

- **Approve** needs every dimension marked Pass.
- **Return for revision** and **Not approved** need at least one dimension marked Needs work and a note that says what it needs.
- **One revision** (the grading sheet's cap): the first version can be returned once. The revised version can only be approved or marked Not approved, and a Not approved revision is final. Approved work is final too.
- **The certificate** (Course 1) is issued automatically when all of these are true:
  1. all ten lessons are complete (each activity submitted),
  2. the final assessment is passed at 75% or higher (12 of 16),
  3. the evidence package is approved (all five dimensions Pass),
  4. the overall grade is 75% or higher.

  It is issued the moment the last of these is met, including the moment the instructor approves the playbook.
  Rule 4 is a platform rule, not on the grading sheet. With practice checks (retakes allowed, best score counts)
  it almost never blocks anyone, but see section 7.

## 5. The grade

Course 1 weights: checks 30%, activities 40%, final 30%. Activities now mean the rubric-scored work only,
which for Course 1 is the evidence package: the share of dimensions that pass (an approved playbook = 100%).
Until it is reviewed, the grade is worked out from the checks and the final alone. Before 5.9, every activity
counted 100% as soon as anything was submitted.

## 6. What was wrong before 5.9, and is fixed

1. No Course 1 activity had a rubric, although Day 10 says "Submit the evidence package for rubric review".
2. The certificate never waited for the playbook review, so it could be issued for work nobody had read.
3. Activities counted 100% toward the grade (40% weight) for any submission of three characters or more.
4. Reviewing an activity never re-checked the certificate, so an eligible learner waited until their next action.
5. All ten daily submissions showed "Awaiting review", though only Day 10 needs one.
6. Answers longer than 10,000 characters were cut off without a word. The limit is now 20,000, with a clear message.
7. Steps to Completion said the certificate is issued right after the final, leaving out the grade rule.
8. The next-step guidance could tell a learner to "revise and resubmit" work that could no longer be resubmitted.
9. Duplicating a course gave every lesson a new id, but final-assessment questions kept pointing at the old ids,
   so the copy lost its per-lesson Comprehension mapping.
10. Two browser tests were out of date (an old label, and a test video that was too short). Not app bugs.

## 7. For USAII to decide (content, not code)

1. **Day 10 instruction order.** It says "Take the final knowledge check", then "Submit the evidence package".
   In the LMS the final unlocks only after Day 10 is submitted. Swapping those two lines avoids confusion.
2. **Learner-facing rubric wording.** The Pass definitions are written for reviewers ("the learner's core use
   cases"). Learners see them as written. Edit them in Course Builder if you want a learner-facing version.
3. **The overall grade rule** (section 4, rule 4) is not on the grading sheet. Keep it, or ask for it to be
   removed so the certificate follows the sheet exactly.
4. **Courses 2 to 5** ship with no rubric on any activity, the way Course 1 did. Each needs its grading sheet
   turned into a rubric (below). Courses 6, 7 and 8 already have theirs (section 9).

## 8. Adding the rubric for another course

In **My Courses → Edit → Lessons → (the capstone lesson) → Edit → Activity**:

1. Under **How this activity is evaluated**, choose **Pass / Needs Work rubric**.
2. Add each dimension: its name, and what Pass looks like (copy it from the grading sheet).
3. Under each dimension, tick the activities that hold its evidence. The LMS checks those automatically and shows
   them to the reviewer.
4. Choose **Revisions allowed** (USAII sheets: one revision).
5. Tick **The certificate waits for my approval of this activity**. Save.

Developers can also add a rubric in `server/content/rubrics.ts`: new installations get it, and existing data
gets it on the next start when the activity has no rubric yet.

## 9. Courses 6, 7 and 8 (added in 5.10)

They work exactly like Course 1: Days 1 to 9 are complete once submitted, Day 10's evidence package is the only
activity reviewed, the five dimensions come word for word from each course's grading sheet, the revision is capped
at one round, and the certificate waits for the approval. Each sheet's reviewer note ("scrutinize Robustness
closely", "grade Correctness and Robustness from the evidence of testing") is added to those two dimensions.

| Course | Evidence package | Where the LMS looks for each dimension's evidence |
|---|---|---|
| 6. AI-Assisted Project Delivery | Toolkit, implementation note, evidence of testing, AI output review checklist | Completeness: Days 2 to 6. Correctness: Days 2 to 8 and the package. Robustness: Days 5, 6, 8, 9 and the package. Applicability: Days 1 and 2. Deployability: Days 8, 9 and the package. |
| 7. AI for HR, Recruiting, and Workforce Planning | Playbook, implementation note, evidence of testing, HR risk checklist | Completeness: Days 1, 2, 3, 4, 6, 7. Correctness: Days 2, 3, 4, 6 and the package. Robustness (the hard gate): Days 5, 7, 8, 9 and the package. Applicability: Days 1 and 2. Deployability: Days 8, 9 and the package. |
| 8. AI for Marketing and Content Creation | Template, implementation note, evidence of testing, brand-voice and quality-control checklist | Completeness: Days 2, 3, 4, 6, 7. Correctness: Days 2 to 6 and the package. Robustness: Days 5, 6, 7 and the package. Applicability: Days 1 and 2. Deployability: Day 9 and the package. |

The answer keys are used for the correct answers and the explanations learners see after each check. They are
never shown before an attempt.
