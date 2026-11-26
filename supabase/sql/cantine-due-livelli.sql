-- Cantine in due livelli: archivio (tutto quello che trovano le ricerche) e qualificate
-- (verificate una a una con una ricerca singola). Solo aggiunte: niente viene cancellato.

alter table public.scanner_attori
  add column if not exists qualifica text,             -- null = solo archivio; proposta = ricerca fatta, da confermare; confermata; doppione
  add column if not exists produce boolean,            -- fa il vino da uve proprie (non solo rivende o imbottiglia)
  add column if not exists azienda_agricola boolean,   -- impresa agricola (coltiva le sue vigne)
  add column if not exists bottiglie integer,          -- bottiglie l'anno
  add column if not exists bottiglie_stima boolean,    -- true = ricavate dagli ettari, non dichiarate
  add column if not exists ettari numeric,             -- ettari vitati
  add column if not exists tipologie text[],           -- rosso, bianco, rosato, spumante, dolce, orange
  add column if not exists vini jsonb,                 -- [{nome, tipologia, denominazione, vitigni}]
  add column if not exists qualifica_fonti text[],     -- pagine lette
  add column if not exists qualifica_note text,        -- cosa ha controllato la ricerca, dubbi
  add column if not exists qualifica_tentata timestamptz,
  add column if not exists qualificata_il timestamptz,
  add column if not exists confermata_il timestamptz,
  add column if not exists doppione_di bigint,
  add column if not exists gruppo text;               -- gruppo o azienda a cui appartiene

do $$ begin
  alter table public.scanner_attori add constraint scanner_attori_qualifica_check
    check (qualifica is null or qualifica in ('proposta', 'confermata', 'doppione'));
exception when duplicate_object then null; end $$;

-- La soglia tra "Vignaioli" e "Grandi cantine": si cambia da qui (o dal gestionale, Scanner > Regole).
insert into public.scanner_regole (nome, testo)
values ('soglia_vignaioli', '100000')
on conflict (nome) do nothing;

-- Chi segnala dal sito non può compilare la qualifica.
create or replace function public.segnalazione_senza_qualifica() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    new.qualifica := null; new.produce := null; new.azienda_agricola := null; new.bottiglie := null;
    new.bottiglie_stima := null; new.ettari := null; new.tipologie := null; new.vini := null;
    new.qualifica_fonti := null; new.qualifica_note := null; new.qualificata_il := null; new.confermata_il := null;
  end if;
  return new;
end $$;
drop trigger if exists attori_segnalazione_senza_qualifica on public.scanner_attori;
create trigger attori_segnalazione_senza_qualifica before insert on public.scanner_attori
  for each row execute function public.segnalazione_senza_qualifica();

-- Fascia: vignaioli sotto la soglia, grandi sopra, null se non sappiamo i volumi.
create or replace function public.fascia_cantina(b integer) returns text
language sql stable security definer set search_path = public as $$
  select case when b is null then null
    when b <= coalesce((select nullif(regexp_replace(testo, '\D', '', 'g'), '')::int from scanner_regole where nome = 'soglia_vignaioli'), 100000)
      then 'vignaioli' else 'grandi' end;
$$;

create or replace view public.attori_pubblici as
 SELECT id, nome, tipo, comune, indirizzo, sito, instagram, facebook,
    COALESCE(google_maps, ('https://www.google.com/maps/search/?api=1&query='::text || replace(replace((((nome || ' '::text) || COALESCE(comune, ''::text)) || ' Toscana'::text), '&'::text, 'e'::text), ' '::text, '+'::text))) AS google_maps,
    denominazioni, lat, lng, foto, descrizione,
    qualifica, produce, azienda_agricola, bottiglie, bottiglie_stima, ettari, tipologie, vini,
    public.fascia_cantina(bottiglie) AS fascia
   FROM scanner_attori
  WHERE stato = 'approvato'::text AND attivo;

-- Coda della ricerca singola: prima le cantine citate nelle notizie (premi), poi quelle già
-- pubbliche, poi quelle con sito e dagli elenchi dei consorzi. Non ripropone per 14 giorni
-- una cantina su cui la ricerca non ha trovato nulla.
create or replace function public.prossime_da_qualificare(n integer default 10)
returns table (id bigint, nome text, tipo text, comune text, indirizzo text, sito text, instagram text, facebook text,
               denominazioni text, origine text, stato text, note text, fonte_url text, citata_nelle_notizie boolean)
language sql stable security definer set search_path = public as $$
  with citate as (
    select distinct lower(unnest(aziende)) a from notizie where stato <> 'rifiutata'
  )
  select s.id, s.nome, s.tipo, s.comune, s.indirizzo, s.sito, s.instagram, s.facebook, s.denominazioni, s.origine, s.stato, s.note, s.fonte_url,
         exists (select 1 from citate c where lower(s.nome) like '%' || c.a || '%') as citata_nelle_notizie
  from scanner_attori s
  where s.qualifica is null and s.attivo and s.stato <> 'rifiutato'
    and s.tipo in ('cantina', 'azienda_agricola', 'fattoria', 'altro')
    and (s.qualifica_tentata is null or s.qualifica_tentata < now() - interval '14 days')
  order by citata_nelle_notizie desc, (s.stato = 'approvato') desc, (s.sito is not null) desc, (s.origine = 'consorzio') desc, s.id
  limit greatest(1, least(n, 50));
$$;

-- La ricerca singola consegna qui il risultato. dati: {produce, azienda_agricola, bottiglie,
-- bottiglie_stima, ettari, tipologie[], vini[], fonti[], note, comune, sito, descrizione, doppione_di, non_trovata}
create or replace function public.salva_qualifica(p_id bigint, dati jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  fonti text[] := coalesce(array(select jsonb_array_elements_text(dati->'fonti')), '{}');
begin
  if coalesce((dati->>'non_trovata')::boolean, false) then
    update scanner_attori set qualifica_tentata = now(),
      qualifica_note = left(coalesce(dati->>'note', 'Nessuna fonte affidabile trovata'), 900) where id = p_id;
    return 'riprovo tra 14 giorni';
  end if;
  if (dati->>'doppione_di') is not null then
    update scanner_attori set qualifica = 'doppione', doppione_di = (dati->>'doppione_di')::bigint, qualificata_il = now(),
      qualifica_tentata = now(), qualifica_note = left(dati->>'note', 900) where id = p_id;
    return 'doppione';
  end if;
  if array_length(fonti, 1) is null then
    raise exception 'Serve almeno una fonte letta (dati.fonti)';
  end if;
  update scanner_attori set
    qualifica = 'proposta',
    produce = (dati->>'produce')::boolean,
    azienda_agricola = (dati->>'azienda_agricola')::boolean,
    bottiglie = nullif(dati->>'bottiglie', '')::numeric::int,
    bottiglie_stima = coalesce((dati->>'bottiglie_stima')::boolean, false),
    ettari = nullif(dati->>'ettari', '')::numeric,
    gruppo = nullif(dati->>'gruppo', ''),
    tipologie = case when jsonb_typeof(dati->'tipologie') = 'array' then array(select jsonb_array_elements_text(dati->'tipologie')) end,
    vini = case when jsonb_typeof(dati->'vini') = 'array' then dati->'vini' end,
    qualifica_fonti = fonti,
    qualifica_note = left(dati->>'note', 900),
    comune = coalesce(comune, nullif(dati->>'comune', '')),
    sito = coalesce(sito, nullif(dati->>'sito', '')),
    descrizione = coalesce(descrizione, left(nullif(dati->>'descrizione', ''), 220)),
    qualificata_il = now(), qualifica_tentata = now()
  where id = p_id and (qualifica is distinct from 'confermata');
  return case when found then 'proposta salvata' else 'non trovata o già confermata' end;
end $$;

revoke all on function public.prossime_da_qualificare(integer) from public, anon, authenticated;
revoke all on function public.salva_qualifica(bigint, jsonb) from public, anon, authenticated;
revoke all on function public.segnalazione_senza_qualifica() from public, anon, authenticated;

-- 26/11 sera, su proposta di Ronny: la fascia si decide prima sugli ettari vitati (molti piccoli
-- vendono sfuso o imbottigliano poco), le bottiglie contano solo se mancano gli ettari.
insert into public.scanner_regole (nome, testo) values ('soglia_vignaioli_ettari', '15') on conflict (nome) do nothing;
create or replace function public.fascia_cantina(ha numeric, b integer) returns text
language sql stable security definer set search_path = public as $$
  select case
    when ha is not null then
      case when ha <= coalesce((select nullif(regexp_replace(replace(testo, ',', '.'), '[^0-9.]', '', 'g'), '')::numeric from scanner_regole where nome = 'soglia_vignaioli_ettari'), 15)
        then 'vignaioli' else 'grandi' end
    when b is not null then public.fascia_cantina(b)
    else null end;
$$;
-- e nella vista attori_pubblici: public.fascia_cantina(ettari, bottiglie) AS fascia

-- 26/11 sera, decisione di Ronny: niente nomi, tre dimensioni dagli ettari (piccola <= 10, media <= 30, grande oltre).
insert into public.scanner_regole (nome, testo) values ('fasce_ettari', '10, 30'), ('fasce_bottiglie', '65000, 200000') on conflict (nome) do nothing;
create or replace function public.fascia_cantina(ha numeric, b integer) returns text
language sql stable security definer set search_path = public as $$
  with s as (
    select string_to_array(regexp_replace(coalesce((select testo from scanner_regole where nome = 'fasce_ettari'), '10,30'), '[^0-9.,]', '', 'g'), ',') e,
           string_to_array(regexp_replace(coalesce((select testo from scanner_regole where nome = 'fasce_bottiglie'), '65000,200000'), '[^0-9,]', '', 'g'), ',') bt
  )
  select case
    when ha is not null then case when ha <= e[1]::numeric then 'piccola' when ha <= e[2]::numeric then 'media' else 'grande' end
    when b is not null then case when b <= bt[1]::numeric then 'piccola' when b <= bt[2]::numeric then 'media' else 'grande' end
    end
  from s;
$$;
create or replace function public.fascia_cantina(b integer) returns text
language sql stable security definer set search_path = public as $$ select public.fascia_cantina(null::numeric, b); $$;
-- (soglia_vignaioli e soglia_vignaioli_ettari in scanner_regole non servono più)
