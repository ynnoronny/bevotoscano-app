import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mappaFerma, sistemaNomi, disegnaZone, inquadra } from "../mappaFerma.js";

// La mappa degli eventi, ferma (il dito fa scorrere la pagina). Le zone del vino fanno da filtro:
// tocchi Montalcino e sotto restano solo i suoi eventi. Pallini vino = dove si tiene l'evento,
// pallini oro = punti di raccolta della navetta.
export default function Mappa({ eventi, conta, centro, onApri, attivo, zona, onZona }) {
  const box = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const zone = useRef(null);

  useEffect(() => {
    map.current = mappaFerma(box.current);
    map.current.on("moveend zoomend", () => sistemaNomi(box.current, map.current));
    zone.current = L.layerGroup().addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    inquadra(map.current, null);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    disegnaZone(zone.current, { conta, zona, onZona });
    inquadra(map.current, zona);
    sistemaNomi(box.current, map.current);
  }, [zona, conta]);

  useEffect(() => {
    const g = layer.current;
    g.clearLayers();
    if (centro) L.circleMarker([centro.lat, centro.lng], { radius: 7, color: "#2F5D7C", fillColor: "#2F5D7C", fillOpacity: 1 }).addTo(g);
    eventi.forEach((e) => {
      (e.pickup || []).forEach((p) => {
        if (p.lat == null) return;
        L.circleMarker([p.lat, p.lng], { radius: 5, color: "#8a6d3b", fillColor: "#C9A96E", fillOpacity: 1, weight: 2, interactive: false }).addTo(g);
        if (e.lat != null) L.polyline([[p.lat, p.lng], [e.lat, e.lng]], { color: "#C9A96E", weight: 2, dashArray: "4 6", interactive: false }).addTo(g);
      });
      if (e.lat == null) return;
      const on = e.id === attivo;
      L.circleMarker([e.lat, e.lng], { radius: on ? 12 : 9, color: on ? "#F2B33D" : "#FFFDF8", fillColor: "#B3243B", fillOpacity: 1, weight: on ? 3 : 2, bubblingMouseEvents: false })
        .on("click", () => onApri(e)).addTo(g);
    });
  }, [eventi, centro, attivo]);

  return <div ref={box} className="mappa mappa--ferma" />;
}
