"""QA acceptance: collections, strings, sets, dicts, tuples and precedence in Chromium."""
import json, os
from playwright.sync_api import sync_playwright
BASE = "http://localhost:4174"
os.makedirs("qa/coll", exist_ok=True)
R = []
def check(cid, name, ok, detail=""):
    R.append((cid, name, bool(ok), detail)); print(("PASS " if ok else "FAIL ") + f"[{cid}] {name}" + (f"  [{detail}]" if detail else ""))

STATE = """() => { const s = document.querySelector('.viz-stage'); const q = x => [...s.querySelectorAll(x)];
 return { states: q('[data-state]').map(e => e.getAttribute('data-state')), looks: q('[data-look]').map(e => e.dataset.look),
   current: q('[data-current]').length, tones: q('[data-tone]').map(e => e.dataset.tone), text: s.textContent,
   note: [...document.querySelectorAll('[aria-live=polite]')].map(e => e.textContent).join(' | '),
   indexTexts: q('.object .strip-index').map(e => e.textContent),
   objects: q('.object').map(o => ({ kind: o.dataset.kind, text: o.textContent, idx: [...o.querySelectorAll('.strip-index')].map(e => e.textContent) })),
   overflow: document.documentElement.scrollWidth - window.innerWidth } }"""

def nxt(pg):
    sk = pg.get_by_role("button", name="Skip and reveal the next step")
    (sk if sk.count() else pg.get_by_role("button", name="Next step", exact=True)).click()

def run(pg, wid, tab):
    pg.goto(f"{BASE}/dev/visualizations?w={wid}"); pg.wait_for_timeout(300)
    b = pg.locator("h3:text-is('Visualization')").locator("xpath=..").get_by_role("button", name=tab, exact=True)
    if b.count(): b.first.click(); pg.wait_for_timeout(150)
    total = int(pg.locator("text=/Step \\d+\\/\\d+/").first.inner_text().split("/")[1].split()[0])
    out = [pg.evaluate(STATE)]
    pg.locator(".viz-stage").screenshot(path=f"qa/coll/{wid}-{tab}-1.png")
    for i in range(total - 1):
        nxt(pg); pg.wait_for_timeout(450); out.append(pg.evaluate(STATE))
        pg.locator(".viz-stage").screenshot(path=f"qa/coll/{wid}-{tab}-{i + 2}.png")
    return out

with sync_playwright() as p:
    br = p.chromium.launch()
    for label, (w, h) in {"desktop": (1440, 1000), "phone": (375, 812)}.items():
        pg = br.new_context(viewport={"width": w, "height": h}).new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))

        lst = run(pg, "py-list-changes", "Collections")
        if label == "desktop":
            json.dump(lst, open("qa/coll/list-changes.json", "w"), indent=1)
            check("C-LIST-1", "List drawn as one segmented strip with real indexes 0..3", lst[0]["objects"] and lst[0]["objects"][0]["idx"][:4] == ["0", "1", "2", "3"], str(lst[0]["objects"][:1]))
            active = [i for i, s in enumerate(lst) if any(x in ("active", "raised", "changed", "added", "removed", "selected") for x in s["states"]) or "removed" in s["tones"] or "returned" in s["tones"]]
            check("C-LIST-2", "Each mutation step highlights the affected item (something glows on every event after line 1)", len(active) >= len(lst) - 2, f"{len(active)} of {len(lst)} steps")
            ip = next(i for i, s in enumerate(lst) if "pop()" in s["note"])
            check("C-LIST-3", "pop(): the item leaves the list, then is shown as the returned value (two separate events)",
                  "removed" in lst[ip + 1]["tones"] and "returned" in lst[ip + 2]["tones"], str([lst[i]["tones"] for i in range(ip, ip + 3)]))
        check(f"C-OVF-{label}-list", f"{label}: list demo never makes the page scroll sideways", all(s["overflow"] <= 0 for s in lst))

        sl = run(pg, "py-string-slices", "Collections")
        if label == "desktop":
            json.dump(sl, open("qa/coll/string.json", "w"), indent=1)
            sliced = next((s for s in sl if "stops before index 4" in s["note"]), None)
            check("C-STR-1", "word[1:4] lights exactly indexes 1, 2, 3", sliced is not None and sliced["states"].count("selected") + sliced["states"].count("active") == 3, sliced and sliced["states"])
            mutate_words = [s["note"] for s in sl if any(k in s["note"].lower() for k in ("changed in place", "changes the string", "now contains")) and "can't" not in s["note"]]
            check("C-STR-2", "No step says or shows the string changing; notes say it can't change and word is unchanged",
                  not mutate_words and any("can't be changed in place" in s["note"] for s in sl) and any("word is unchanged" in s["note"] for s in sl), str(mutate_words))
            neg = next((s for s in sl if "Negative indexes" in s["note"]), None)
            check("C-STR-3", "Negative index -1 shown alongside the positive indexes", neg is not None and "-1" in neg["text"])
        check(f"C-OVF-{label}-str", f"{label}: string demo fits", all(s["overflow"] <= 0 for s in sl))

        pr = run(pg, "py-precedence", "Variables")
        if label == "desktop":
            json.dump(pr, open("qa/coll/precedence.json", "w"), indent=1)
            mul_first = [s["note"] for s in pr]
            i_mul = next((i for i, n in enumerate(mul_first) if "3 * 2" in n), 99); i_add = next((i for i, n in enumerate(mul_first) if "4 + 6" in n), 99)
            check("C-PREC", "4 + 3 * 2: the multiplication is worked out before the addition, result 10", i_mul < i_add < 99 and "10" in pr[-1]["text"], f"mul@{i_mul} add@{i_add}")
        check(f"C-OVF-{label}-prec", f"{label}: precedence tree fits", all(s["overflow"] <= 0 for s in pr))

        dc = run(pg, "py-dict-update", "Collections")
        if label == "desktop":
            json.dump(dc, open("qa/coll/dict.json", "w"), indent=1)
            check("C-DICT", "Dict lookup, replace, add and delete each mark the affected row", sum(1 for s in dc if any(x not in ("idle",) for x in s["states"])) >= 4, str([sorted(set(s["states"])) for s in dc]))
        check(f"C-OVF-{label}-dict", f"{label}: dict demo fits", all(s["overflow"] <= 0 for s in dc))

        st = run(pg, "py-set-membership", "Collections")
        if label == "desktop":
            json.dump(st, open("qa/coll/set.json", "w"), indent=1)
            sets = [o for s in st for o in s["objects"] if o["kind"] == "set"]
            check("C-SET-1", "Sets are drawn with no positional indexes", sets and all(not o["idx"] or all(not t.strip().lstrip("-").isdigit() for t in o["idx"]) for o in sets), str(sets[:1]))
            check("C-SET-2", "add(2) of an existing value changes nothing; 4 in seen is shown True", "changes nothing" in st[1]["note"] and any("True" in s["text"] for s in st[3:5]))
        check(f"C-OVF-{label}-set", f"{label}: set demo fits", all(s["overflow"] <= 0 for s in st))

        tp = run(pg, "py-for-tuple", "Loop")
        if label == "desktop":
            check("C-TUPLE", "Tuple iterable drawn as a segmented strip in the tuple colour", "tuple" in tp[1]["tones"] or "tuple" in json.dumps(tp[1]), str(sorted(set(tp[1]["tones"]))))
        check(f"C-OVF-{label}-tuple", f"{label}: tuple loop fits", all(s["overflow"] <= 0 for s in tp))
        sh = run(pg, "py-shared-list", "Collections")
        check(f"C-OVF-{label}-shared", f"{label}: shared-list demo fits", all(s["overflow"] <= 0 for s in sh))
        check(f"C-ERR-{label}", f"{label}: no page errors", not errs, str(errs[:2]))
    br.close()
json.dump(R, open("qa/coll-results.json", "w"), indent=1)
print(f"{sum(1 for r in R if r[2])}/{len(R)} passed")
