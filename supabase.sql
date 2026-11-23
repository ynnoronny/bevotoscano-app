-- Bevotoscano: database. Incolla tutto in Supabase → SQL Editor → Run.

-- Classifica del quiz: tutti leggono, tutti possono aggiungere un punteggio valido.
create table if not exists punteggi (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) between 1 and 20),
  paese text not null default 'XX' check (char_length(paese) = 2),
  punti int not null check (punti between 0 and 2000),
  corrette int not null check (corrette between 0 and 10),
  creato timestamptz not null default now()
);
alter table punteggi enable row level security;
drop policy if exists "classifica pubblica" on punteggi;
create policy "classifica pubblica" on punteggi for select using (true);
drop policy if exists "nuovo punteggio" on punteggi;
create policy "nuovo punteggio" on punteggi for insert with check (true);

-- Contatti (email da giochi, cassa, esperienze): il sito può solo scrivere,
-- nessuno può leggerli dal sito. Li vedi tu in Supabase → Table Editor → contatti.
create table if not exists contatti (
  id bigint generated always as identity primary key,
  tipo text not null check (char_length(tipo) <= 40),
  email text not null check (char_length(email) <= 200 and email like '%@%'),
  nome text check (char_length(nome) <= 80),
  dati jsonb,
  creato timestamptz not null default now()
);
alter table contatti enable row level security;
drop policy if exists "nuovo contatto" on contatti;
create policy "nuovo contatto" on contatti for insert with check (true);

-- ===================== EVENTI DEL VINO =====================
-- Gli eventi arrivano dal form "Segnala un evento" in stato "in_attesa".
-- Li vede e li approva solo chi è nella tabella admin (pagina #/admin dell'app).
-- Il pubblico vede solo la vista eventi_pubblici: eventi approvati e non ancora passati,
-- senza email e telefono dell'organizzatore.

-- Chi può moderare: aggiungi qui la tua email (la stessa con cui crei l'utente in
-- Supabase → Authentication → Users → Add user, con password).
create table if not exists admin (
  email text primary key
);
alter table admin enable row level security;
-- insert into admin (email) values ('tua@email.it');

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin where email = (auth.jwt() ->> 'email'));
$$;

-- Punti di raccolta riutilizzabili (fermate dei bus, stazioni, piazzali).
create table if not exists pickup_point (
  id bigint generated always as identity primary key,
  nome text not null check (char_length(nome) <= 120),
  comune text check (char_length(comune) <= 80),
  lat double precision not null,
  lng double precision not null,
  creato timestamptz not null default now()
);
alter table pickup_point enable row level security;
drop policy if exists "pickup pubblici" on pickup_point;
create policy "pickup pubblici" on pickup_point for select using (true);
drop policy if exists "pickup admin" on pickup_point;
create policy "pickup admin" on pickup_point for all to authenticated using (is_admin()) with check (is_admin());

create table if not exists eventi (
  id bigint generated always as identity primary key,
  stato text not null default 'in_attesa' check (stato in ('in_attesa','pubblicato','rifiutato')),
  fonte text not null default 'form' check (fonte in ('form','admin')),
  -- l'evento
  titolo text not null check (char_length(titolo) between 3 and 120),
  descrizione text check (char_length(descrizione) <= 1500),
  inizio timestamptz not null,
  fine timestamptz,
  altre_date text check (char_length(altre_date) <= 300),
  luogo_nome text not null check (char_length(luogo_nome) <= 120),
  indirizzo text check (char_length(indirizzo) <= 200),
  comune text not null check (char_length(comune) <= 80),
  lat double precision,
  lng double precision,
  vini text check (char_length(vini) <= 300),
  guidato boolean not null default false,
  -- come ci si arriva: auto, bus (navetta/bus con pickup), treno (mezzi pubblici), piedi
  accesso text[] not null default '{auto}',
  -- [{ "nome": "Firenze, piazzale Montelungo", "lat": 43.77, "lng": 11.24, "orario": "09:30" }]
  pickup jsonb not null default '[]',
  prezzo text check (char_length(prezzo) <= 80),
  link text check (char_length(link) <= 300),
  immagine text check (char_length(immagine) <= 300),
  -- i tre criteri Bevotoscano, dichiarati da chi segnala
  criteri_ok boolean not null default false,
  -- chi organizza (email e telefono non sono mai pubblici)
  org_tipo text check (org_tipo in ('cantina','enoteca','bus','ente','altro')),
  org_nome text not null check (char_length(org_nome) <= 120),
  org_referente text check (char_length(org_referente) <= 80),
  org_email text not null check (char_length(org_email) <= 200 and org_email like '%@%'),
  org_telefono text check (char_length(org_telefono) <= 40),
  org_social text check (char_length(org_social) <= 200),
  note_admin text,
  creato timestamptz not null default now(),
  approvato timestamptz
);
alter table eventi enable row level security;

-- Il sito può solo proporre eventi nuovi, sempre in attesa, mai pubblicati direttamente.
drop policy if exists "segnala evento" on eventi;
create policy "segnala evento" on eventi for insert to anon
  with check (stato = 'in_attesa' and fonte = 'form' and approvato is null and note_admin is null);
drop policy if exists "eventi admin" on eventi;
create policy "eventi admin" on eventi for all to authenticated using (is_admin()) with check (is_admin());

-- Anti-spam lato database: massimo 5 segnalazioni al giorno per email e 30 in tutto all'ora.
create or replace function limita_segnalazioni() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.fonte = 'form' then
    if (select count(*) from eventi where org_email = new.org_email and creato > now() - interval '1 day') >= 5
       or (select count(*) from eventi where fonte = 'form' and creato > now() - interval '1 hour') >= 30 then
      raise exception 'troppe segnalazioni, riprova più tardi';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists limita_segnalazioni on eventi;
create trigger limita_segnalazioni before insert on eventi for each row execute function limita_segnalazioni();

-- Quello che vede il pubblico. Gli eventi spariscono da soli il giorno dopo la fine.
create or replace view eventi_pubblici as
  select id, titolo, descrizione, inizio, fine, altre_date, luogo_nome, indirizzo, comune, lat, lng,
         vini, guidato, accesso, pickup, prezzo, link, immagine, org_tipo, org_nome, org_social
  from eventi
  where stato = 'pubblicato' and coalesce(fine, inizio) > now() - interval '1 day';
grant select on eventi_pubblici to anon, authenticated;


-- ===================== GIOCHI: modalità All Time (novembre 2026) =====================
-- Aggiunge la modalità di gioco alla classifica. Si può rieseguire senza problemi.
alter table punteggi add column if not exists modalita text not null default 'classica';
alter table punteggi drop constraint if exists punteggi_modalita_check;
alter table punteggi add constraint punteggi_modalita_check check (modalita in ('classica', 'alltime'));
alter table punteggi drop constraint if exists punteggi_corrette_check;
alter table punteggi add constraint punteggi_corrette_check check (corrette between 0 and 1000);
alter table punteggi drop constraint if exists punteggi_coerenza_check;
alter table punteggi add constraint punteggi_coerenza_check check (
  (modalita = 'classica' and corrette <= 10 and punti between 0 and 2000)
  or (modalita = 'alltime' and punti = corrette)
);
create index if not exists punteggi_classifica on punteggi (modalita, punti desc);

-- ===================== PROPOSTE (cantine, enoteche…) =====================
-- Dal pulsante "Segnala" dell'app arrivano proposte di cantine ed enoteche.
-- Restano "in_attesa" finché un admin non le approva o le scarta dal gestionale.
create table if not exists proposte (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('cantina','enoteca')),
  stato text not null default 'in_attesa' check (stato in ('in_attesa','approvata','scartata')),
  nome text not null check (char_length(nome) between 2 and 100),
  comune text not null check (char_length(comune) <= 80),
  sito text check (char_length(sito) <= 200),
  ruolo text check (ruolo in ('titolare','cliente')),
  referente text check (char_length(referente) <= 80),
  email text not null check (char_length(email) <= 200 and email like '%@%'),
  note text check (char_length(note) <= 600),
  note_admin text,
  creato timestamptz not null default now(),
  deciso timestamptz
);
alter table proposte enable row level security;
drop policy if exists "nuova proposta" on proposte;
create policy "nuova proposta" on proposte for insert to anon
  with check (stato = 'in_attesa' and note_admin is null and deciso is null);
drop policy if exists "proposte admin" on proposte;
create policy "proposte admin" on proposte for all to authenticated using (is_admin()) with check (is_admin());

create or replace function limita_proposte() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from proposte where email = new.email and creato > now() - interval '1 day') >= 5
     or (select count(*) from proposte where creato > now() - interval '1 hour') >= 30 then
    raise exception 'troppe proposte, riprova più tardi';
  end if;
  return new;
end $$;
drop trigger if exists limita_proposte on proposte;
create trigger limita_proposte before insert on proposte for each row execute function limita_proposte();

-- ===================== SCANNER (vedi docs/SCANNER.md) =====================
-- Le tabelle dello scanner (scanner_attori, notizie, scanner_*) e le sue funzioni le gestisce
-- l'agente ricerca: qui solo le modifiche fatte lato app, già applicate al database il 22/11/2026.

-- Vista pubblica degli eventi: aggiunti in coda i campi nuovi dello scanner.
create or replace view public.eventi_pubblici as
select id, titolo, descrizione, inizio, fine, altre_date, luogo_nome, indirizzo, comune, lat, lng, vini, guidato, accesso, pickup, prezzo, link, immagine, org_tipo, org_nome, org_social,
  orari, provincia, prenotazione, categoria, orario_trovato
from public.eventi
where stato = 'pubblicato' and coalesce(fine, inizio) > now() - interval '1 day';

-- Anti-spam sulle cantine/enoteche segnalate dagli utenti (solo origine = 'segnalazione').
create or replace function public.limita_segnalazioni_attori() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.origine = 'segnalazione' then
    if (new.segnalato_da_email is not null and (select count(*) from scanner_attori
          where origine = 'segnalazione' and lower(segnalato_da_email) = lower(new.segnalato_da_email)
            and creato > now() - interval '1 day') >= 5)
       or (select count(*) from scanner_attori
          where origine = 'segnalazione' and creato > now() - interval '1 hour') >= 30 then
      raise exception 'troppe segnalazioni, riprova più tardi';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.limita_segnalazioni_attori() from public, anon, authenticated;
drop trigger if exists limita_segnalazioni_attori on public.scanner_attori;
create trigger limita_segnalazioni_attori before insert on public.scanner_attori
  for each row execute function public.limita_segnalazioni_attori();
-- ===================== FOTO DAL MODULO SEGNALA (novembre 2026) =====================
-- Chi segnala un evento o propone una cantina/enoteca può allegare una foto o la locandina.
-- Le foto finiscono nella cartella pubblica "segnalazioni" (max 5 MB, solo immagini):
-- il sito può solo caricarle, non cancellarle né elencarle.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('segnalazioni', 'segnalazioni', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "carica foto segnalazioni" on storage.objects;
create policy "carica foto segnalazioni" on storage.objects for insert to anon
  with check (bucket_id = 'segnalazioni');

-- La foto delle cantine ed enoteche proposte, visibile anche nell'elenco pubblico.
alter table scanner_attori add column if not exists foto text check (char_length(foto) <= 300);
create or replace view attori_pubblici as
  select id, nome, tipo, comune, indirizzo, sito, instagram, facebook,
         coalesce(google_maps, 'https://www.google.com/maps/search/?api=1&query=' || replace(replace(nome || ' ' || coalesce(comune, '') || ' Toscana', '&', 'e'), ' ', '+')) as google_maps,
         denominazioni, lat, lng, foto
  from scanner_attori
  where stato = 'approvato' and attivo;

-- ---------- descrizione delle cantine sul sito ----------
alter table scanner_attori add column if not exists descrizione text;

-- parto dalle 4 cantine già approvate che hai inserito tu, che hanno già una nota descrittiva
update scanner_attori set descrizione = note
where origine = 'admin' and stato = 'approvato' and note is not null and descrizione is null;

-- la vista pubblica mostra anche la descrizione (colonna aggiunta in fondo)
create or replace view attori_pubblici as
 SELECT id, nome, tipo, comune, indirizzo, sito, instagram, facebook,
    COALESCE(google_maps, 'https://www.google.com/maps/search/?api=1&query='::text || replace(replace(((nome || ' '::text) || COALESCE(comune, ''::text)) || ' Toscana'::text, '&'::text, 'e'::text), ' '::text, '+'::text)) AS google_maps,
    denominazioni, lat, lng, foto, descrizione
   FROM scanner_attori
  WHERE stato = 'approvato'::text AND attivo;

-- ---------- evento collegato a un articolo del blog ----------
alter table eventi add column if not exists articolo text;

create or replace view eventi_pubblici as
 SELECT id, titolo, descrizione, inizio, fine, altre_date, luogo_nome, indirizzo, comune, lat, lng, vini, guidato, accesso, pickup, prezzo, link, immagine,
    org_tipo, org_nome, org_social, orari, provincia, prenotazione, categoria, orario_trovato, articolo
   FROM eventi
  WHERE stato = 'pubblicato'::text AND COALESCE(fine, inizio) > (now() - '1 day'::interval);
