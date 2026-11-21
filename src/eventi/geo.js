// Distanze e ricerca di un luogo. La distanza si calcola sul telefono: nessun servizio a pagamento.

export function km(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtKm = (d) => (d == null ? "" : d < 1 ? `${Math.round(d * 1000)} m` : `${d < 10 ? d.toFixed(1).replace(".", ",") : Math.round(d)} km`);

// Cerca un indirizzo o un comune toscano con OpenStreetMap (Nominatim, gratuito, uso leggero).
export async function cercaLuogo(testo) {
  const q = new URLSearchParams({ q: testo, format: "json", limit: "5", countrycodes: "it", "accept-language": "it", viewbox: "9.6,44.5,12.4,42.2" });
  const r = await fetch(`https://nominatim.openstreetmap.org/search?${q}`);
  if (!r.ok) throw new Error("Ricerca non disponibile");
  const j = await r.json();
  return j.map((x) => ({ nome: x.display_name.split(",").slice(0, 3).join(","), lat: +x.lat, lng: +x.lon }));
}

export function posizioneAttuale() {
  return new Promise((ok, ko) => {
    if (!navigator.geolocation) return ko(new Error("Posizione non disponibile"));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude, nome: "La tua posizione" }),
      () => ko(new Error("Non riesco a leggere la posizione")),
      { timeout: 10000, maximumAge: 600000 },
    );
  });
}

// Comuni di partenza più comuni, per chi non vuole dare la posizione.
export const CITTA = [
  { nome: "Firenze", lat: 43.7696, lng: 11.2558 },
  { nome: "Pisa", lat: 43.7228, lng: 10.4017 },
  { nome: "Siena", lat: 43.3188, lng: 11.3308 },
  { nome: "Lucca", lat: 43.8429, lng: 10.5027 },
  { nome: "Livorno", lat: 43.5485, lng: 10.3106 },
  { nome: "Arezzo", lat: 43.4633, lng: 11.8796 },
  { nome: "Grosseto", lat: 42.7635, lng: 11.1124 },
  { nome: "Prato", lat: 43.8777, lng: 11.1022 },
  { nome: "Pistoia", lat: 43.9333, lng: 10.9167 },
  { nome: "Massa", lat: 44.0354, lng: 10.1397 },
];
