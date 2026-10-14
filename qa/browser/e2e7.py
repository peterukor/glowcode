"""Phase 6 browser checks: Chapter 1 at desktop and phone sizes."""
import json, os
from playwright.sync_api import sync_playwright
BASE = "http://localhost:4174"
C = f"{BASE}/courses/python-fundamentals"
LESSONS = ["what-is-programming", "how-computers-follow-instructions", "first-python-program", "print-and-output", "reading-code-step-by-step", "chapter-1-review"]
os.makedirs("shots6", exist_ok=True)
results, errors = [], []
def check(name, ok, detail=""):
    results.append(bool(ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{detail}]" if detail else ""))

def progress(pg):
    raw = pg.evaluate("localStorage.getItem('glowcode:progress')")
    return json.loads(raw)["data"] if raw else None

def answer(q, label, exact=False):
    q.scroll_into_view_if_needed()
    q.get_by_label(label, exact=exact).check(); q.get_by_role("button", name="Check answer").click()

with sync_playwright() as p:
    browser = p.chromium.launch()
    for label, (w, h) in {"desktop": (1440, 950), "phone": (390, 844)}.items():
        ctx = browser.new_context(viewport={"width": w, "height": h}, has_touch=(label == "phone"), is_mobile=(label == "phone"))
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append(f"{label} pageerror: {e}"))
        pg.on("console", lambda m: m.type == "error" and "fonts.g" not in m.text and "TUNNEL" not in m.text and errors.append(m.text))
        overflow = lambda: pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")

        # Dashboard
        pg.goto(f"{BASE}/courses"); pg.wait_for_timeout(300)
        card = pg.locator("article.course-card").filter(has_text="Python Fundamentals")
        check(f"{label}: course card says what's available and what's planned", card.get_by_text("2 of 10 chapters available · 8 planned").count() == 1)
        card.get_by_role("link", name="Start learning").click(); pg.wait_for_timeout(300)
        check(f"{label}: Start learning opens lesson 1", pg.url.endswith("/what-is-programming"), pg.url)

        # Every lesson: renders, fits, sidebar outline
        for i, lid in enumerate(LESSONS):
            pg.goto(f"{C}/{lid}"); pg.wait_for_timeout(350)
            check(f"{label} {lid}: no horizontal scroll", overflow() <= 0, f"{overflow()}px")
            check(f"{label} {lid}: has objectives and Key ideas", pg.get_by_role("heading", name="Key ideas").count() + pg.get_by_role("heading", name="Chapter 1 in one list").count() == 1)
            pg.screenshot(path=f"shots6/{label}-{i+1}-{lid}.png", full_page=True)
        if label == "desktop":
            side = pg.locator("aside.lesson-panel-left")
        else:
            pg.get_by_role("button", name="Contents", exact=True).click(); pg.wait_for_timeout(300)
            side = pg.locator("dialog.drawer[open]")
        check(f"{label}: contents lists 8 planned chapters", side.locator(".planned-chapter").count() == 8, str(side.locator(".planned-chapter").count()))
        check(f"{label}: planned chapters have no links", side.locator(".planned-chapter a").count() == 0)
        check(f"{label}: chapter 1 shows its six lessons", side.get_by_role("link").filter(has_text="Chapter Review & Practice").count() == 1)
        check(f"{label}: chapter 2 says more lessons are coming", side.get_by_text("More lessons in this chapter are on the way").count() == 1)
        pg.screenshot(path=f"shots6/{label}-contents.png", full_page=False)
        if label == "phone": pg.keyboard.press("Escape"); pg.wait_for_timeout(200)

        # Lesson 2 walkthrough: output timing and the checkpoint
        pg.goto(f"{C}/how-computers-follow-instructions"); pg.wait_for_timeout(300)
        btn = pg.locator("#open-py-three-messages"); btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(400)
        wt = pg.locator("section.walkthrough-inline")
        out = lambda: wt.locator(".walkthrough-output, [aria-label='Printed output']").first.inner_text() if wt.locator(".walkthrough-output, [aria-label='Printed output']").count() else wt.inner_text()
        lines = [t.strip() for t in wt.locator(".bg-code-bg div").all_inner_texts() if t.strip().startswith("›")]
        check(f"{label} L2: step 1 shows only Hello", lines == ["› Hello"], str(lines))
        nextb = wt.get_by_role("button", name="Next step", exact=True)
        check(f"{label} L2: pauses before line 2 with the prediction", nextb.is_disabled() and wt.locator(".checkpoint").count() == 1)
        cp = wt.locator(".checkpoint")
        cp.get_by_label("it replaces", exact=False).check()
        cp.get_by_role("button", name="Check prediction").click(); pg.wait_for_timeout(100)
        check(f"{label} L2: wrong prediction gets feedback, nothing revealed", cp.get_by_text("Output builds up", exact=False).count() == 1)
        cp.get_by_role("button", name="Reveal next step").click(); pg.wait_for_timeout(300)
        lines = [t.strip() for t in wt.locator(".bg-code-bg div").all_inner_texts() if t.strip().startswith("›")]
        check(f"{label} L2: line 2 adds Welcome under Hello", lines == ["› Hello", "› Welcome"], str(lines))
        wt.scroll_into_view_if_needed(); pg.screenshot(path=f"shots6/{label}-L2-walkthrough.png", full_page=False)

        # Lesson 3: debug question, no early reveal
        pg.goto(f"{C}/first-python-program"); pg.wait_for_timeout(300)
        d = pg.locator("#activity-debug-capital-print")
        check(f"{label} L3: no answer before an attempt", d.get_by_role("button", name="Show the answer").count() == 0 and d.get_by_text("case-sensitive", exact=False).count() == 0)
        answer(d, "The line needs a semicolon at the end")
        check(f"{label} L3: wrong answer explained, answer still hidden", d.get_by_text("doesn't use semicolons", exact=False).count() == 1 and d.get_by_text("case-sensitive", exact=False).count() == 0)
        btn = pg.locator("#open-py-hello-program"); btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(400)
        wt = pg.locator("section.walkthrough-inline")
        check(f"{label} L3: hello walkthrough asks before printing", wt.locator(".checkpoint").count() == 1 and wt.locator("svg").count() >= 1)
        wt.scroll_into_view_if_needed(); pg.screenshot(path=f"shots6/{label}-L3-walkthrough.png", full_page=False)

        # Lesson 4: function view shows Returns None separately
        pg.goto(f"{C}/print-and-output"); pg.wait_for_timeout(300)
        btn = pg.locator("#open-py-print-values"); btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(400)
        wt = pg.locator("section.walkthrough-inline")
        wt.get_by_role("button", name="Next step", exact=True).click(); pg.wait_for_timeout(300)
        txt = wt.inner_text()
        check(f"{label} L4: Returns and Prints shown separately", "Returns" in txt and "Prints" in txt and "None" in txt, txt[:120].replace("\n", " "))
        wt.scroll_into_view_if_needed(); pg.screenshot(path=f"shots6/{label}-L4-walkthrough.png", full_page=False)
        pr = pg.locator("#activity-practice-scoreboard")
        pr.scroll_into_view_if_needed()
        pr.get_by_role("button", name="Show a sample solution").click()
        check(f"{label} L4: sample solution is gated", pr.get_by_text("Have you given it a real try?").count() == 1)

        # Lesson 5: evaluation before print
        pg.goto(f"{C}/reading-code-step-by-step"); pg.wait_for_timeout(300)
        btn = pg.locator("#open-py-trace-ready"); btn.scroll_into_view_if_needed(); btn.click(); pg.wait_for_timeout(400)
        wt = pg.locator("section.walkthrough-inline")
        cp = wt.locator(".checkpoint")
        cp.get_by_role("button", name="Reveal next step").click() if cp.get_by_role("button", name="Reveal next step").count() else cp.get_by_role("button", name="Skip and reveal the next step").click()
        pg.wait_for_timeout(300)
        txt = wt.inner_text()
        lines = [t.strip() for t in wt.locator(".bg-code-bg div").all_inner_texts() if t.strip().startswith("›")]
        check(f"{label} L5: evaluation shown, 15 not printed yet", "10 + 5" in txt and lines == ["› Ready"], str(lines))
        wt.get_by_role("button", name="Next step", exact=True).click(); pg.wait_for_timeout(250)
        lines = [t.strip() for t in wt.locator(".bg-code-bg div").all_inner_texts() if t.strip().startswith("›")]
        check(f"{label} L5: then 15 is printed under Ready", lines == ["› Ready", "› 15"], str(lines))
        wt.get_by_role("button", name="Previous step", exact=False).first.click(); pg.wait_for_timeout(250)
        lines = [t.strip() for t in wt.locator(".bg-code-bg div").all_inner_texts() if t.strip().startswith("›")]
        check(f"{label} L5: Previous takes the 15 away again", lines == ["› Ready"], str(lines))
        wt.scroll_into_view_if_needed(); pg.screenshot(path=f"shots6/{label}-L5-eval.png", full_page=False)
        wt.get_by_role("button", name="Reset", exact=False).first.click(); pg.wait_for_timeout(200)
        check(f"{label} L5: Reset returns to step 1", wt.get_by_text("Step 1/", exact=False).count() >= 1)

        # Lesson 6 review + resume + completion
        pg.goto(f"{C}/chapter-1-review"); pg.wait_for_timeout(300)
        q = pg.locator("#activity-review-code-vs-output")
        answer(q, "Hi", exact=True)
        check(f"{label} L6: code-vs-output feedback", q.get_by_text("inside the single quotes", exact=False).count() == 1)
        o = pg.locator("#activity-review-order-countdown")
        answer(o, "C, B, D, A")
        check(f"{label} L6: ordering activity accepts the right order", o.get_by_text("Output appears in the order", exact=False).count() == 1)
        prog = progress(pg)["courses"]["python-fundamentals"]
        check(f"{label} L6: last activity recorded", prog.get("lastActivity", {}).get("lessonId") == "chapter-1-review", str(prog.get("lastActivity")))
        pg.get_by_role("button", name="Mark lesson complete").click(); pg.wait_for_timeout(200)
        pg.reload(); pg.wait_for_timeout(300)
        check(f"{label} L6: completion survives a reload", pg.get_by_text("Lesson complete!").count() == 1)
        nxt = pg.get_by_role("link", name="Why Do Variables Exist?", exact=False)
        check(f"{label} L6: Next goes to Chapter 2", nxt.count() >= 1)

        # Old saved progress pointing at a moved activity still opens lesson 1 cleanly
        pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('glowcode:progress'));
            s.data.courses['python-fundamentals'].lastLessonId = 'what-is-programming';
            s.data.courses['python-fundamentals'].lastActivity = { lessonId: 'what-is-programming', activityId: 'debug-capital-print' };
            localStorage.setItem('glowcode:progress', JSON.stringify(s)); }""")
        pg.goto(f"{BASE}/courses/python-fundamentals"); pg.wait_for_timeout(400)
        check(f"{label}: old progress resumes at lesson 1 without a dead anchor", pg.url.endswith("/what-is-programming"), pg.url)

        # Manual links resolve
        pg.goto(f"{C}/reading-code-step-by-step"); pg.wait_for_timeout(300)
        term = pg.locator(".ref-term").filter(has_text="expression").first
        term.scroll_into_view_if_needed()
        if label == "desktop": term.click()
        else: term.tap()
        pg.wait_for_timeout(250)
        card = pg.get_by_role("dialog")
        check(f"{label}: expression term opens its manual popup", card.count() == 1 and card.get_by_text("works out to get a single value", exact=False).count() == 1)
        card.get_by_role("link", name="See more").click(); pg.wait_for_timeout(400)
        check(f"{label}: Expression manual entry opens", pg.get_by_role("heading", name="Expression", level=1).count() == 1, pg.url)
        pg.screenshot(path=f"shots6/{label}-ref-expression.png", full_page=True)
        back = pg.get_by_role("button", name="Back to Reading Code Step by Step")
        check(f"{label}: Back to the lesson is offered", back.count() == 1)
        back.click(); pg.wait_for_timeout(400)
        check(f"{label}: Back returns to the lesson", pg.url.endswith("/reading-code-step-by-step"), pg.url)
        for ref in ["concept.statement", "concept.python", "python.errors.SyntaxError"]:
            pg.goto(f"{BASE}/reference/{ref}"); pg.wait_for_timeout(250)
            check(f"{label}: {ref} page renders", pg.locator("h1").count() == 1 and overflow() <= 0)
        ctx.close()
    browser.close()
print("errors:", errors[:5])
print(f"{sum(results)}/{len(results)} passed")
