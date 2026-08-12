import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let target;
try {
  target = require.resolve("vinext/dist/server/dev-origin-check.js");
} catch {
  process.exit(0);
}

if (!existsSync(target)) process.exit(0);

let source = readFileSync(target, "utf8");
const original = source;

source = source.replace(
  /function isCrossSiteNoCorsRequest\(secFetchSite, secFetchMode\) \{\s*return secFetchMode === "no-cors" && secFetchSite === "cross-site";\s*\}/,
  `function isCrossSiteNoCorsRequest(secFetchSite, secFetchMode) {
	// Disabled: Cursor embedded browser sends cross-site no-cors and would blank the preview.
	return false;
}`,
);

source = source.replace(
  /\s*\/\/ Check Sec-Fetch headers \(catches <script> tag exfiltration\)\s*if \(request\.headers\.get\("sec-fetch-mode"\) === "no-cors" &&\s*request\.headers\.get\("sec-fetch-site"\) === "cross-site"\) \{\s*console\.warn\("\[vinext\] Blocked cross-site no-cors request to " \+ new URL\(request\.url\)\.pathname\);\s*return __forbidden\(\);\s*\}/,
  `
  // Sec-Fetch cross-site no-cors check disabled for Cursor embedded browser preview.`,
);

if (source !== original) {
  writeFileSync(target, source);
  console.log("[patch] Disabled vinext cross-site no-cors block for Cursor preview");
}
