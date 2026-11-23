import L from "leaflet";
import { TILE, TILE_ATTR } from "./tema.js";
import { ZONE, TOSCANA_STRETTA } from "./zone.js";

// Le mappe di eventi e cantine sono "ferme": il dito sulla mappa fa scorrere la pagina
// (prima trascinava la mappa e non si arrivava più alla lista). Non si sposta e non si zooma
// a mano: si tocca una zona e la mappa ci va da sola, si tocca di nuovo e torna su tutta la Toscana.
export function mappaFerma(el) {
  const m = L.map(el, {
    dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false,
    boxZoom: false, keyboard: false, zoomControl: false, zoomSnap: 0.1, tap: false,
    // niente animazioni di zoom: la mappa salta subito sulla zona, e i nomi si sistemano senza tremolii
    zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
  });
  // via il marchio Leaflet; il credito a OpenStreetMap resta (lo chiede la licenza), ma piccolo
  m.attributionControl.setPrefix(false);
  L.tileLayer(TILE, { className: "tile-calde", maxZoom: 16, attribution: TILE_ATTR }).addTo(m);
  return m;
}

// I nomi delle zone: da lontano solo quelle dove c'è qualcosa (o quella scelta), da vicino tutte.
// Se due nomi si toccano resta il più importante, così non ci sono mai etichette una sopra l'altra.
export function sistemaNomi(box, map) {
  if (!box) return;
  box.classList.toggle("mappa--lontana", map.getZoom() < 9);
  clearTimeout(box.nomiTimer);
  box.nomiTimer = setTimeout(() => {
    const fuori = box.getBoundingClientRect();
    const tip = [...box.querySelectorAll(".zona-tip")];
    tip.forEach((t) => { t.style.visibility = ""; });
    const visibili = tip
      .filter((t) => getComputedStyle(t).display !== "none")
      .map((t) => ({ t, r: t.getBoundingClientRect(), p: +t.dataset.peso || 0 }))
      .filter((x) => x.r.right > fuori.left && x.r.left < fuori.right && x.r.bottom > fuori.top && x.r.top < fuori.bottom)
      .sort((a, b) => b.p - a.p);
    const messi = [];
    for (const x of visibili) {
      const tocca = messi.some((m) => x.r.left < m.right + 3 && x.r.right > m.left - 3 && x.r.top < m.bottom + 2 && x.r.bottom > m.top - 2);
      if (tocca) x.t.style.visibility = "hidden";
      else messi.push(x.r);
    }
  }, 60);
}

// Le zone del vino come cerchi colorati, toccabili: la zona scelta si accende, le altre restano tenui.
// conta: { "Montalcino": 3, … } quanti eventi o cantine ci sono in ogni zona.
export function disegnaZone(gruppo, { conta, zona, onZona }) {
  gruppo.clearLayers();
  ZONE.forEach((a) => {
    const on = a.zona === zona;
    const n = conta[a.zona] || 0;
    const tocca = () => onZona(on ? null : a.zona);
    const c = L.circle(a.centro, { radius: a.km * 1000, color: a.colore, weight: on ? 3 : 1.5, fillColor: a.colore, fillOpacity: on ? 0.22 : n ? 0.3 : 0.14, opacity: on || n ? 0.95 : 0.5 })
      .bindTooltip(n ? `${a.zona} · ${n}` : a.zona, { permanent: true, direction: "center", interactive: true, className: `zona-tip ${on ? "zona-tip--on" : ""} ${n || on ? "" : "zona-tip--vuota"}` })
      .on("click", tocca)
      .addTo(gruppo);
    const el = c.getTooltip()?.getElement();
    if (el) el.dataset.peso = (on ? 1000 : 0) + n * 100 + a.km;
  });
}

// Dove guarda la mappa: la zona scelta, se no il riquadro dato (una provincia), se no tutta la Toscana.
export function inquadra(map, zona, riquadro) {
  const z = ZONE.find((x) => x.zona === zona);
  if (z) map.fitBounds(L.latLng(z.centro).toBounds(z.km * 2000 * 1.6));
  else map.fitBounds(riquadro || TOSCANA_STRETTA, { padding: riquadro ? [8, 8] : [0, 0] });
}

// Quanti elementi per zona, da una lista che ha già il campo zona.
export const contaZone = (lista) => lista.reduce((o, x) => { if (x.zona) o[x.zona] = (o[x.zona] || 0) + 1; return o; }, {});
