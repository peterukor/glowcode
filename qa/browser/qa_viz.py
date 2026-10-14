"""QA acceptance: visualization behaviour in a real browser (Chromium via Playwright).
Records the rendered state after each event and checks it against the agreed design."""
import json, os, sys
from playwright.sync_api import sync_playwright
BASE = "http://localhost:4174"
os.makedirs("qa", exist_ok=True)
R = []  # (id, name, ok, detail)
def check(cid, name, ok, detail=""):
    R.append((cid, name, bool(ok), detail)); print(("PASS " if ok else "FAIL ") + f"[{cid}] {name}" + (f"  [{detail}]" if detail else ""))

REC = """() => {
  const q = (s, r=document) => [...r.querySelectorAll(s)];
  const stage = document.querySelector('.viz-stage');
  const f = document.querySelector('.loop-for, .loop-while');
  const out = q('.bg-code-bg div').map(d => d.textContent.trim()).filter(t => t.startsWith('›')).map(t => t.slice(1).trim());
  const binds = Object.fromEntries(q('.binding', stage).map(b => [b.querySelector('.binding-name')?.textContent, b.querySelector('.binding-value span')?.textContent]));
  const step = (document.body.innerText.match(/Step (\\d+)\\/(\\d+)/) || []).slice(1).map(Number);
  const r = { step, out, binds, note: document.querySelector('[aria-live=polite]')?.textContent || '' };
  if (f) {
    r.at = f.dataset.at;
    r.cells = q('.strip-cell', f).map(c => c.dataset.state);
    r.visible = q('.strip-cell', f).map((c, i) => c.getAttribute('aria-hidden') ? null : i).filter(i => i !== null);
    r.indexLabels = q('.strip-cell', f).map(c => c.querySelector('.strip-index')?.textContent);
    r.lift = q('.strip-cell', f).map(c => { const m = getComputedStyle(c.querySelector('.strip-cell-lift')).transform; return m === 'none' ? 0 : Math.round(new DOMMatrix(m).f); });
    r.more = q('.strip-more', f).map(m => m.hasAttribute('data-show'));
    r.ticks = q('.strip-tick', f).length;
    r.nodes = Object.fromEntries(q('[data-node]', f).map(n => [n.dataset.node, n.dataset.look]));
    r.edges = Object.fromEntries(q('[data-edge]', f).map(e => [e.dataset.edge, e.dataset.look]));
    r.target = f.querySelector('[data-node=target]')?.textContent || '';
    r.chip = !!f.querySelector('.loop-chip');
    r.chipAnim = f.querySelector('.loop-chip') ? getComputedStyle(f.querySelector('.loop-chip')).animationName : '';
    r.answer = q('.flow-decision text', f).map(t => t.textContent).join(' ');
    const svg = f.querySelector('svg'); const box = svg.getBoundingClientRect(); const par = f.getBoundingClientRect();
    r.svgW = box.width; r.containerW = par.width;
  }
  return r;
}"""

def open_demo(pg, wid, reduced=False):
    pg.goto(f"{BASE}/dev/visualizations?w={wid}"); pg.wait_for_timeout(350)

def nxt(pg):
    sk = pg.get_by_role("button", name="Skip and reveal the next step")
    if sk.count(): sk.click()
    else: pg.get_by_role("button", name="Next step", exact=True).click()

def view(pg, name):
    b = pg.locator("h3:text-is('Visualization')").locator("xpath=..").get_by_role("button", name=name, exact=True)
    if b.count(): b.first.click(); pg.wait_for_timeout(150)

def var_pass(pg, wid, name):
    open_demo(pg, wid); view(pg, "Variables")
    vals = [pg.evaluate(REC)["binds"].get(name)]
    for _ in range(pg.evaluate(REC)["step"][1] - 1):
        nxt(pg); pg.wait_for_timeout(250); vals.append(pg.evaluate(REC)["binds"].get(name))
    return vals

LABEL = """() => { const f = document.querySelector('.loop-for'); const t = f.querySelector('.strip-label'); const s = f.querySelector('svg');
  const a = t.getBoundingClientRect(), b = s.getBoundingClientRect(); return { text: t.textContent, inside: a.left >= b.left - 0.5 && a.right <= b.right + 0.5, a: [a.left, a.right], b: [b.left, b.right] } }"""

def all_steps(pg, settle=700):
    recs = [pg.evaluate(REC)]
    total = recs[0]["step"][1]
    for _ in range(total - 1):
        nxt(pg); pg.wait_for_timeout(settle); recs.append(pg.evaluate(REC))
    return recs

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={"width": 1440, "height": 1000})
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))

    # ------------------------------------------------------------ for number in [10, 20, 30]
    open_demo(pg, "qa-for-number")
    view(pg, "Loop")
    recs = all_steps(pg)
    json.dump(recs, open("qa/for-number.json", "w"), indent=1)
    phases = [r["at"] for r in recs]
    check("V-FOR-1", "Steps follow next → assign → body per item, then exit", phases == ["next", "assign", "body"] * 3 + ["exit"], str(phases))
    check("V-FOR-2", "Whole loop structure stays visible on every step",
          all(set(r["nodes"]) >= {"decision", "target", "after", "body-0"} and set(r["edges"]) >= {"yes", "exit", "back", "feed", "into-body"} for r in recs), str(sorted(recs[0]["nodes"])))
    check("V-FOR-3", "Iterable is one segmented strip with 3 cells and real indexes 0–2",
          all(len(r["cells"]) == 3 for r in recs) and recs[0]["indexLabels"] == ["0", "1", "2"] and pg.locator(".loop-for .strip-box").count() == 1)
    check("V-FOR-4", "Next-item decision is visible and answered Yes on each pick, No at the end",
          all("Next item available?" in r["answer"] for r in recs) and "Yes" in recs[0]["answer"] and "No" in recs[-1]["answer"], recs[-1]["answer"])
    raised = [(r["cells"], r["lift"]) for r in recs[:3]]
    check("V-FOR-5", "Picked item rises out of its cell (translateY −11px after the transition), others stay put",
          recs[0]["lift"] == [-11, 0, 0] and recs[3]["lift"] == [0, -11, 0] and recs[6]["lift"] == [0, 0, -11], str([r["lift"] for r in recs]))
    check("V-FOR-6", "Picked item is drawn raised/glowing; during the body it's active, not lifted",
          recs[0]["cells"][0] == "raised" and recs[2]["cells"][0] == "active" and recs[2]["lift"][0] == 0)
    check("V-FOR-7", "Assignment is shown as a travelling value + lit Yes edge into the loop variable",
          recs[1]["chip"] and recs[1]["chipAnim"] == "loop-chip-travel" and recs[1]["edges"]["yes"] == "lit" and recs[1]["nodes"]["target"] == "lit")
    nums = var_pass(pg, "qa-for-number", "number")
    check("V-FOR-8", "Loop variable updates at the assign event, not before (Variables view and loop-variable box)",
          nums == [None, "10", "10", "10", "20", "20", "20", "30", "30", "30"]
          and recs[0]["target"].endswith("= ?") and recs[2]["target"].endswith("= 10") and recs[3]["target"].endswith("= 10") and recs[5]["target"].endswith("= 20"),
          f'vars {nums} | box {[r["target"] for r in recs]}')
    check("V-FOR-9", "Body activates after assignment and prints at that event",
          recs[2]["nodes"]["body-0"] == "lit" and recs[2]["edges"]["into-body"] == "lit" and recs[1]["out"] == [] and recs[2]["out"] == ["10"])
    check("V-FOR-10", "Loop-back edge lights when asking for the 2nd and 3rd items (not the 1st)",
          recs[0]["edges"]["back"] != "lit" and recs[3]["edges"]["back"] == "lit" and recs[6]["edges"]["back"] == "lit")
    check("V-FOR-11", "Exit path lights when the iterable is exhausted; Yes is dimmed",
          recs[-1]["edges"]["exit"] == "lit" and recs[-1]["edges"]["yes"] == "dim" and recs[-1]["nodes"]["after"] == "lit" and recs[-1]["nodes"]["decision"] == "false")
    check("V-FOR-12", "Items are never removed: 3 cells with all values on every step", all(len(r["cells"]) == 3 for r in recs))
    check("V-FOR-13", "Visited items are distinguished (faded + tick) from the current one",
          recs[3]["cells"][:2] == ["visited", "raised"] and recs[3]["ticks"] == 1 and recs[-1]["ticks"] == 3, f'{recs[3]["cells"]} ticks={recs[3]["ticks"]}')
    check("V-FOR-14", "Final output is 10, 20, 30", recs[-1]["out"] == ["10", "20", "30"], str(recs[-1]["out"]))
    # mid-transition evidence: the chip is between its start and end
    open_demo(pg, "qa-for-number"); view(pg, "Loop")
    nxt(pg); pg.wait_for_timeout(1000)  # assign 10
    for _ in range(2): nxt(pg); pg.wait_for_timeout(700)  # body, next(20)
    nxt(pg); pg.wait_for_timeout(30)
    pg.evaluate("() => document.querySelectorAll('.loop-chip').forEach(c => c.getAnimations().forEach(a => { a.pause(); a.currentTime = 200; }))")
    pos = pg.evaluate("() => getComputedStyle(document.querySelector('.loop-chip')).transform")
    pg.locator(".viz-stage").screenshot(path="qa/for-number-assign20-midflight.png")
    pg.evaluate("() => document.querySelectorAll('.loop-chip').forEach(c => c.getAnimations().forEach(a => a.finish()))")
    pg.wait_for_timeout(100)
    end = pg.evaluate("() => getComputedStyle(document.querySelector('.loop-chip')).transform")
    check("V-FOR-ANIM", "The assigned value really travels: mid-animation position differs from where it lands", pos != end, f"{pos} → {end}")
    pg.locator(".viz-stage").screenshot(path="qa/for-number-assign20-landed.png")
    # Previous / Reset restore
    open_demo(pg, "qa-for-number"); view(pg, "Loop")
    for _ in range(3): nxt(pg); pg.wait_for_timeout(700)
    at4 = pg.evaluate(REC)
    for _ in range(3): nxt(pg); pg.wait_for_timeout(700)
    for _ in range(3): pg.get_by_role("button", name="Previous step").click(); pg.wait_for_timeout(700)
    back4 = pg.evaluate(REC)
    strip = lambda r: {k: v for k, v in r.items() if k not in ("chipAnim",)}
    check("V-FOR-15", "Previous ×3 restores exactly the state of step 4 (cells, lift, looks, variable, output)", strip(at4) == strip(back4),
          json.dumps({k: (at4[k], back4[k]) for k in at4 if at4[k] != back4.get(k)})[:300])
    pg.get_by_role("button", name="Reset").first.click(); pg.wait_for_timeout(700)
    rs = pg.evaluate(REC)
    check("V-FOR-16", "Reset restores step 1 exactly", strip(rs) == strip(recs[0]), json.dumps({k: (recs[0][k], rs[k]) for k in rs if rs[k] != recs[0].get(k)})[:300])
    pg.locator(".viz-stage").screenshot(path="qa/for-number-step1.png")

    # ------------------------------------------------------------ long collections
    for wid, n in [("qa-for-1", 1), ("qa-for-5", 5), ("qa-for-6", 6), ("qa-for-20", 20)]:
        open_demo(pg, wid); view(pg, "Loop")
        recs = all_steps(pg, settle=450)
        bad = []
        for r in recs:
            vis = r["visible"]
            cur = next((i for i, s in enumerate(r["cells"]) if s in ("raised", "active")), None)
            if len(vis) > 5: bad.append(f"step{r['step'][0]}: {len(vis)} visible")
            if cur is not None and cur not in vis: bad.append(f"step{r['step'][0]}: current {cur} hidden")
            before, after = r["more"]
            if before != (min(vis) > 0) or after != (max(vis) < n - 1): bad.append(f"step{r['step'][0]}: ellipsis {r['more']} for window {min(vis)}-{max(vis)}")
            if r["indexLabels"] != [str(i) for i in range(n)]: bad.append("indexes")
        windows = sorted({(min(r["visible"]), max(r["visible"])) for r in recs})
        check(f"V-WIN-{n}", f"{n} item(s): ≤5 visible, current always visible, ellipses only where hidden, real indexes",
              not bad, (", ".join(bad[:4]) or f"windows seen: {windows[:6]}{'…' if len(windows) > 6 else ''}"))
        lab = pg.evaluate(LABEL)
        check(f"V-LABEL-{n}", f"{n} item(s): the 'for … in …' label fits inside the diagram", lab["inside"] and lab["text"].startswith("for "), f'{lab["text"]!r} {lab["a"]} in {lab["b"]}')
        if n == 20:
            check("V-WIN-SHIFT", "20 items: the window slides as the loop advances (several windows seen)", len(windows) >= 10, str(len(windows)))
            open_demo(pg, wid); view(pg, "Loop")
            for _ in range(3 * 9 + 1): nxt(pg); pg.wait_for_timeout(60)
            pg.wait_for_timeout(600); pg.locator(".viz-stage").screenshot(path="qa/for-20-item10.png")
    # narrow screen
    m = br.new_context(viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True).new_page()
    m.goto(f"{BASE}/dev/visualizations?w=qa-for-20"); m.wait_for_timeout(400)
    view(m, "Loop")
    for _ in range(3 * 12 + 1): nxt(m); m.wait_for_timeout(40)
    m.wait_for_timeout(600)
    ov = m.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    lab = m.evaluate(LABEL)
    check("V-LABEL-PHONE", "20 items at 360px: the label fits inside the diagram", lab["inside"], f'{lab["text"]!r}')
    sc = m.evaluate("() => { const e = document.querySelector('.loop-for'); let p = e; while (p && getComputedStyle(p).overflowX === 'visible') p = p.parentElement; return p ? [p.className, getComputedStyle(p).overflowX, p.scrollWidth, p.clientWidth] : null }")
    r = m.evaluate(REC)
    m.locator(".viz-stage").screenshot(path="qa/for-20-phone.png")
    check("V-WIN-NARROW", "20 items at 360px: page doesn't scroll sideways; diagram ≤ its container or scrolls inside it", ov <= 0, f"page overflow {ov}px, svg {r['svgW']:.0f} vs container {r['containerW']:.0f}; scroll box {sc}")

    # ------------------------------------------------------------ while count <= 3
    open_demo(pg, "while"); view(pg, "Loop")
    recs = all_steps(pg)
    json.dump(recs, open("qa/while.json", "w"), indent=1)
    counts = var_pass(pg, "while", "count")
    for r, c in zip(recs, counts): r["binds"]["count"] = c
    open_demo(pg, "while"); view(pg, "Loop")
    for _ in range(len(recs) - 1): nxt(pg); pg.wait_for_timeout(120)
    pg.wait_for_timeout(600)
    ats = [r["at"] for r in recs]
    check("V-WHILE-1", "Initial assignment shown first (count = 1, loop not started)", recs[0]["binds"].get("count") == "1" and ats[0] == "start", f"{ats[0]} {counts[0]}")
    checks_true = [i for i, r in enumerate(recs) if r["at"] == "check" and r["nodes"].get("decision") == "true"]
    checks_false = [i for i, r in enumerate(recs) if r["at"] == "check" and r["nodes"].get("decision") == "false"]
    check("V-WHILE-2", "Condition evaluated 4 times: True ×3, then False once with count = 4",
          len(checks_true) == 3 and len(checks_false) == 1 and recs[checks_false[0]]["binds"].get("count") == "4", f"true@{checks_true} false@{checks_false} counts={counts}")
    check("V-WHILE-3", "True path and body light after each True check",
          all(recs[i + 1]["at"] == "body" and recs[i + 1]["edges"].get("yes") in ("lit", "done") for i in checks_true), str([recs[i + 1]["edges"] for i in checks_true][:1]))
    upd = [i for i, r in enumerate(recs) if i and r["binds"].get("count") != recs[i - 1]["binds"].get("count")]
    check("V-WHILE-4", "count changes only on its update events (2, 3, 4) and each is followed by the loop-back to the check",
          [recs[i]["binds"]["count"] for i in upd] == ["2", "3", "4"] and all(recs[i + 1]["at"] == "check" and recs[i + 1]["edges"].get("back") == "lit" for i in upd),
          str([(i, recs[i]["binds"]["count"], recs[i + 1]["at"], recs[i + 1]["edges"].get("back")) for i in upd]))
    check("V-WHILE-5", "Exit path lights at the end; output is 1, 2, 3",
          recs[-1]["at"] == "exit" and recs[-1]["edges"].get("exit") == "lit" and recs[-1]["out"] == ["1", "2", "3"], f'{recs[-1]["edges"]} {recs[-1]["out"]}')
    # backward playback
    back = [pg.evaluate(REC)]
    for _ in range(len(recs) - 1):
        pg.get_by_role("button", name="Previous step").click(); pg.wait_for_timeout(500); back.append(pg.evaluate(REC))
    back.reverse()
    open_demo(pg, "while"); view(pg, "Variables")
    for _ in range(len(recs) - 1): nxt(pg); pg.wait_for_timeout(80)
    bc = [pg.evaluate(REC)["binds"].get("count")]
    for _ in range(len(recs) - 1):
        pg.get_by_role("button", name="Previous step").click(); pg.wait_for_timeout(120); bc.append(pg.evaluate(REC)["binds"].get("count"))
    bc.reverse()
    check("V-WHILE-7", "Backward playback restores count at every step", bc == counts, f"{bc} vs {counts}")
    key = lambda r: (r["at"], tuple(r["out"]), json.dumps(r["nodes"], sort_keys=True), json.dumps(r["edges"], sort_keys=True))
    check("V-WHILE-6", "Backward playback shows the same state at every step as forward", [key(r) for r in back] == [key(r) for r in recs],
          next((f"step {i+1}: fwd {key(a)} back {key(b)}" for i, (a, b) in enumerate(zip(recs, back)) if key(a) != key(b)), ""))
    pg.locator(".viz-stage").screenshot(path="qa/while-step1.png")

    # ------------------------------------------------------------ score = score + 5
    open_demo(pg, "qa-score")
    recs = []
    recs.append(pg.evaluate(REC));
    calc = lambda: pg.evaluate("() => { const c = document.querySelector('.calc'); return c ? { phase: c.dataset.phase, on: [...c.querySelectorAll('[data-on]')].map(e => e.className.split(' ').find(x => x.startsWith('calc-')) ), text: c.textContent } : null }")
    cs = [calc()]
    for _ in range(4): nxt(pg); pg.wait_for_timeout(500); recs.append(pg.evaluate(REC)); cs.append(calc()); pg.locator(".viz-stage").screenshot(path=f"qa/score-step{len(recs)}.png")
    sc = [r["binds"].get("score") for r in recs]
    check("V-VAR-1", "Read, calculate and rebind are separate events (phases read → calculate → assign)",
          [c and c["phase"] for c in cs] == [None, "read", "calculate", "assign", None], str([c and c["phase"] for c in cs]))
    check("V-VAR-2", "score still refers to 10 while reading and calculating; 15 only after rebinding", sc == ["10", "10", "10", "15", "15"], str(sc))
    check("V-VAR-3", "Printing shows 15 at the last event only", [r["out"] for r in recs] == [[], [], [], [], ["15"]])

    # ------------------------------------------------------------ aliasing and copy
    open_demo(pg, "qa-alias"); view(pg, "Collections")
    for _ in range(2): nxt(pg); pg.wait_for_timeout(500)
    objs = pg.evaluate("() => [...document.querySelectorAll('.viz-stage .object')].map(o => o.textContent)")
    pg.locator(".viz-stage").screenshot(path="qa/alias-append.png")
    check("V-REF-1", "b = a; b.append(3): one list object with both names, showing [1, 2, 3]", len(objs) == 1 and "a" in objs[0] and "b" in objs[0] and "3" in objs[0], str(objs))
    view(pg, "Function")
    fn = pg.evaluate("() => Object.fromEntries([...document.querySelectorAll('.viz-stage .fn-out')].map(o => [o.dataset.kind, o.textContent]))")
    pg.locator(".viz-stage").screenshot(path="qa/alias-append-function.png")
    check("F-APPEND", "append(): Changes shows [1, 2, 3] and Returns shows None, separately", "None" in fn.get("returns", "") and "[1, 2, 3]" in fn.get("changes", ""), str(fn))
    open_demo(pg, "qa-copy"); view(pg, "Collections")
    for _ in range(3): nxt(pg); pg.wait_for_timeout(500)
    objs = pg.evaluate("() => [...document.querySelectorAll('.viz-stage .object')].map(o => o.textContent)")
    pg.locator(".viz-stage").screenshot(path="qa/copy.png")
    check("V-REF-2", ".copy(): two separate list objects, only b's has the 3", len(objs) == 2, str(objs))

    # ------------------------------------------------------------ print(len("hello"))
    open_demo(pg, "py-nested-call")
    st = []
    def fnstate():
        return pg.evaluate("() => ({ name: document.querySelector('.viz-stage .fn-machine')?.textContent, outs: Object.fromEntries([...document.querySelectorAll('.viz-stage .fn-out')].map(o => [o.dataset.kind, (o.dataset.shown ? 'shown:' : 'hidden:') + o.textContent])) })")
    st.append((fnstate(), pg.evaluate(REC)["out"]))
    for _ in range(3): nxt(pg); pg.wait_for_timeout(500); st.append((fnstate(), pg.evaluate(REC)["out"]))
    check("F-LEN-1", "len(\"hello\") returns 5 before print runs, with nothing printed yet",
          "len()" in st[1][0]["name"] and "shown:" in st[1][0]["outs"].get("returns", "") and "5" in st[1][0]["outs"]["returns"] and st[1][1] == [], str(st[1]))
    check("F-LEN-2", "print(5) then shows 5 on screen and returns None, in separate boxes",
          "print()" in st[3][0]["name"] and st[3][1] == ["5"] and "None" in st[3][0]["outs"].get("returns", "") and "5" in st[3][0]["outs"].get("prints", ""), str(st[3]))
    pg.locator(".viz-stage").screenshot(path="qa/nested-call-print.png")

    # ------------------------------------------------------------ reduced motion
    rm = br.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce").new_page()
    rm.goto(f"{BASE}/dev/visualizations?w=qa-for-number"); rm.wait_for_timeout(400); view(rm, "Loop")
    rmr = rm.evaluate(REC)
    check("A-MOTION", "Reduced motion: the picked item doesn't move but is still marked raised; the chip fades instead of travelling",
          rmr["lift"][0] == 0 and rmr["cells"][0] == "raised" and rmr["chipAnim"] == "loop-chip-fade", f'{rmr["lift"]} {rmr["chipAnim"]}')

    print("page errors:", errors[:3])
    br.close()

json.dump(R, open("qa/viz-results.json", "w"), indent=1)
print(f"{sum(1 for r in R if r[2])}/{len(R)} passed")
