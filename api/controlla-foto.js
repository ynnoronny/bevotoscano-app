// Strumento temporaneo: controlla che le foto di riserva si carichino.
import { REPERTORIO } from "../src/repertorio.js";
export default async function handler(req, res) {
  const out = await Promise.all(REPERTORIO.filter((u) => u.startsWith("http")).map(async (u) => {
    try { const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Bevotoscano" } }); return `${r.status} ${r.headers.get("content-type")} ${r.headers.get("content-length")} ${u.split("/").pop()}`; }
    catch (e) { return `ERR ${e} ${u}`; }
  }));
  res.json(out);
}
