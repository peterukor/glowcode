"""QA: error output keeps its ^ markers aligned on phones (no wrapping; scrolls inside the box)."""
from playwright.sync_api import sync_playwright
C = "http://localhost:4174/courses/python-fundamentals"
R = []
def check(cid, name, ok, detail=""):
    R.append(ok); print(("PASS " if ok else "FAIL ") + f"[{cid}] {name}" + (f"  [{detail}]" if detail else ""))
CASES = [("first-python-program", "debug-capital-print"), ("print-and-output", "debug-missing-quotes"), ("print-and-output", "debug-missing-parenthesis"),
         ("chapter-1-review", "review-debug-misspelled"), ("chapter-1-review", "review-debug-syntax")]
with sync_playwright() as p:
    b = p.chromium.launch()
    for label, w in [("phone", 360), ("desktop", 1440)]:
        pg = b.new_page(viewport={"width": w, "height": 800}, is_mobile=w < 500, has_touch=w < 500)
        for lesson, qid in CASES:
            pg.goto(f"{C}/{lesson}"); pg.wait_for_timeout(300)
            pre = pg.locator(f"#activity-{qid} pre[aria-label='Error message']"); pre.scroll_into_view_if_needed()
            info = pre.evaluate("""e => { const s = getComputedStyle(e); const lines = e.textContent.split('\\n');
              return { ws: s.whiteSpace, lines: lines.length, rendered: Math.round(e.getBoundingClientRect().height / parseFloat(s.lineHeight)),
                       sw: e.scrollWidth, cw: e.clientWidth, tab: e.tabIndex, label: e.getAttribute('aria-label') } }""")
            # caret column: the ^ must sit under the same character offset as in the source text
            text = pre.inner_text().split("\n")
            ci = next(i for i, l in enumerate(text) if set(l.strip()) == {"^"})
            col = len(text[ci]) - len(text[ci].lstrip())
            x_caret = pre.evaluate(f"""e => {{ const r = document.createRange(); const t = e.firstChild; const off = e.textContent.split('\\n').slice(0, {ci}).join('\\n').length + 1 + {col};
                r.setStart(t, off); r.setEnd(t, off + 1); return r.getBoundingClientRect().x }}""")
            x_code = pre.evaluate(f"""e => {{ const r = document.createRange(); const t = e.firstChild; const off = e.textContent.split('\\n').slice(0, {ci - 1}).join('\\n').length + 1 + {col};
                r.setStart(t, off); r.setEnd(t, off + 1); return r.getBoundingClientRect().x }}""")
            ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            check(f"ERR-{label}-{qid}", f"{label}: {qid} has one rendered line per error line, ^ under the right character, page doesn't scroll sideways",
                  info["ws"] == "pre" and info["rendered"] == info["lines"] and abs(x_caret - x_code) < 1 and ov <= 0
                  and pre.evaluate("e => e.getBoundingClientRect().right <= e.closest('section.activity').getBoundingClientRect().right"),
                  f"{info} caret x {x_caret:.1f} vs code x {x_code:.1f}, page overflow {ov}")
            if label == "phone" and qid == "debug-missing-quotes":
                pre.screenshot(path="qa/ui/error-phone.png")
            if label == "phone" and info["sw"] > info["cw"]:
                pre.focus(); pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(100)
                check(f"ERR-SCROLL-{qid}", "phone: a too-wide error scrolls inside its box and is reachable by keyboard", info["tab"] == 0 and pre.evaluate("e => e.scrollLeft") > 0)
        pg.close()
    b.close()
print(f"{sum(R)}/{len(R)} passed")
