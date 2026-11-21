import { go } from "./nav.js";

// Un link vero (<a href>) che Google può seguire, ma che nell'app cambia pagina
// senza ricaricare. Ctrl/Cmd+clic apre in una nuova scheda come al solito.
export default function Link({ to, onClick, children, ...resto }) {
  const href = to === "home" || to === "" ? "/" : `/${to}`;
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
      {...resto}
    >
      {children}
    </a>
  );
}
