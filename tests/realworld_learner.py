"""
Real-world learner journey (run with tests/run-realworld.sh). Real-world run of the LMS through the browser only (no payment step: the course is free). Nothing is done through the API on anyone's behalf:
the API is read only to know the correct quiz answers (a real learner would know some and miss some).

instructor makes Course 6 free and publishes it -> a NEW learner signs up -> joins it from Explore Courses ->
works through all 10 days (learn, check, apply, reflect, complete) -> takes the final -> instructor reviews
the Day 10 evidence package and approves -> learner gets the certificate.
"""
import json, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
CID = 'c_project_delivery'
PW_I = 'VJ%NTj+R%zgvTp3wmc'
LEARNER = {'name': 'Riya Sharma', 'email': f'riya.{int(time.time())}@example.com', 'password': 'Learner!Pass2026x'}
STOP_AFTER_STUCK = 6

logf = open(f'{OUT}/log.txt', 'w')
def log(*a):
    line = ' '.join(str(x) for x in a)
    print(line, flush=True); logf.write(line + '\n'); logf.flush()

ISSUES = []
shot_n = [0]
def shot(page, name):
    shot_n[0] += 1
    p = f'{OUT}/{shot_n[0]:02d}-{name}.png'
    try: page.screenshot(path=p, full_page=False)
    except Exception: pass
    return p

def visible_buttons(page):
    try:
        return page.eval_on_selector_all('button, [role=button], a[href], [role=tab]', "els => els.filter(e => e.offsetParent !== null && !e.disabled).map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ')).filter(Boolean).slice(0, 45)")
    except Exception:
        return []

def issue(kind, where, what, page=None):
    p = shot(page, f'{kind}-{where}') if page else ''
    ISSUES.append({'kind': kind, 'where': where, 'what': what, 'shot': p})
    log(f'!! {kind} at {where}: {what}' + (f'\n   visible: {visible_buttons(page)}' if page and kind == 'STUCK' else ''))
    if sum(1 for i in ISSUES if i['kind'] == 'STUCK') >= STOP_AFTER_STUCK:
        raise SystemExit('too many stuck points')

def api(path, token=None, body=None, method=None):
    req = urllib.request.Request(BASE + '/api' + path, method=method or ('POST' if body is not None else 'GET'))
    if token: req.add_header('Authorization', 'Bearer ' + token)
    data = None
    if body is not None: req.add_header('Content-Type', 'application/json'); data = json.dumps(body).encode()
    with urllib.request.urlopen(req, data) as r: return json.loads(r.read())

def watch(page, who):
    page.on('pageerror', lambda e: issue('JS-ERROR', who, str(e)[:300]))
    page.on('console', lambda m: m.type == 'error' and not re.search(r'favicon|Failed to load resource', m.text) and issue('CONSOLE', who, m.text[:300]))
    def resp(r):
        u = r.url
        if '/api/' in u and r.status >= 400 and not re.search(r'/auth/me$', u):
            try: body = r.text()[:200]
            except Exception: body = ''
            log(f'   [{who}] HTTP {r.status} {r.request.method} {u.split("/api")[1][:80]} {body}')
            if r.status >= 500: issue('HTTP-500', who, f'{r.status} {u}')
    page.on('response', resp)
    page.on('requestfailed', lambda r: '/api/' in r.url and issue('NETWORK', who, f'{r.method} {r.url.split("/api")[1][:80]} failed: {r.failure}'))

def click(page, name, where, role='button', exact=False, timeout=8000, optional=False):
    loc = page.get_by_role(role, name=name if isinstance(name, re.Pattern) else name, exact=exact).first
    try:
        loc.click(timeout=timeout)
        return True
    except Exception as e:
        if not optional:
            issue('STUCK', where, f'cannot click {role} "{name.pattern if isinstance(name, re.Pattern) else name}" ({e.__class__.__name__})', page)
        return False

def wait_text(page, pattern, where, timeout=10000, optional=False):
    try:
        page.get_by_text(re.compile(pattern)).first.wait_for(timeout=timeout)
        return True
    except Exception:
        if not optional: issue('STUCK', where, f'never saw text /{pattern}/', page)
        return False

t0 = time.time()
def step(msg): log(f'[{time.time() - t0:6.1f}s] {msg}')

ti = api('/auth/login', body={'email': 'instructor@usaii.org', 'password': PW_I})['token']
KEY = api(f'/staff/courses/{CID}', ti)['course']   # only to know the right answers

with sync_playwright() as p:
    browser = p.chromium.launch()

    # ---------------- Instructor: set a price and publish ----------------
    ictx = browser.new_context(viewport={'width': 1440, 'height': 900})
    ip = ictx.new_page(); watch(ip, 'instructor')
    step('instructor signs in')
    ip.goto(BASE + '/'); ip.wait_for_selector('#email')
    ip.get_by_role('tab', name='Instructor').click()
    ip.fill('#email', 'instructor@usaii.org'); ip.fill('#password', PW_I)
    click(ip, 'Sign in as Instructor', 'instructor-login')
    ip.wait_for_timeout(2500)
    step('instructor opens Course 6 in Course Builder and sets the price')
    ip.goto(f'{BASE}/#/courses'); ip.wait_for_timeout(1500)
    card = ip.locator('div', has_text='AI-Assisted Project Delivery').filter(has=ip.get_by_role('button', name=re.compile('^Edit'))).last
    try:
        card.get_by_role('button', name=re.compile('^Edit')).first.click(timeout=6000)
    except Exception:
        issue('STUCK', 'courses-list', 'no Edit button for Course 6 on My Courses', ip)
        ip.goto(f'{BASE}/#/courses/edit/{CID}')
    ip.wait_for_timeout(1500)
    price = ip.get_by_label('Price', exact=True)
    try:
        price.first.fill('0', timeout=6000)
    except Exception:
        issue('STUCK', 'builder-price', 'price field not found by its label', ip)
    shot(ip, 'builder-price')
    if not click(ip, re.compile(r'^Publish'), 'builder-publish', optional=True):
        click(ip, re.compile(r'^Save'), 'builder-save')
        ip.wait_for_timeout(1200)
        ip.goto(f'{BASE}/#/courses'); ip.wait_for_timeout(1500)
        click(ip, re.compile('^Publish'), 'courses-publish')
    ip.wait_for_timeout(2000)
    c = api(f'/staff/courses/{CID}', ti)['course']
    log(f'   course now: status={c["status"]} price={c.get("price")}')
    if c['status'] != 'published':
        issue('BLOCKER', 'publish', f'course is {c["status"]} with price {c.get("price")} after pressing Publish', ip)
        api(f'/staff/courses/{CID}', ti, {**c, 'price': 0, 'priceSet': True}, 'PUT'); api(f'/staff/courses/{CID}/status', ti, {'status': 'published'})

    # ---------------- New learner: sign up and buy ----------------
    lctx = browser.new_context(viewport={'width': 1366, 'height': 860})
    lp = lctx.new_page(); watch(lp, 'learner')
    step('new learner signs up')
    lp.goto(BASE + '/'); lp.wait_for_selector('#email')
    opened = False
    for txt in [re.compile(r'Create (an |your )?(learner )?account', re.I), re.compile(r'Sign up|New here|Register', re.I)]:
        try:
            lp.get_by_text(txt).first.click(timeout=3000); opened = True; break
        except Exception:
            pass
    if not opened: issue('STUCK', 'signup', 'no visible way to create a learner account', lp)
    lp.wait_for_timeout(500)
    try:
        lp.fill('#name', LEARNER['name']); lp.fill('#email', LEARNER['email']); lp.fill('#password', LEARNER['password'])
    except Exception as e:
        issue('STUCK', 'signup-form', f'sign-up form fields missing ({e.__class__.__name__})', lp)
    click(lp, 'Create my account', 'signup-submit')
    lp.wait_for_timeout(3000)
    shot(lp, 'after-signup')
    for name in ['Skip for now', 'Skip', 'Close', 'Not now']:
        if click(lp, name, 'onboarding', optional=True, timeout=1500): lp.wait_for_timeout(600)

    step('learner finds Course 6 on Explore Courses and joins it')
    lp.goto(f'{BASE}/#/explore'); lp.wait_for_timeout(2000)
    shot(lp, 'explore')
    join = lp.get_by_role('button', name='Start for free')
    cards = lp.locator('div').filter(has_text='AI-Assisted Project Delivery').filter(has=join)
    try:
        cards.last.get_by_role('button', name='Start for free').click(timeout=6000)
    except Exception:
        issue('STUCK', 'explore-join', 'no "Start for free" button on the Course 6 card', lp)
    lp.wait_for_timeout(2500)
    shot(lp, 'after-join')
    ok_enrolled = wait_text(lp, r'Enrolled: go to course|You are enrolled|Welcome', 'after-join', timeout=8000, optional=True)
    log(f'   enrolled shown on screen: {ok_enrolled}')

    # ---------------- Learner: all ten days ----------------
    flat = [l for m in KEY['modules'] for l in m['lessons']]
    click(lp, 'Enrolled: go to course', 'go-to-course', optional=True)
    lp.wait_for_timeout(2000)
    shot(lp, 'dashboard')

    def answer_check(page, qs, wrong_first=False, where=''):
        # answers each question by clicking the option text inside its radiogroup
        for qi, q in enumerate(qs):
            grp = page.get_by_role('radiogroup', name=f'Question {qi + 1}')
            ci = q['correctIndex']
            if wrong_first and qi == 0: ci = (ci + 1) % 4
            try:
                grp.get_by_role('radio').nth(ci).click(timeout=5000)
            except Exception:
                issue('STUCK', where, f'cannot pick an answer for question {qi + 1}', page); return False
        return True

    for i, les in enumerate(flat, start=1):
        lid = les['id']
        step(f'Day {i}: {les["title"]}')
        lp.goto(f'{BASE}/#/study/{CID}/{lid}'); lp.wait_for_timeout(1800)
        if not wait_text(lp, re.escape(les['title']), f'{lid}-open', timeout=8000): continue
        # Learn: read to the end
        lp.mouse.wheel(0, 30000); lp.wait_for_timeout(700)
        # Check
        if les['check']:
            if not click(lp, re.compile(r'^Continue to Check'), f'{lid}-to-check', optional=True):
                lp.locator('nav[aria-label="Lesson steps"] button', has_text='Check').click()
            lp.wait_for_timeout(800)
            click(lp, re.compile(r'^Start'), f'{lid}-start-check', optional=True, timeout=1500)
            if answer_check(lp, les['check'], wrong_first=(i == 1), where=f'{lid}-check'):
                click(lp, re.compile(r'^Submit'), f'{lid}-submit-check')
                lp.wait_for_timeout(1500)
                if i == 1:
                    shot(lp, 'day1-check-result')
                    # retake after one wrong answer
                    if click(lp, re.compile(r'Retake|Practice again|Try again'), f'{lid}-retake', optional=True):
                        lp.wait_for_timeout(800)
                        click(lp, re.compile(r'^Start'), f'{lid}-start-check-2', optional=True, timeout=1500)
                        answer_check(lp, les['check'], where=f'{lid}-check-2')
                        click(lp, re.compile(r'^Submit'), f'{lid}-submit-check-2')
                        lp.wait_for_timeout(1500)
                    else:
                        issue('UX', f'{lid}-retake', 'no visible way to retake a practice check after a wrong answer', lp)
        # Apply
        if not click(lp, re.compile(r'^Continue to Apply'), f'{lid}-to-apply', optional=True):
            lp.locator('nav[aria-label="Lesson steps"] button', has_text='Apply').click()
        lp.wait_for_timeout(900)
        filled = 0
        if i == 1:
            half = les['activity']['fields'][:10]
            for f in half:
                lp.get_by_label(re.compile('^' + re.escape(f['label']))).first.fill('Draft answer typed before the page reloaded.')
            lp.wait_for_timeout(900)
            step('   reloading the page halfway through the Day 1 template')
            lp.reload(); lp.wait_for_timeout(2500)
            if not click(lp, re.compile(r'^Continue to Apply'), f'{lid}-to-apply-again', optional=True):
                lp.locator('nav[aria-label="Lesson steps"] button', has_text='Apply').click()
            lp.wait_for_timeout(900)
            kept = sum(1 for f in half if lp.get_by_label(re.compile('^' + re.escape(f['label']))).first.input_value() == 'Draft answer typed before the page reloaded.')
            log(f'   answers kept after reload: {kept} of {len(half)}')
            if kept < len(half): issue('BUG', f'{lid}-draft', f'only {kept} of {len(half)} typed answers survived a page reload', lp)
            if not wait_text(lp, r'unsent answers were kept', f'{lid}-draft-note', timeout=3000, optional=True):
                issue('UX', f'{lid}-draft', 'no note that the unsent answers were restored', lp)
            shot(lp, 'day1-draft-restored')
        for f in les['activity']['fields']:
            text = 'Sanitized: weekly client progress report for phase two of the medical office build; site manager reviews it before it goes out.'
            if 'implementation note' in f['label']: text = ' '.join(['I will run the toolkit on the phase two build every Tuesday with the site manager and get sign-off from the operations director before anything reaches the client.'] * 6)
            if f.get('placeholder') in ('Yes / No', 'yes / no'): text = 'Yes'
            elif f.get('placeholder') == 'H/M/L': text = 'H'
            try:
                lp.get_by_label(re.compile('^' + re.escape(f['label']))).first.fill(text, timeout=4000); filled += 1
            except Exception:
                pass
        if filled < len(les['activity']['fields']):
            issue('UX', f'{lid}-apply', f'only {filled} of {len(les["activity"]["fields"])} answer boxes could be reached by their label (screen readers and autofill depend on it)', lp)
            # fall back to filling the boxes in order
            boxes = lp.locator('form textarea, form input[type=text], main textarea, main input:not([type])')
            try:
                for k in range(boxes.count()):
                    if not boxes.nth(k).input_value(): boxes.nth(k).fill('Sanitized real project detail written by the learner.')
            except Exception:
                pass
        if i == 10: shot(lp, 'day10-before-submit')
        click(lp, re.compile(r'^Submit activity'), f'{lid}-submit-activity')
        lp.wait_for_timeout(1500)
        # Reflect and complete
        if not click(lp, re.compile(r'^Continue to Reflect'), f'{lid}-to-reflect', optional=True):
            lp.locator('nav[aria-label="Lesson steps"] button', has_text='Reflect').click()
        lp.wait_for_timeout(900)
        try:
            ta = lp.locator('textarea').first
            if ta.is_visible(): ta.fill('The review step before anything reaches the client is what I will keep.')
        except Exception:
            pass
        if not click(lp, re.compile(r'Mark (this )?lesson complete'), f'{lid}-complete'):
            continue
        lp.wait_for_timeout(1500)
        if not wait_text(lp, r'^Completed$|Lesson complete|completed', f'{lid}-completed', timeout=6000, optional=True):
            issue('STUCK', f'{lid}-completed', 'pressed "Mark lesson complete" but the lesson does not show as completed', lp)
        if i in (1, 5, 10): shot(lp, f'day{i}-done')

    # ---------------- Final assessment ----------------
    step('final assessment')
    # as a learner does: Steps to Completion -> Final assessment
    try:
        lp.locator('aside a, aside button, nav a, nav button', has_text='Final assessment').first.click(timeout=6000)
    except Exception:
        issue('STUCK', 'final-open', 'no "Final assessment" link in Steps to Completion', lp)
        lp.goto(f'{BASE}/#/final')
    lp.wait_for_timeout(2000)
    shot(lp, 'final-intro')
    click(lp, re.compile(r'^Start'), 'final-start')
    lp.wait_for_timeout(1500)
    fq = KEY['finalExam']['questions']
    weak = [dict(q, correctIndex=(q['correctIndex'] + 1) % 4) if k < 7 else q for k, q in enumerate(fq)]   # 9 of 16
    if answer_check(lp, weak, where='final-1'):
        click(lp, re.compile(r'^Submit final assessment'), 'final-submit-1')
        lp.wait_for_timeout(1200)
        click(lp, re.compile(r'^Submit'), 'final-confirm-1', optional=True, timeout=2000)
        lp.wait_for_timeout(2500)
    shot(lp, 'final-failed')
    if not wait_text(lp, r'[Nn]ot (yet )?passed|did not pass|56%|try again|attempts? left', 'final-fail-message', timeout=6000, optional=True):
        issue('UX', 'final', 'after a failed final, the page does not say clearly that it was not passed', lp)
    step('   retaking the final')
    click(lp, re.compile(r'^Try again'), 'final-retake')
    lp.wait_for_timeout(1500)
    click(lp, re.compile(r'^Start'), 'final-start-2', optional=True, timeout=1500)
    if answer_check(lp, fq, where='final-2'):
        click(lp, re.compile(r'^Submit final assessment'), 'final-submit-2')
        lp.wait_for_timeout(1200)
        click(lp, re.compile(r'^Submit'), 'final-confirm-2', optional=True, timeout=2000)
        lp.wait_for_timeout(2500)
    shot(lp, 'final-result')
    wait_text(lp, r'[Pp]assed|You passed|100%', 'final-result', timeout=8000)
    if wait_text(lp, r'Certificate earned|You earned', 'final-cert-too-early', timeout=2000, optional=True):
        issue('BUG', 'final', 'certificate shows as earned before the evidence package was approved', lp)

    # learner looks at where things stand
    lp.goto(f'{BASE}/#/dashboard'); lp.wait_for_timeout(2000)
    shot(lp, 'dashboard-waiting')
    if not wait_text(lp, r'with your instructor', 'dashboard-next-step', timeout=5000, optional=True):
        issue('UX', 'dashboard', 'the dashboard does not tell the learner the certificate is waiting for the instructor', lp)

    # ---------------- Instructor reviews Day 10 ----------------
    step('instructor reviews the evidence package')
    ip.goto(f'{BASE}/#/assessments'); ip.wait_for_timeout(2500)
    shot(ip, 'assessments')
    row = ip.locator('tr', has_text=LEARNER['name']).filter(has_text='Evidence package')
    try:
        row.get_by_role('button', name='View Assessment').first.click(timeout=6000)
    except Exception:
        issue('STUCK', 'assessments', f'the evidence package from {LEARNER["name"]} is not in the review queue', ip)
    ip.wait_for_timeout(2000)
    for dim in ['Completeness', 'Correctness', 'Robustness', 'Applicability', 'Deployability']:
        try:
            ip.locator(f'[role=radiogroup][aria-label="{dim}"] [role=radio]', has_text='Pass').click(timeout=4000)
        except Exception:
            issue('STUCK', 'review', f'cannot mark {dim} Pass', ip); break
    shot(ip, 'review-ready')
    click(ip, 'Approve', 'review-approve', exact=True)
    ip.wait_for_timeout(2500)
    shot(ip, 'review-done')

    # ---------------- Learner: certificate ----------------
    step('learner checks the certificate')
    lp.goto(f'{BASE}/#/credential'); lp.wait_for_timeout(2500)
    shot(lp, 'credential')
    if not wait_text(lp, r'USAII|Certificate', 'credential', timeout=6000, optional=True):
        issue('BUG', 'credential', 'credential page shows nothing', lp)
    lp.wait_for_timeout(2500)
    tiles = lp.locator('main').inner_text()
    m = re.search(r'(\d+)\s*of\s*1\s*Certifications', tiles.replace('\n', ' '))
    log(f'   vault tile says: {m.group(0) if m else "?"}')
    if not m or m.group(1) != '1':
        issue('BUG', 'vault', f'certificate shown as earned but the Certifications tile says {m.group(0) if m else "nothing"}', lp)
    shot(lp, 'credential-after')

    # ---------------- The same learner on a phone ----------------
    step('learner on a phone-size screen')
    mctx = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
    mp = mctx.new_page(); watch(mp, 'phone')
    mp.goto(BASE + '/'); mp.wait_for_selector('#email')
    mp.fill('#email', LEARNER['email']); mp.fill('#password', LEARNER['password'])
    click(mp, 'Sign in as Learner', 'phone-login')
    mp.wait_for_timeout(2500)
    for route, name in [('dashboard', 'phone-dashboard'), (f'study/{CID}/pd-d2', 'phone-lesson'), (f'study/{CID}/pd-d2?step=apply', 'phone-apply'), ('vault', 'phone-vault')]:
        mp.goto(f'{BASE}/#/{route}'); mp.wait_for_timeout(2200)
        over = mp.evaluate("() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth")
        wide = mp.evaluate("""() => [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 2 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 4).map(e => e.tagName + '.' + String(e.className).slice(0, 50))""")
        if over > 2: issue('LAYOUT', name, f'the page scrolls sideways on a phone by {over}px: {wide}', mp)
        shot(mp, name)
    browser.close()

log('\n==== SUMMARY ====')
log(f'learner: {LEARNER["email"]}')
for k in ['BLOCKER', 'STUCK', 'BUG', 'HTTP-500', 'NETWORK', 'JS-ERROR', 'CONSOLE', 'LAYOUT', 'UX']:
    for i in [x for x in ISSUES if x['kind'] == k]:
        log(f'{k:9} {i["where"]}: {i["what"]}')
log(f'{len(ISSUES)} issue(s) in {time.time() - t0:.0f}s')
json.dump({'issues': ISSUES, 'learner': LEARNER}, open(f'{OUT}/result.json', 'w'), indent=1)

sys.exit(1 if any(i['kind'] in ('BLOCKER', 'STUCK', 'BUG', 'HTTP-500', 'JS-ERROR') for i in ISSUES) else 0)
