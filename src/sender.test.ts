import { describe, expect, test } from "vite-plus/test";
import { acceptsSender, VIEWER_ORIGIN, type Sender } from "./sender.ts";

const tab = { id: 1 } as chrome.tabs.Tab;
const viewer: Sender = { origin: VIEWER_ORIGIN, frameId: 0, tab, documentLifecycle: "active" };

describe("acceptsSender", () => {
  test("answers the viewer's top-level page", () => {
    expect(acceptsSender(viewer, "production")).toBe(true);
    expect(acceptsSender({ ...viewer, documentLifecycle: undefined }, "production")).toBe(true);
  });

  test("refuses other origins, including the docs site the view shared", () => {
    for (const origin of [
      "https://graphcal.org",
      "http://view.graphcal.org",
      "https://view.graphcal.org.evil.example",
      "https://evil.view.graphcal.org",
      "http://localhost:5173",
      "null",
    ]) {
      expect(acceptsSender({ ...viewer, origin }, "production"), origin).toBe(false);
    }
    expect(acceptsSender({ ...viewer, origin: undefined }, "production")).toBe(false);
  });

  test("refuses a frame, a sender without a tab, and a document not shown", () => {
    expect(acceptsSender({ ...viewer, frameId: 3 }, "production")).toBe(false);
    expect(acceptsSender({ ...viewer, frameId: undefined }, "production")).toBe(false);
    expect(acceptsSender({ ...viewer, tab: undefined }, "production")).toBe(false);
    for (const documentLifecycle of ["prerender", "cached", "pending_deletion"] as const) {
      expect(acceptsSender({ ...viewer, documentLifecycle }, "production")).toBe(false);
    }
  });

  test("a development build also answers a local dev server, on any port", () => {
    const local = { ...viewer, origin: "http://localhost:5173" };
    expect(acceptsSender(local, "development")).toBe(true);
    expect(acceptsSender({ ...viewer, origin: "http://localhost" }, "development")).toBe(true);
    expect(acceptsSender(viewer, "development")).toBe(true);
    expect(acceptsSender({ ...local, frameId: 1 }, "development")).toBe(false);
    expect(acceptsSender({ ...viewer, origin: "https://localhost" }, "development")).toBe(false);
    expect(acceptsSender({ ...viewer, origin: "http://localhost.evil" }, "development")).toBe(
      false,
    );
    expect(acceptsSender({ ...viewer, origin: "https://graphcal.org" }, "development")).toBe(false);
  });
});
