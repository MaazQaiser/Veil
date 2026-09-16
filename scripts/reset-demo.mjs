#!/usr/bin/env node
/**
 * Opens the Vael In / Vael Out demo-reset route in the OS default browser.
 * The actual reset runs client-side (the data lives in the browser's
 * localStorage), so this just triggers it — the Vite dev server
 * (`npm run dev`) must already be running.
 */
import { exec } from "node:child_process";

const port = process.env.VAEL_DEV_PORT || "5173";
const url = `http://localhost:${port}/demo/reset-vael`;

const openCommand =
  process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";

console.log(`Resetting the Vael In / Vael Out demo accounts — opening ${url}`);
console.log("(Make sure `npm run dev` is already running in another terminal.)");

exec(`${openCommand} ${url}`, (error) => {
  if (error) {
    console.error(`Could not open a browser automatically: ${error.message}`);
    console.error(`Open this URL yourself instead: ${url}`);
    process.exitCode = 1;
  }
});
