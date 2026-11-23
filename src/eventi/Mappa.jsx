import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE, TILE_ATTR } from "../tema.js";
import { ZONE, zonaDi } from "../zone.js";

// Mappa OpenStreetMap divisa per zone del vino (tocca una zona per avvicinarti).
// Pallini vino = dove si tiene l'evento, pallini oro = punti di raccolta.
export default function Mappa({ eventi, centro, onApri, attivo }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const zone = useRef(null);

  useEffect(() => {
    map.current = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([43.45, 11.1], 8);
    L.tileLayer(TILE, { className: "tile-calde",
      maxZoom: 18,
      attribution: TILE_ATTR,
    }).addTo(map.current);
    zone.current = L.layerGroup().addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    // le zone: piene se ci sono eventi, appena accennate se no
    zone.current.clearLayers();
    const quanti = {};
    eventi.forEach((e) => { const z = e.lat != null && zonaDi([e.lat, e.lng]); if (z) quanti[z] = (quanti[z] || 0) + 1; });
    ZONE.forEach((z) => {
      const n = quanti[z.zona] || 0;
      const c = L.circle(z.centro, { radius: z.km * 1000, color: z.colore, weight: n ? 2 : 1, fillColor: z.colore, fillOpacity: n ? 0.28 : 0.12, opacity: n ? 0.9 : 0.6 })
        .on("click", () => map.current.fitBounds(c.getBounds(), { padding: [8, 8] }))
        .addTo(zone.current);
      if (n) c.bindTooltip(`${z.zona} · ${n}`, { permanent: true, direction: "top", className: "zona-tip", offset: [0, -6] });
      else c.bindTooltip(z.zona, { className: "zona-tip zona-tip--vuota" });
    });
    const g = layer.current;
    g.clearLayers();
    const punti = [];
    if (centro) {
      L.circleMarker([centro.lat, centro.lng], { radius: 7, color: "#2F5D7C", fillColor: "#2F5D7C", fillOpacity: 1 }).bindTooltip(centro.nome).addTo(g);
      punti.push([centro.lat, centro.lng]);
    }
    eventi.forEach((e) => {
      (e.pickup || []).forEach((p) => {
        if (p.lat == null) return;
        L.circleMarker([p.lat, p.lng], { radius: 6, color: "#8a6d3b", fillColor: "#C9A96E", fillOpacity: 1, weight: 2 })
          .bindTooltip(`🚌 ${p.nome}${p.orario ? ` · ${p.orario}` : ""}`).addTo(g);
        if (e.lat != null) L.polyline([[p.lat, p.lng], [e.lat, e.lng]], { color: "#C9A96E", weight: 2, dashArray: "4 6" }).addTo(g);
        punti.push([p.lat, p.lng]);
      });
      if (e.lat == null) return;
      const on = e.id === attivo;
      L.circleMarker([e.lat, e.lng], { radius: on ? 12 : 9, color: on ? "#F2B33D" : "#FFFDF8", fillColor: "#B3243B", fillOpacity: 1, weight: on ? 3 : 2 })
        .bindTooltip(e.titolo).on("click", () => onApri(e)).addTo(g);
      punti.push([e.lat, e.lng]);
    });
    if (punti.length && !attivo) map.current.fitBounds(punti, { padding: [30, 30], maxZoom: 11 });
  }, [eventi, centro, attivo]);

  return <div ref={box} className="mappa" />;
}
