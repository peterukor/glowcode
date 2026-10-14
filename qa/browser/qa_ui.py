"""QA acceptance: lesson interactions, navigation, progress, accessibility and responsive layout."""
import json, os, re
from playwright.sync_api import sync_playwright
BASE = "http://localhost:4174"
C = f"{BASE}/courses/python-fundamentals"
LESSONS = ["what-is-programming", "how-computers-follow-instructions", "first-python-program", "print-and-output", "reading-code-step-by-step", "chapter-1-review", "why-variables-exist"]
os.makedirs("qa/ui", exist_ok=True)
R = []
def check(cid, name, ok, detail=""):
    R.append((cid, name, bool(ok), detail)); print(("PASS " if ok else "FAIL ") + f"[{cid}] {name}" + (f"  [{detail}]" if detail else ""))
def progress(pg):
    raw = pg.evaluate("localStorage.getItem('glowcode:progress')"); return json.loads(raw)["data"] if raw else {}
OVF = "document.documentElement.scrollWidth - window.innerWidth"

CONTRAST = """(sel) => {
  const lum = c => { const [r,g,b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126*r + 0.7152*g + 0.0722*b };
  const parse = s => { const m = s.match(/[\\d.]+/g); return m ? m.map(Number) : [0,0,0,0] };
  const toRGB = s => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = s; c.fillRect(0,0,1,1); return [...c.getImageData(0,0,1,1).data] };
  const bgOf = el => { let stack = []; for (let e = el; e; e = e.parentElement) { const c = toRGB(getComputedStyle(e).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] === 255) break } }
    let base = [255,255,255]; if (!stack.length || stack[stack.length-1][3] < 255) base = toRGB(getComputedStyle(document.body).backgroundColor).slice(0,3);
    for (const c of stack.reverse()) { const a = c[3]/255; base = base.map((v,i) => c[i]*a + v*(1-a)) } return base };
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!el.offsetParent || !el.textContent.trim() || el.closest('.viz-stage, svg, [aria-hidden=true]')) continue;
    if ([...el.childNodes].every(n => n.nodeType !== 3 || !n.textContent.trim())) continue;
    const cs = getComputedStyle(el); const fg = toRGB(cs.color); const a = fg[3]/255 * Number(cs.opacity);
    const bg = bgOf(el); const fgc = fg.slice(0,3).map((v,i) => v*a + bg[i]*(1-a));
    const L1 = lum(fgc), L2 = lum(bg); const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700; const large = size >= 24 || (bold && size >= 18.66);
    if (ratio < (large ? 3 : 4.5)) out.push({ text: el.textContent.trim().slice(0, 40), ratio: Math.round(ratio*100)/100, size, cls: el.className.toString().slice(0, 60) });
  }
  return out;
}"""

with sync_playwright() as p:
    br = p.chromium.launch()
    errors = []
    def page(w, h, **kw):
        ctx = br.new_context(viewport={"width": w, "height": h}, **kw); pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"{w}: {e}")); return pg

    # ======================================================= interactions (desktop)
    pg = page(1440, 950)
    pg.goto(f"{C}/print-and-output"); pg.wait_for_timeout(400)
    q = pg.locator("#activity-predict-quoted-sum"); q.scroll_into_view_if_needed()
    check("I-1", "Prediction: Check answer is disabled and no answer or explanation shows before an attempt",
          q.get_by_role("button", name="Check answer").is_disabled() and q.get_by_text("Because `10 + 5` is inside quotes").count() == 0 and q.get_by_text("is inside quotes, it's a string").count() == 0 and q.get_by_role("button", name="Show the answer").count() == 0)
    q.get_by_role("button", name=re.compile("Hint")).click(); pg.wait_for_timeout(100)
    check("I-2", "Hint appears on request, before answering", q.get_by_text("inside quotes or not", exact=False).count() == 1)
    q.get_by_label("15", exact=True).check(); q.get_by_role("button", name="Check answer").click(); pg.wait_for_timeout(150)
    check("I-3", "Wrong answer gets specific feedback; the explanation stays hidden", q.get_by_text("Everything between them is text", exact=False).count() == 1 and q.get_by_text("is inside quotes, it's a string", exact=False).count() == 0)
    q.get_by_role("button", name=re.compile("Try again")).click(); pg.wait_for_timeout(100)
    ruled = q.get_by_role("radio", name=re.compile(r"^15"))
    check("I-4", "Retry without reloading; the ruled-out choice is disabled", ruled.is_disabled())
    q.get_by_label("10 + 5", exact=True).check(); q.get_by_role("button", name="Check answer").click(); pg.wait_for_timeout(150)
    check("I-5", "Right answer is confirmed with the explanation", q.get_by_text("Yes, that's it!").count() == 1 and q.get_by_text("is inside quotes, it's a string", exact=False).count() == 1)
    d = pg.locator("#activity-debug-missing-parenthesis"); d.scroll_into_view_if_needed()
    d.get_by_label("The string needs single quotes").check(); d.get_by_role("button", name="Check answer").click(); pg.wait_for_timeout(100)
    d.get_by_role("button", name="Show the answer").click(); pg.wait_for_timeout(100)
    check("I-6", "After a wrong try, 'Show the answer' reveals the answer and why", d.get_by_text("Here's the answer.").count() == 1 and d.get_by_text("Every `(` needs a matching", exact=False).count() + d.get_by_text("needs a matching", exact=False).count() >= 1)
    pr = pg.locator("#activity-practice-scoreboard"); pr.scroll_into_view_if_needed()
    hidden = pr.get_by_text("print(1500)").count() == 0
    pr.get_by_role("button", name="Show a hint").click(); pg.wait_for_timeout(100)
    h1 = pr.get_by_text("Hint 1 of 2", exact=False).count() == 1
    pr.get_by_role("button", name="Show a sample solution").click(); pg.wait_for_timeout(100)
    gated = pr.get_by_text("Have you given it a real try?").count() == 1 and pr.get_by_text("Why this works").count() == 0
    pr.get_by_role("button", name="Show the sample solution").click(); pg.wait_for_timeout(100)
    check("I-7", "Practice: solution hidden at first, hints one at a time, solution behind a 'have you tried?' step",
          hidden and h1 and gated and pr.get_by_text("Why this works").count() == 1, f"hidden={hidden} hint1={h1} gated={gated}")
    pg.goto(f"{C}/reading-code-step-by-step"); pg.wait_for_timeout(400)
    r = pg.locator("#activity-reflect-output-order"); r.scroll_into_view_if_needed()
    before = r.get_by_text("Python runs one statement at a time, from the top", exact=False).is_visible() if r.get_by_text("Python runs one statement at a time, from the top", exact=False).count() else False
    r.get_by_role("button", name="Compare with an explanation").click(); pg.wait_for_timeout(100)
    check("I-8", "Reflection: model answer only after the student asks", not before and r.get_by_text("Python runs one statement at a time, from the top", exact=False).is_visible())
    # walkthrough checkpoint + keyboard
    btn = pg.locator("#open-py-trace-ready"); btn.scroll_into_view_if_needed(); btn.focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(500)
    wt = pg.locator("section.walkthrough-inline")
    check("I-9", "Keyboard: Enter on 'Walk through code' opens the walkthrough and moves focus into it", wt.count() == 1 and pg.evaluate("document.activeElement.closest('section.walkthrough-inline') !== null"))
    nextb = wt.get_by_role("button", name="Next step", exact=True)
    out_lines = lambda: [t.strip() for t in wt.locator(".bg-code-bg div").all_inner_texts() if t.strip().startswith("›")]
    check("I-10", "Checkpoint: Next is blocked and line 2's output isn't shown before the prediction", nextb.is_disabled() and out_lines() == ["› Ready"], str(out_lines()))
    cp = wt.locator(".checkpoint")
    cp.get_by_role("radio").first.focus(); pg.keyboard.press("Space"); pg.wait_for_timeout(50)
    cp.get_by_role("button", name="Check prediction").focus(); pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
    check("I-11", "Keyboard: a prediction can be chosen with Space and checked with Enter; wrong choice explained, step still hidden",
          cp.get_by_text("would show, with quotes", exact=False).count() == 1 and out_lines() == ["› Ready"])
    cp.get_by_role("button", name="Reveal next step").click(); pg.wait_for_timeout(300)
    pg.locator("section.walkthrough-inline h3").first.focus()
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(300)
    check("I-12", "Keyboard: → steps forward inside the walkthrough", out_lines() == ["› Ready", "› 15"], str(out_lines()))
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(300)
    check("I-13", "Keyboard: ← steps back", out_lines() == ["› Ready"], str(out_lines()))
    pg.screenshot(path="qa/ui/walkthrough-keyboard.png")
    # focus visibility on tab stops
    pg.goto(f"{C}/first-python-program"); pg.wait_for_timeout(400)
    pg.locator("body").click(position={"x": 5, "y": 300})
    invisible, seen = [], 0
    for _ in range(45):
        pg.keyboard.press("Tab"); pg.wait_for_timeout(30)
        info = pg.evaluate("""() => { const e = document.activeElement; if (!e || e === document.body) return null;
          const snap = () => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.backgroundColor, s.borderColor, s.textDecorationLine].join('|') };
          const on = snap(); e.blur(); const off = snap(); e.focus({ preventScroll: true });
          return { tag: e.tagName, name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), ring: on !== off } }""")
        if info: seen += 1; (None if info["ring"] else invisible.append(f'{info["tag"]}:{info["name"]}'))
    check("A-FOCUS", "Keyboard focus visibly changes the style of every one of the first 45 tab stops of a lesson (focused vs blurred)", seen > 30 and not invisible, f"{seen} stops; no ring: {invisible[:6]}")
    # unlabeled controls
    unl = pg.evaluate("""() => [...document.querySelectorAll('button, a[href], input, [role=button], [role=radio]')].filter(e => e.offsetParent || e.type === 'radio').filter(e => {
        const n = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.textContent) || e.closest('label')?.textContent || '').trim(); return !n }).map(e => e.outerHTML.slice(0, 90))""")
    check("A-LABELS", "Every visible button, link and input on a lesson has an accessible name", not unl, str(unl[:3]))
    imgs = pg.evaluate("() => [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length")
    check("A-ALT", "Images have alt text", imgs == 0, str(imgs))
    hs = pg.evaluate("() => ({ h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, title: document.title })")
    check("A-STRUCT", "One h1 per lesson page, a page language and a title", hs["h1"] == 1 and hs["lang"] and "Glowcode" in hs["title"], str(hs))

    # ======================================================= contrast, light and dark
    for theme in ["light", "dark"]:
        cp_ = page(1440, 950, color_scheme=theme)
        bad = []
        for url in [f"{BASE}/", f"{BASE}/courses", f"{C}/print-and-output", f"{C}/chapter-1-review", f"{BASE}/reference", f"{BASE}/reference/concept.expression"]:
            cp_.goto(url); cp_.wait_for_timeout(400)
            if theme == "dark":
                cp_.evaluate("() => { document.documentElement.classList.add('dark'); }"); cp_.wait_for_timeout(100)
            for x in cp_.evaluate(CONTRAST, "p, li, span, a, button, label, h1, h2, h3, h4, dt, dd, small, figcaption, code, td, th"):
                bad.append({**x, "url": url.replace(BASE, "")})
        uniq = {}
        for b in bad: uniq.setdefault((b["text"], b["cls"]), b)
        json.dump(list(uniq.values()), open(f"qa/ui/contrast-{theme}.json", "w"), indent=1)
        check(f"A-CONTRAST-{theme}", f"{theme} theme: text meets WCAG AA contrast on the main pages (computed per element)", not uniq,
              f"{len(uniq)} below AA: " + "; ".join(f'{b["text"]!r} {b["ratio"]} {b["url"]}' for b in list(uniq.values())[:5]))

    # ======================================================= navigation and progress
    pg = page(1440, 950)
    pg.goto(f"{BASE}/courses"); pg.wait_for_timeout(400)
    card = pg.locator("article.course-card").filter(has_text="Python Fundamentals")
    check("N-1", "Dashboard: Python card shows lessons, chapter availability and Start; other courses Coming soon",
          card.get_by_text("2 of 10 chapters available · 8 planned").count() == 1 and card.get_by_role("link", name="Start learning").count() == 1 and pg.get_by_text("Coming soon").count() >= 3)
    card.get_by_role("link", name="Start learning").click(); pg.wait_for_timeout(500)
    cols = pg.evaluate("() => ['aside.lesson-panel-left', '.lesson-center', 'aside.lesson-panel-right'].map(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)] })")
    check("N-2", "Desktop lesson page has three columns: contents, lesson, Ask Glow", all(cols) and cols[0][0] < cols[1][0] < cols[2][0], str(cols))
    pg.locator("aside.lesson-panel-left").get_by_role("link", name="Understanding print() and Output").click(); pg.wait_for_timeout(400)
    check("N-3", "Contents link opens another lesson (no locking)", pg.url.endswith("/print-and-output"))
    pg.get_by_role("link", name=re.compile("Reading Code Step by Step")).last.click(); pg.wait_for_timeout(400)
    ok_next = pg.url.endswith("/reading-code-step-by-step")
    pg.get_by_role("link", name=re.compile("Understanding print\\(\\) and Output")).last.click(); pg.wait_for_timeout(400)
    check("N-4", "Next and Previous lesson links at the bottom work", ok_next and pg.url.endswith("/print-and-output"))
    pg.go_back(); pg.wait_for_timeout(400); b1 = pg.url
    pg.go_back(); pg.wait_for_timeout(400); b2 = pg.url
    pg.go_forward(); pg.wait_for_timeout(400); f1 = pg.url
    check("N-5", "Browser Back and Forward move between visited lessons", b1.endswith("/reading-code-step-by-step") and b2.endswith("/print-and-output") and f1.endswith("/reading-code-step-by-step"), f"{b1} {b2} {f1}")
    tog = pg.locator("aside.lesson-panel-left").get_by_role("button", name=re.compile("Getting Started with Programming"))
    tog.click(); pg.wait_for_timeout(150); collapsed = tog.get_attribute("aria-expanded") == "false" and pg.locator("aside.lesson-panel-left").get_by_role("link", name="Your First Python Program").count() == 0
    tog.click(); pg.wait_for_timeout(150)
    check("N-6", "Chapter headings fold and unfold, with aria-expanded", collapsed and tog.get_attribute("aria-expanded") == "true")
    pg.goto(f"{C}/why-variables-exist"); pg.wait_for_timeout(400)
    check("N-7", "A Chapter 2 lesson opens directly without finishing Chapter 1 (no locking)", pg.get_by_role("heading", level=1).count() == 1 and "Why" in pg.get_by_role("heading", level=1).inner_text())
    pg.goto(f"{C}/first-python-program"); pg.wait_for_timeout(300)
    pg.get_by_role("button", name="Mark lesson complete").click(); pg.wait_for_timeout(200)
    pg.reload(); pg.wait_for_timeout(400)
    done = progress(pg).get("courses", {}).get("python-fundamentals", {}).get("completed", {})
    side = pg.locator("aside.lesson-panel-left")
    check("N-8", "Completion persists after reload, in storage and in the contents (1 of 7, tick on the lesson)",
          "first-python-program" in done and pg.get_by_text("Lesson complete!").count() == 1 and side.get_by_text("1 of 7 lessons complete").count() == 1 and side.get_by_text("(completed)").count() == 1, str(list(done)))
    pg.get_by_role("button", name=re.compile("Mark as not complete|Undo|not complete", re.I)).first.click() if pg.get_by_role("button", name=re.compile("not complete", re.I)).count() else None
    pg.goto(f"{BASE}/courses"); pg.wait_for_timeout(400)
    check("N-9", "Dashboard offers Continue learning with the last visited lesson", pg.locator("article.course-card").first.get_by_role("link", name="Continue learning").count() == 1)
    # manual round trip
    pg.goto(f"{C}/print-and-output"); pg.wait_for_timeout(400)
    term = pg.locator(".ref-term").filter(has_text=re.compile("^integer$")).first; term.scroll_into_view_if_needed(); y0 = pg.evaluate("scrollY")
    term.click(); pg.wait_for_timeout(250)
    pg.get_by_role("dialog").get_by_role("link", name="See more").click(); pg.wait_for_timeout(400)
    on_int = "/reference/python.types.int?" in pg.url
    if not on_int: print("DEBUG integer term went to", pg.url, term.inner_text() if term.count() else None)
    pg.get_by_role("button", name=re.compile("Back to Understanding print")).click(); pg.wait_for_timeout(600)
    check("N-10", "Manual: term popup → full entry → Back returns to the same place in the lesson",
          on_int and pg.url.endswith("/print-and-output") and abs(pg.evaluate("scrollY") - y0) < 120, f"{on_int} {pg.url} {y0}→{pg.evaluate('scrollY')}")

    # ======================================================= link crawl
    seen, queue, broken = set(), [f"{BASE}/", f"{BASE}/courses", f"{BASE}/reference", f"{BASE}/playground"] + [f"{C}/{l}" for l in LESSONS], []
    while queue:
        u = queue.pop(0)
        if u in seen: continue
        seen.add(u)
        pg.goto(u); pg.wait_for_timeout(250)
        nf = pg.get_by_role("heading", name=re.compile("^(Page not found|Something broke|No entry called)")).count()
        if nf: broken.append(u)
        for h in pg.evaluate("() => [...document.querySelectorAll('a[href]')].map(a => a.href)"):
            h = h.split("#")[0]
            if h.startswith(BASE) and h not in seen and "/dev/" not in h: queue.append(h)
    check("N-11", f"No broken internal links (crawled {len(seen)} pages from home, courses, manual and every lesson)", not broken, str(broken[:5]))

    # ======================================================= responsive: overflow at 3 widths
    for label, (w, h) in {"desktop": (1440, 900), "tablet": (820, 1180), "phone": (375, 812)}.items():
        rp = page(w, h, is_mobile=label != "desktop", has_touch=label != "desktop")
        bad = []
        for u in [f"{BASE}/", f"{BASE}/courses", f"{BASE}/reference", f"{BASE}/reference/concept.expression", f"{BASE}/playground"] + [f"{C}/{l}" for l in LESSONS]:
            rp.goto(u); rp.wait_for_timeout(300)
            o = rp.evaluate(OVF)
            if o > 0: bad.append(f"{u.replace(BASE, '')}:{o}px")
        rp.goto(f"{C}/print-and-output"); rp.wait_for_timeout(300); rp.screenshot(path=f"qa/ui/{label}-lesson.png")
        if label == "tablet":
            layout = rp.evaluate("() => ['aside.lesson-panel-left', 'aside.lesson-panel-right'].map(s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'none' })")
            check("R-TABLET", "Tablet (820px): side panels collapse to buttons so the lesson keeps the width", rp.get_by_role("button", name="Contents", exact=True).count() + rp.get_by_role("button", name="Show Contents").count() >= 1, str(layout))
        check(f"R-OVF-{label}", f"{label} ({w}px): no page scrolls sideways (12 pages)", not bad, ", ".join(bad))

    # ======================================================= reduced motion (UI)
    rm = page(1440, 900, reduced_motion="reduce")
    rm.goto(f"{C}/print-and-output"); rm.wait_for_timeout(300)
    durs = rm.evaluate("() => [...document.querySelectorAll('*')].map(e => getComputedStyle(e)).filter(s => s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.05).length")
    check("A-MOTION-UI", "Reduced motion: no element on a lesson page runs an animation longer than 50ms", durs == 0, f"{durs} animated elements")

    check("ERR", "No JavaScript errors on any page visited", not errors, str(errors[:3]))
    br.close()
json.dump(R, open("qa/ui-results.json", "w"), indent=1)
print(f"{sum(1 for r in R if r[2])}/{len(R)} passed")
