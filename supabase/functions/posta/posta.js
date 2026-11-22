// La casella info@ vista dal pannello admin: leggere (IMAP) e rispondere (SMTP).
// Le librerie arrivano da fuori (index.ts), così questo file si prova anche in locale con Node.

const PAGINA = 25;

const persona = (a) => (a ? { nome: a.name || "", email: a.address || "" } : null);
const persone = (l) => (l || []).map(persona).filter((p) => p && p.email);

export function creaPosta({ ImapFlow, nodemailer, PostalMime, cfg }) {
  const auth = { user: cfg.utente, pass: cfg.password };

  async function conImap(fn) {
    const c = new ImapFlow({ host: cfg.imapHost, port: cfg.imapPorta, secure: cfg.sicuro !== false, auth, logger: false, tls: cfg.tls });
    await c.connect();
    try {
      return await fn(c);
    } finally {
      await c.logout().catch(() => c.close());
    }
  }

  async function cartellaInviata(c) {
    const l = await c.list();
    return (l.find((m) => m.specialUse === "\\Sent") || l.find((m) => /sent|inviat/i.test(m.path)))?.path;
  }

  async function cartellaCestino(c) {
    const l = await c.list();
    return (l.find((m) => m.specialUse === "\\Trash") || l.find((m) => /trash|cestin|deleted/i.test(m.path)))?.path;
  }

  return {
    // Sposta nel cestino; se la mail è già nel cestino, la elimina per sempre.
    async elimina({ cartella = "INBOX", uid }) {
      if (!uid) throw new Error("Mail non indicata");
      return conImap(async (c) => {
        const cestino = await cartellaCestino(c);
        const lock = await c.getMailboxLock(cartella);
        try {
          if (cestino && cartella !== cestino) {
            await c.messageMove(String(uid), cestino, { uid: true });
            return { ok: true, esito: "cestino" };
          }
          await c.messageDelete(String(uid), { uid: true });
          return { ok: true, esito: "eliminata" };
        } finally {
          lock.release();
        }
      });
    },

    async cartelle() {
      return conImap(async (c) => {
        const l = await c.list();
        return l.filter((m) => !m.flags?.has("\\Noselect")).map((m) => ({ path: m.path, nome: m.name, speciale: m.specialUse || null }));
      });
    },

    // Le ultime 25 mail della cartella. "prima" = da quale numero continuare (per "carica altre").
    async lista({ cartella = "INBOX", prima } = {}) {
      return conImap(async (c) => {
        const lock = await c.getMailboxLock(cartella);
        try {
          const tot = c.mailbox.exists;
          const fine = Math.min(prima ? prima - 1 : tot, tot);
          if (fine < 1) return { mail: [], altre: null, totale: tot };
          const inizio = Math.max(1, fine - PAGINA + 1);
          const mail = [];
          for await (const m of c.fetch(`${inizio}:${fine}`, { uid: true, envelope: true, flags: true, internalDate: true })) {
            mail.push({
              uid: m.uid,
              da: persona(m.envelope?.from?.[0]),
              a: persone(m.envelope?.to),
              oggetto: m.envelope?.subject || "(senza oggetto)",
              data: (m.envelope?.date || m.internalDate)?.toISOString?.() || null,
              letta: m.flags?.has("\\Seen") || false,
              risposta: m.flags?.has("\\Answered") || false,
            });
          }
          mail.reverse();
          return { mail, altre: inizio > 1 ? inizio : null, totale: tot };
        } finally {
          lock.release();
        }
      });
    },

    async leggi({ cartella = "INBOX", uid }) {
      return conImap(async (c) => {
        const lock = await c.getMailboxLock(cartella);
        try {
          const m = await c.fetchOne(String(uid), { source: true, flags: true }, { uid: true });
          if (!m) throw new Error("Mail non trovata");
          const p = await PostalMime.parse(m.source);
          if (!m.flags?.has("\\Seen")) await c.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
          return {
            uid,
            da: persona(p.from),
            rispondiA: persone(p.replyTo)[0] || null,
            a: persone(p.to),
            cc: persone(p.cc),
            oggetto: p.subject || "(senza oggetto)",
            data: p.date || null,
            testo: p.text || "",
            html: p.html || "",
            messageId: p.messageId || null,
            references: p.references || null,
            allegati: (p.attachments || []).filter((x) => x.disposition !== "inline" || !x.contentId).map((x, i) => ({
              indice: i, nome: x.filename || `allegato-${i + 1}`, tipo: x.mimeType, dimensione: x.content?.byteLength || 0,
            })),
          };
        } finally {
          lock.release();
        }
      });
    },

    async allegato({ cartella = "INBOX", uid, indice }) {
      return conImap(async (c) => {
        const lock = await c.getMailboxLock(cartella);
        try {
          const m = await c.fetchOne(String(uid), { source: true }, { uid: true });
          const p = await PostalMime.parse(m.source);
          const lista = (p.attachments || []).filter((x) => x.disposition !== "inline" || !x.contentId);
          const x = lista[indice];
          if (!x) throw new Error("Allegato non trovato");
          const bytes = new Uint8Array(x.content);
          let bin = "";
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return { nome: x.filename || `allegato-${indice + 1}`, tipo: x.mimeType, base64: btoa(bin) };
        } finally {
          lock.release();
        }
      });
    },

    // Invia (nuova mail o risposta) e ne mette una copia in "Posta inviata".
    async invia({ a, cc, oggetto, testo, inReplyTo, references, rispostaUid, cartella = "INBOX" }) {
      const dest = String(a || "").trim();
      if (!dest) throw new Error("Manca il destinatario");
      if (!String(testo || "").trim()) throw new Error("Il messaggio è vuoto");
      const mail = {
        from: { name: cfg.nomeMittente, address: cfg.utente },
        to: dest,
        cc: cc || undefined,
        subject: oggetto || "",
        text: testo,
        inReplyTo: inReplyTo || undefined,
        references: references || inReplyTo || undefined,
      };
      // Prima costruisco il messaggio grezzo, così la stessa identica mail va spedita e salvata.
      const raw = await new Promise((ok, ko) =>
        nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" }).sendMail(mail, (e, info) => (e ? ko(e) : ok(info.message)))
      );
      const smtp = nodemailer.createTransport({ host: cfg.smtpHost, port: cfg.smtpPorta, secure: cfg.sicuro !== false, auth, tls: cfg.tls });
      const info = await smtp.sendMail({ envelope: { from: cfg.utente, to: [dest, cc].filter(Boolean).join(",").split(/[,;]/).map((x) => x.trim()).filter(Boolean) }, raw });

      let salvata = false;
      try {
        await conImap(async (c) => {
          const inviata = await cartellaInviata(c);
          if (inviata) { await c.append(inviata, raw, ["\\Seen"]); salvata = true; }
          if (rispostaUid) {
            const lock = await c.getMailboxLock(cartella);
            try { await c.messageFlagsAdd(String(rispostaUid), ["\\Answered"], { uid: true }); } finally { lock.release(); }
          }
        });
      } catch { /* la mail è partita comunque */ }
      return { ok: true, accettata: info.accepted?.length ?? 1, salvataInInviata: salvata };
    },
  };
}
