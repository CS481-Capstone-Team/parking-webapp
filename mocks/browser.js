// Starts MSW so the fake API routes answer the app's requests.

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers.js";
import { startCars } from "./cars.js";

const worker = setupWorker(...handlers);

// Starts the fake server and the fake cars. Called once by app/api.js.
export async function startMocks() {
  await worker.start({
    // Requests the mocks do not handle (pages, scripts, styles) go through as normal.
    onUnhandledFrame: "bypass",
  });
  startCars();
}
