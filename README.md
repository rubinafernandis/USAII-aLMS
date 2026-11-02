# USAII Intuitive LMS 5.10.1

**Courses included (8 USAII micro-credentials, each 10 days, 1 hour a day):**

| # | Course | Artifact the learner builds | Rubric on Day 10 |
|---|---|---|---|
| 1 | AI Fluency for the Workplace | Personal AI Productivity Playbook | Yes |
| 2 | Prompting and Context Design | AI Context Canvas | Not yet |
| 3 | Agentic AI Foundations | A working AI agent | Not yet |
| 4 | RAG and Enterprise Knowledge Assistants | A working knowledge assistant | Not yet |
| 5 | AI for Data Analysis, Excel, and BI | AI-Assisted Data Analysis Worksheet | Not yet |
| 6 | AI-Assisted Project Delivery | AI Project Management Toolkit | Yes |
| 7 | AI for HR, Recruiting, and Workforce Planning | AI HR Use-Case Playbook | Yes |
| 8 | AI for Marketing and Content Creation | AI Campaign Builder Template | Yes |

New courses start as **drafts**: review them in Course Builder, add the worked-example videos, set a price, and publish.

Written in US English. The official USAII logo is `public/usaii-logo.png`.

A learning platform built on the CEO's vision: every learner always knows **where they are, what to do next, and how to improve**, with nothing extra in the way.

## Start it (Windows)

1. Install **Node.js 20 or newer** from https://nodejs.org (the LTS button). You only do this once.
2. Unzip this folder (right-click → **Extract All…**).
3. Open the extracted folder and double-click **`START.bat`**.

The first start installs packages (1–3 minutes, internet needed). The browser then opens by itself on the sign-in page, normally at **http://localhost:4600**. Keep the black window open while you use the LMS; close it to stop.

> **Seeing an old version?** Older prototypes run on port 3000. This LMS uses its own port (4600) and moves to the next free port if that one is busy; the window shows the exact address. The browser tab says **USAII Intuitive LMS**.

macOS or Linux: run `./start.sh` in a terminal.

## Sign in

Test accounts and their passwords are in **`TEST-CREDENTIALS.md`**. They are deliberately not shown on the sign-in page or in the console.

- **Passwords:** at least 12 characters, with an uppercase letter, a lowercase letter, a number, and a symbol. Changing a password signs out every other session.
- **Sign-in protection:** after 5 wrong passwords an account waits 1, then 5, then 15 minutes; one network address is limited to 30 failures in 15 minutes.
- **Two roles only:** learners take courses; instructors create, publish, and track them. There is no self sign-up. Instructors create learner accounts and set each learner's password.

## Learner

The menu is **My Dashboard, Learning, Progress, Explore Courses, Steps to Completion, Your Journey, Ask**, then **Give Feedback, Quick Tools, Milestone Vault**.

- **My Dashboard:** one next step, how you are doing, your study habits, what to improve, and a planner.
- **Learning:** every lesson in order. **About this course** has two buttons side by side: **View Study Guide** opens the whole guide inside the LMS as a formatted Markdown document, starting at the lesson you are on; **Download Study Guide (PDF)** keeps a copy.
- **Lessons** follow one path: Learn → Check → Apply → Reflect → Complete.
- **Video transcripts in your language:** press play and the transcript opens on the right (under the video on a phone). It shows **only what is said in the video**, read from the video's own captions (YouTube captions, Vimeo captions, or the caption file of an uploaded video). Pick any of 130+ languages from a searchable list (all 22 scheduled languages of India included); the captions are translated into that language for you. The current line is highlighted, and clicking a line jumps the video there. Copy or download the transcript.
- **Paying for a course:** on **Explore Courses**, a paid course shows its price. **Enroll** opens a secure payment window (Razorpay) or payment page (Stripe), and the course opens as soon as the payment is confirmed.
- **Activities:** instructions are written like a short page (text, bullet points, notes, links, and pictures). Each activity is evaluated in one of three ways (see **How activities are evaluated** below):
  - **Complete once submitted:** no review needed. The instructor may still leave feedback.
  - **Pass / Needs Work rubric:** the dimensions and what Pass looks like are shown before you submit. **Before you submit** lists anything the LMS found missing (a blank answer, a page from an earlier day not submitted yet, a word limit, an email or phone number left in). After the review you see Pass or Needs work for each dimension. If the rubric allows one revision, a second Not approved is final.
  - **Rubric PDF:** **Open rubric (PDF)** shows how the work will be evaluated, and the score appears once it is reviewed.
- **Progress:** your learning metrics, understanding by topic, quiz scores, and study time.
- **Steps to Completion** (per course):
  - **In the sidebar:** a collapsible list of every step with a checkmark as each one is finished and a "3/10" badge. It opens by itself on learning pages and remembers if you close it.
  - **As a page:** exactly how to earn the certificate. The rules (lessons, final, any capstone your instructor must approve, and the overall grade), then one animated path with every step. Each step lists what it takes (work through the lesson, take the check, submit the activity, mark it complete) with a **Go** button for anything left. The top shows steps left, time left, and your projected finish date.
- **Your Journey** (per course): a simple, dated record of what you have done, newest first.
  - **Filter bar:** choose the course, then see **Days in this course** and **Time invested**.
  - **Filters:** All, Lessons, Activities, Feedback on activities.
  - **Each entry:** a lesson you completed (with time spent), an activity you submitted (**Read** opens it), your instructor's decision on it (Approved, Resubmission requested, or Not approved, with their note and **Revise and resubmit** when needed), the final assessment, and your certificate.
  - **Download my work (PDF):** everything you wrote in the course's activities, in one document.
  - Built automatically from the course as the instructor set it up, so it works for every course with no extra setup.
- **Give Feedback:** star ratings for the course and the LMS, and "Would you recommend USAII® to others?"
- **? button (top right):** opens **How to Navigate the USAII® LMS?**, the video your instructor has added. It opens once by itself the first time a new video is available.

## Instructor

The menu is **Cohort, Learners & Access, Assessments, Activity Metrics, Questions**, then **My Courses**. Instructors manage the courses they created.

- **Cohort:** three plain totals (learners, average completion, credentials), then one row per learner with expected completion, predicted score, and actions (View portal, Guidance, Message).
- **Learners & Access:** add learners with a password, give or remove course access, set new passwords, and **Suspend** or **Reinstate** a learner (filter: All, Active, Suspended).
- **Suspending a learner** (also from each Cohort row and from a learner's View page): they are signed out on their next click and cannot sign in, and they see "Your account is suspended. Please contact your instructor." Nothing is deleted. Suspended learners are left out of Cohort figures and listed under **Suspended learners**, where **Reinstate** gives access back straight away.
- **Assessments:** three tabs.
  - **Activity submissions** (first tab): opens on **Awaiting review**. Activities that need no review show **Submitted · no review needed** and stay out of that count.
  - **View Assessment** shows the learner's work, what the LMS **checked automatically**, and the rubric:
    - **Pass / Needs Work rubric:** the learner's earlier pages that the rubric draws on (for Course 1, the whole Day 1 to 9 playbook), then each dimension with its automatic checks and Pass / Needs work buttons. Approve needs every dimension to pass; **Return for revision** and **Not approved** need at least one marked Needs work and a note. With a revision limit, a revised version cannot be returned again. With an AI key, **Suggest a decision for each dimension** pre-fills nothing until you press **Use these decisions**.
    - **Rubric PDF:** the PDF beside the work. Enter the points awarded. With an AI key, **Suggest a score from the rubric** reads the PDF and the work.
    - Approving the last thing a certificate waits for issues the certificate at once.
  - Filters: filter by course (or all your courses), by status (Awaiting review, Approved, Resubmission requested, Not approved), and by learner name. Each row shows only the learner, course, and assessment submitted. **View Assessment** opens the learner's work with three decisions: **Approve**, **Request resubmission**, or **Not approved**, plus **Feedback on activity**. A note is needed for the last two. The learner is notified at once, and a resubmission comes back as "Awaiting review", with the earlier review kept for context.
  - **Checks and quizzes:** percent correct per question.
  - **Final assessment:** attempts and results.
- **Activity Metrics:**
  - Active learners and learning hours this week.
  - **Where learners are on Steps to Completion:** how many learners are on each step, plus who has not moved in 7 days.
  - **Study Guide and learners' work:** who opened the Study Guide in the LMS, PDF downloads, and downloads of learners' own work.
  - **Learner feedback:** "would recommend USAII®", course and LMS ratings, and recent comments.
- **Questions:** learner questions, each private between that learner and the instructor.
- **My Courses:** create, edit, publish, and duplicate courses.
- **Navigation video** (button at the top right of every instructor page): add, preview, replace, or remove the **How to Navigate the USAII® LMS?** video that learners see behind their **?** button. Changes reach learners straight away.

## How activities are evaluated

The full reference is **`ACTIVITY-EVALUATION.md`**. In short:

| What | How it is evaluated | Who |
|---|---|---|
| Check Your Understanding | Graded automatically. Best score counts toward the grade. | LMS |
| Final assessment | Graded automatically against the pass mark (Course 1: 75%, 12 of 16). | LMS |
| Activity, "Complete once submitted" | Complete when submitted. No review queue. | LMS |
| Activity with a Pass / Needs Work rubric | Pre-checked automatically, then each dimension decided by the instructor. | LMS + instructor |
| Activity with a rubric PDF | Points entered by the instructor (AI suggestion optional). | Instructor |

**Courses 1, 6, 7 and 8:** Days 1 to 9 are complete once submitted. Each Day 10 evidence package is reviewed against the five dimensions of that course's USAII grading sheet (all must pass, one revision), and the certificate waits for its approval.

**Course 1:** Days 1 to 9 are complete once submitted. The Day 10 evidence package (the Personal AI Productivity Playbook) is the only activity reviewed: five dimensions from the USAII grading sheet, all must pass, one revision. The certificate needs all ten lessons, the final at 75% or higher, the playbook approved, and an overall grade of 75% or higher.

## Creating a course

Go to **My Courses → Create course**. There are three steps:

1. **Course details:** course name, one-line description, who can join, and pass mark.
2. **Lessons:** a simple list of lesson names. Press **Edit** on a lesson to open it. The **Add to this lesson** bar stays at the top while you scroll:
   - **Heading, Paragraph, List, Quote, Link, Note**
   - **Multimedia → Video, Audio, Image**, each with upload or paste a link (YouTube and Vimeo links play in the lesson)
   - **Captions (the learner's transcript):** for **YouTube** videos nothing is needed: the captions already on the video are used (make sure captions are on). For **Vimeo**, the server needs `VIMEO_ACCESS_TOKEN`. For an **uploaded** video, load its caption file (.vtt, .srt) or press **Generate from video** (needs `GEMINI_API_KEY`); the same captions also appear on the player's CC button. Only the words spoken in the video belong here.
   - Each lesson also has **Quiz questions** (practice or timed) and an optional **Activity** tab. In **Activity**, write the instructions with paragraphs, headings, lists, notes, links, and **images**, then choose **How this activity is evaluated**:
     - **Complete once submitted** (no review, counts toward progress only),
     - **Pass / Needs Work rubric**: add each dimension, write what Pass looks like, tick the activities that hold its evidence (the LMS checks those automatically and shows them to the reviewer), and choose how many revisions are allowed,
     - **Rubric PDF with points**: upload the PDF and its total points.
     - Tick **The certificate waits for my approval of this activity** for a capstone.
   - **Preview as learner** shows the lesson exactly as learners will see it.
3. **Final test (optional):** questions, time limit, and number of attempts.

Press **Save**, then **Publish**. Published courses appear under the learner's **Explore Courses**, and anyone you added can open them.

## Your data

- **Where it's stored:** everything is saved in `data/db.json`, and uploads are saved in `uploads/`. Both survive restarts.
- **Starting over:** double-click `RESET-DEMO-DATA.bat` while the LMS is stopped.
- **Upgrading from 5.0 or later (including 5.9):** just start 5.10 on the same folder. Courses 6, 7 and 8 are added as drafts (a course you already have with the same id is left alone). Course 1's Day 10 evidence package gets its Pass / Needs Work rubric automatically (unless you already gave it a rubric), learners' work is kept, and certificates already issued stay issued. A copy of the old data file is kept in `data/`.
- **Upgrading from 4.9:** just start 5.0 on the same folder. Your data is kept; the administrator account, live sessions, and anything that only existed for them are removed automatically the first time it starts.

## Connecting a production backend

The screens talk to the server only through `/api/...` routes:

| Route | Used by |
|---|---|
| `/api/auth` | Sign-in, profile, password |
| `/api/learner` | Dashboard data, lessons, checks, activities, final test |
| `/api/staff` | Cohort, learners and access, assessments, activity, course builder |
| `/api/threads`, `/api/notifications`, `/api/feedback`, `/api/ai/tutor` | Community and support |
| `/api/uploads` | File uploads |
| `/api/payments` | Checkout and payment confirmation (learners); `/api/payments/webhook/...` for the gateways |
| `/api/transcripts` | Video captions as the learner's transcript, in their language |
| `/api/nav-video` | The navigation video: read (everyone signed in), upload/replace and remove (instructors) |

- **Database:** all data access goes through `server/db.ts`, so replacing the JSON file with PostgreSQL does not change any screen.
- **Analytics:** calculations live in one shared engine, `shared/analytics.ts`, and the data types are in `shared/types.ts`.

## Optional settings

Copy `.env.example` to `.env`:
- **`PORT`:** changes the starting port.
- **`UPLOAD_DIR`:** where uploaded files are kept (default `uploads/`). On a host, point it at a persistent disk.
- **`AUTH_SECRET`:** signs sign-in tokens. If unset, one is created in `data/secret.key`.
- **Uploaded files are private:** lesson videos, rubrics and learners' attachments open only for signed-in people with access to that course (or, for an attachment, its owner and instructors).
- **Creating an account:** learners can sign up themselves on the sign-in page (turn off with `ALLOW_SIGNUP=false`). "Forgot password?" emails a reset link when SMTP is set up.
- **Payments:** instructors open **Payment Settings** to turn on Razorpay (UPI, cards, netbanking), Stripe (international cards, Apple Pay, Google Pay) and PayPal: paste the keys, press Test connection. Step-by-step guide: `USAII-LMS-Hostinger-and-Payments-Guide.pdf`.
- **Payments (environment):** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (+ `RAZORPAY_WEBHOOK_SECRET`), or `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`); `PAYMENT_CURRENCY` (default USD); `PUBLIC_URL`. See DEPLOY.md, "Taking payments". Without a gateway, paid courses cannot be bought; free courses and instructor-granted access still work.
- **`VIMEO_ACCESS_TOKEN`:** reads the captions of Vimeo videos. YouTube captions need no key.
- **`ANTHROPIC_API_KEY` or `GEMINI_API_KEY`** (or **`GOOGLE_TRANSLATE_API_KEY`**): translates video captions into languages YouTube cannot translate itself (each video is translated once per language and cached for everyone). The AI keys also turn on rubric score suggestions and the study coach's own explanations.
- **`GEMINI_API_KEY`:** also enables **Generate from video** (automatic transcripts).
- **`SEED_INSTRUCTOR_PASSWORD`, `SEED_LEARNER_PASSWORD`:** passwords for the starter accounts on first start.
- **`TRUST_PROXY=1`:** set when running behind a host's proxy.

## For developers

```
npm install
npm run dev        # API + app on http://localhost:4600
npm run lint       # strict TypeScript check
npm test           # unit, adaptivity and evaluation tests (no server needed)
tests/run-realworld.sh /tmp/rw   # a full learner journey in a real browser (after npm run build)
npm run test:api   # API tests against a fresh server and a mock AI service
npm run prod       # production build served by the same server
```
