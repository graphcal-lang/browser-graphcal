// Which pages the worker answers. The manifest's `externally_connectable`
// already limits who can send a message; this checks each message again,
// from what Chrome itself says about its sender, so that only the viewer's
// own top-level page reads repositories: not a frame inside it (or a page
// framing it), not a prerendered or cached document, not another origin.

/** The origin of the published viewer, https://view.graphcal.org/. */
export const VIEWER_ORIGIN = "https://view.graphcal.org";

/** What a build answers: the published viewer, and in a development build also a local dev server. */
export type Build = "production" | "development";

/** The facts of `chrome.runtime.MessageSender` the check reads. */
export type Sender = Pick<
  chrome.runtime.MessageSender,
  "origin" | "frameId" | "tab" | "documentLifecycle"
>;

/** Whether `origin` (as Chrome reports it, no trailing slash) is a viewer this build answers. */
function isViewerOrigin(origin: string, build: Build): boolean {
  if (origin === VIEWER_ORIGIN) return true;
  if (build !== "development") return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  // `http://localhost/*` in the development manifest matches every port.
  return url.protocol === "http:" && url.hostname === "localhost" && url.origin === origin;
}

/** Whether the worker answers a message from `sender`. */
export function acceptsSender(sender: Sender, build: Build): boolean {
  return (
    sender.origin !== undefined &&
    isViewerOrigin(sender.origin, build) &&
    // A page's top-level frame: a message from a tab always has a frame id.
    sender.tab !== undefined &&
    sender.frameId === 0 &&
    // Set since Chrome 106; a document that is not shown does not ask.
    (sender.documentLifecycle === undefined || sender.documentLifecycle === "active")
  );
}
