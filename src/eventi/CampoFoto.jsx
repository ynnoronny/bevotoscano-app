import { useEffect, useState } from "react";

// Campo "foto o locandina" per i moduli Segnala: scegli un'immagine dal telefono,
// vedi subito l'anteprima piccola. Nella scheda pubblica poi si apre in grande.
export default function CampoFoto({ file, onFile, etichetta, aiuto }) {
  const [anteprima, setAnteprima] = useState(null);
  useEffect(() => {
    if (!file) return setAnteprima(null);
    const u = URL.createObjectURL(file);
    setAnteprima(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="campo-foto">
      <span className="campo-foto-etichetta">{etichetta}</span>
      {anteprima ? (
        <div className="campo-foto-scelta">
          <img src={anteprima} alt="Anteprima" />
          <button type="button" className="link" onClick={() => onFile(null)}>Togli</button>
        </div>
      ) : (
        <label className="campo-foto-vuoto">
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} />
          <span>📷 Scegli una foto</span>
        </label>
      )}
      <small className="campo-foto-aiuto">{aiuto}</small>
    </div>
  );
}
