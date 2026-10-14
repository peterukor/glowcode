"""QA acceptance: functions, parameters, locals and the call stack in Chromium."""
import json, os
from playwright.sync_api import sync_playwright
BASE = "http://localhost:4174"
os.makedirs("qa/fn", exist_ok=True)
R = []
def check(cid, name, ok, detail=""):
    R.append((cid, name, bool(ok), detail)); print(("PASS " if ok else "FAIL ") + f"[{cid}] {name}" + (f"  [{detail}]" if detail else ""))
def tab(pg, name):
    b = pg.locator("h3:text-is('Visualization')").locator("xpath=..").get_by_role("button", name=name, exact=True)
    if b.count(): b.first.click(); pg.wait_for_timeout(150)
def nxt(pg):
    sk = pg.get_by_role("button", name="Skip and reveal the next step")
    (sk if sk.count() else pg.get_by_role("button", name="Next step", exact=True)).click(); pg.wait_for_timeout(450)
FN = """() => { const s = document.querySelector('.viz-stage'); return {
  machine: s.querySelector('.fn-machine')?.textContent || '', input: s.querySelector('.fn-input')?.textContent || '',
  outs: Object.fromEntries([...s.querySelectorAll('.fn-out')].map(o => [o.dataset.kind, (o.dataset.shown ? '' : '(hidden)') + o.textContent])),
  tail: s.querySelector('.fn-tail')?.textContent || '',
  cards: [...s.querySelectorAll('.stack-card')].map(c => ({ look: c.dataset.look, text: c.textContent })),
  binds: [...s.querySelectorAll('.binding')].map(b => b.textContent) } }"""
def walk(pg, wid, t):
    pg.goto(f"{BASE}/dev/visualizations?w={wid}"); pg.wait_for_timeout(300); tab(pg, t)
    total = int(pg.locator("text=/Step \\d+\\/\\d+/").first.inner_text().split("/")[1].split()[0])
    out = [pg.evaluate(FN)]
    for i in range(total - 1):
        nxt(pg); out.append(pg.evaluate(FN)); pg.locator(".viz-stage").screenshot(path=f"qa/fn/{wid}-{t}-{i + 2}.png")
    return out
with sync_playwright() as p:
    br = p.chromium.launch(); pg = br.new_page(viewport={"width": 1440, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    f = walk(pg, "py-add-function", "Function")
    check("F-PARAM", "add(2, 3): arguments are matched to parameters (a = 2, b = 3)", "a = 2" in f[1]["input"] and "b = 3" in f[1]["input"], f[1]["input"])
    check("F-RET", "add returns 5, shown as Returns (not as printed output) and stored in total", "5" in f[2]["outs"].get("returns", "") and "prints" not in f[2]["outs"] and "total" in f[3]["tail"], f"{f[2]['outs']} | {f[3]['tail']}")
    check("F-PRINT", "print(total) shows 5 under Prints and returns None", "5" in f[4]["outs"].get("prints", "") and "None" in f[4]["outs"].get("returns", ""), str(f[4]["outs"]))
    s = walk(pg, "py-add-function", "Call stack")
    frames = [len(x["cards"]) for x in s]
    check("F-LOCAL", "Locals a and b appear in add's frame during the call, and the frame is gone after it returns",
          any("a" in c["text"] and "2" in c["text"] for c in s[2]["cards"]) and not any("add(" in c["text"] and "running" in c["text"].lower() for c in s[3]["cards"]), f"frames per step {frames}; step3 {[c['text'][:40] for c in s[2]['cards']]}; step4 {[c['text'][:40] for c in s[3]['cards']]}")
    cs = walk(pg, "py-call-stack", "Call stack")
    depth = [sum(1 for c in x["cards"] if c["look"] != "ghost") for x in cs]
    json.dump(cs, open("qa/fn/call-stack.json", "w"), indent=1)
    check("F-STACK", "double(4) → add_one(4): the stack grows to three frames, then unwinds back to the main program", max(depth) >= 3 and depth[-1] <= 1, f"frames per step {depth}")
    n = walk(pg, "py-nested-call", "Function")
    check("F-NESTED", "print(len(\"hello\")): len's 5 is marked as going into print() before print runs", "print()" in n[0]["tail"] or "print()" in n[1]["tail"], f"{n[0]['tail']} | {n[1]['tail']}")
    check("F-ERR", "No page errors", not errs, str(errs[:2]))
    br.close()
json.dump(R, open("qa/fn-results.json", "w"), indent=1)
print(f"{sum(1 for r in R if r[2])}/{len(R)} passed")
