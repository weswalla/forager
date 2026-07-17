# UI — Layout, Components, Styling

## App shell (`app/page.tsx`)

```
┌────────────────────────────────────────────────────────────┐
│ TopBar   [☰]  ✦ Forager · trail browser          [⟲ reset] │
├───────────┬────────────────────────────────────────────────┤
│ Trails    │  Panes  (horizontal scroll, snap)               │
│ Drawer    │  ┌──────┐ ┌──────┐ ┌──────┐                     │
│ (toggle)  │  │ seed │ │result│ │ link │  →→→                │
├───────────┴────────────────────────────────────────────────┤
│ Footer   [ Seeds ] › [ step ]✕ › [ step ]✕ …  (scrolls)     │
└────────────────────────────────────────────────────────────┘
```

Single page (`/`). Navigation between panes is **scroll**, not routing.
Mobile (≤720px): drawer becomes an overlay + scrim; panes ~86vw.

## Panes (one component, three modes)

`Pane` renders a header + `FilterPills` + link list. The header varies by mode:

| Mode | Child index | Header |
|------|-------------|--------|
| **seed** | 0 | "Pick your seed links to begin" + seed cards (⟳/×) + **Start wandering** (locked note after start) |
| **results** | 1 | seed-stack + "Where N seeds lead" |
| **link** | i+2 | compact `LinkCard` header + Open / Save buttons |

Filter pills sit **inside** the header (attached, not floating). `Panes` owns the
ordered list of panes and `scrollToPane(i)`.

## Components (props sketch)

```ts
TopBar({ onToggleDrawer, onReset })
TrailsDrawer({ trails, currentId, onSelect, onNew, onRename, onSaveCollection })
Panes({ state, related, onOpen, onNavigate })          // related: per-pane data from useApp
Pane({ mode, link|seeds, related, filter, onFilter, onOpen, onSeedEdit?, onStart? })
LinkCard({ link, rel?, variant, onClick?, onRemove? })  // variant: 'list'|'header'|'seed'
Footer({ trail, activeStep, onNavigate, onRemoveStep })
Thumb({ palette, emoji, size })                         // gradient placeholder art
IconButton, Toast
```

Interaction rules (from prototype): footer chips **navigate only**; selecting a card
**appends** to the path; seeds **lock** on start; `×` removes one step and re-clamps focus.

## Styling (`styles/tokens.css`)

Feel: calm & warm — cream paper, terracotta/amber accents, soft shadows, serif type.

```css
:root{
  --bg:#f4ece1; --surface:#fbf6ee; --surface-2:#f6eee2;
  --ink:#3d352b; --ink-soft:#6f6455; --ink-faint:#a99d8b; --line:#e4d8c6;
  --accent:#c8734b;   /* terracotta */  --accent-2:#d99a5b; /* amber */
  --sage:#8a9a6f;     /* similar    */  --dusty:#9a8ba8;    /* connected */
  --shadow:0 6px 22px rgba(90,70,45,.10); --radius:16px;
}
```

| Rel | Text / bg / pill |
|-----|------------------|
| mutual | `#a9803f` / `#efe6d3` / `--accent-2` |
| similar | `#5f7040` / `#e6ecdb` / `--sage` |
| connected | `#6f5f86` / `#e9e3ef` / `--dusty` |

- Font: `"Iowan Old Style", Palatino, Georgia, serif`.
- Radii: cards 13, panes 16, pills 20. Motion: pane slide-in ~.34s; hover lift ~.16s.
- Header uses `--surface-2` so the compact card + pills read as one unit.
- CSS Modules per component; tokens global. Respect `prefers-reduced-motion`.
- Keep the prototype's CSS variables verbatim for an easy port.
