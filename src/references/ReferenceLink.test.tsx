// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReferenceNavigationContext } from "./navigation";
import { ReferenceLink } from "./ReferenceLink";

afterEach(cleanup);

const term = () => screen.getByRole("button", { name: "print()" }) as HTMLButtonElement;
const card = () => screen.queryByRole("dialog");

describe("ReferenceLink", () => {
  it("describes the term to screen readers without opening anything", () => {
    render(<ReferenceLink id="python.builtins.print" label="print()" code />);
    const describedBy = term().getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)!.textContent).toMatch(/Shows values as text/);
    expect(card()).toBeNull();
    expect(term().getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on keyboard focus with the summary and a See more link", () => {
    render(<ReferenceLink id="python.builtins.print" label="print()" code />);
    act(() => term().focus());
    const dialog = card()!;
    expect(dialog).toBeTruthy();
    expect(term().getAttribute("aria-expanded")).toBe("true");
    expect(dialog.textContent).toMatch(/print\(\)/);
    const more = screen.getByRole("link", { name: /See more/ }) as HTMLAnchorElement;
    expect(more.getAttribute("href")).toBe("/reference/python.builtins.print");
  });

  it("closes on Escape and gives focus back to the term", () => {
    render(<ReferenceLink id="python.builtins.print" label="print()" code />);
    act(() => term().focus());
    fireEvent.keyDown(term(), { key: "Escape" });
    expect(card()).toBeNull();
    expect(document.activeElement).toBe(term());
  });

  it("doesn't reopen when Escape is pressed inside the card", () => {
    render(<ReferenceLink id="python.builtins.print" label="print()" code />);
    act(() => term().focus());
    const more = screen.getByRole("link", { name: /See more/ });
    act(() => more.focus());
    fireEvent.keyDown(more, { key: "Escape" });
    expect(card()).toBeNull();
    expect(document.activeElement).toBe(term());
  });

  it("toggles on a tap or Enter, and closes when tapping elsewhere", () => {
    render(<ReferenceLink id="python.builtins.print" label="print()" code />);
    fireEvent.click(term());
    expect(card()).toBeTruthy();
    fireEvent.click(term());
    expect(card()).toBeNull();
    fireEvent.click(term());
    fireEvent.pointerDown(document.body);
    expect(card()).toBeNull();
  });

  it("draws the card outside the text, so nothing shifts", () => {
    render(
      <p>
        Use <ReferenceLink id="python.builtins.print" label="print()" /> here.
      </p>,
    );
    fireEvent.click(term());
    expect(card()!.parentElement).toBe(document.body);
    expect(term().closest("p")!.querySelector('[role="dialog"]')).toBeNull();
  });

  it("uses the app's navigation for See more when one is provided", () => {
    const open = vi.fn(() => true);
    render(
      <ReferenceNavigationContext.Provider value={{ hrefFor: (id) => `/reference/${id}?from=x`, open }}>
        <ReferenceLink id="python.builtins.print" label="print()" />
      </ReferenceNavigationContext.Provider>,
    );
    fireEvent.click(term());
    const more = screen.getByRole("link", { name: /See more/ });
    expect(more.getAttribute("href")).toBe("/reference/python.builtins.print?from=x");
    fireEvent.click(more);
    expect(open).toHaveBeenCalledWith("python.builtins.print");
    expect(card()).toBeNull();
  });

  it("renders plain text for an unknown id", () => {
    render(<ReferenceLink id="python.builtins.missing" label="missing()" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("missing()")).toBeTruthy();
  });
});
