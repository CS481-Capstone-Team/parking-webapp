import { defineConfig } from "vite";

export default defineConfig({
  root: "app",
  publicDir: "../public",
  server: {
    // With `npm run dev:server`, /api requests go to the real server.
    // With `npm run dev`, the mocks answer first, so this is never reached.
    proxy: {
      "/api/": "http://localhost:3000",
    },
  },
});
