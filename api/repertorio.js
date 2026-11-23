// Strumento temporaneo: cerca su Wikimedia Commons foto libere (pubblico dominio / CC0) di vigneti toscani.
export default async function handler(req, res) {
  const q = String(req.query.q || "Tuscany vineyard");
  const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q + " filetype:bitmap")}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1280&format=json`;
  const r = await fetch(u, { headers: { "User-Agent": "Bevotoscano/1.0 (app)" } });
  const j = await r.json();
  const out = Object.values(j.query?.pages || {}).map((p) => {
    const i = p.imageinfo?.[0] || {}; const m = i.extmetadata || {};
    return { t: p.title, w: i.width, h: i.height, u: i.thumburl, lic: m.LicenseShortName?.value, a: (m.Artist?.value || "").replace(/<[^>]+>/g, "").slice(0, 60) };
  }).filter((x) => x.w > x.h && x.w >= 1600);
  res.json(out);
}
