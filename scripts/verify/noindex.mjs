// Confirm noindex on every route. Usage:
//   node scripts/verify/noindex.mjs https://your-deployment.example
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const routes = ["/", "/access", "/admin/sign-in", "/counsel/anyone"];
let ok = true;
for (const r of routes) {
  const res = await fetch(base + r, { redirect: "manual" });
  const header = res.headers.get("x-robots-tag");
  const pass = /noindex/i.test(header ?? "");
  if (!pass) ok = false;
  console.log(`${pass ? "PASS" : "FAIL"}  ${r}  (${res.status})  x-robots-tag: ${header ?? "MISSING"}`);
}
console.log(ok ? "\nAll routes noindex ✓" : "\nnoindex MISSING on a route ✗");
process.exit(ok ? 0 : 1);
