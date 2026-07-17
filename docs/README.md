# Forager — Design Spec

A calm, warm client for **wandering trails of links** across Semble. Seed a session
with a few links, follow relationships (mutual collections / similar / connected),
and save the walk as a Semble collection.

Reference prototype: [`../trail-browser-prototype.html`](../trail-browser-prototype.html)

## Core concepts

| Concept | Meaning |
|---------|---------|
| **Link card** | A URL shown as a card: thumbnail, title, description, domain. |
| **Seed** | A starting link (1–3). Editable before the walk, **locked** after. |
| **Trail** | One session = its seeds + the ordered path walked. Has title + description. |
| **Pane** | A column of links; panes slide in left→right as you walk. |
| **Walked path** | The ordered links visited, shown in the footer. |
| **Relationship** | Why two links relate — the 3 filter pills: **mutual** (⬡ shared collection), **similar** (≈ semantic), **connected** (↔ typed link). |

## Primary flow

1. **Seed pane** opens with 3 random seeds → cycle (⟳) / remove (×), keep 1–3.
2. **Start wandering** → seeds lock, a **results pane** aggregates relationships from all seeds.
3. Click a link → a **new pane** opens (compact card header + related list).
4. **Footer** shows the path: a grouped **Seeds** chip + one chip per step. Chips *navigate* (scroll); `×` removes a step; selecting a card *appends* to the end.
5. **Left drawer** manages trails (title/description, save as collection, new trail).

## Architecture — three concerns

It's a small client app: **UI ↔ state ↔ API + local storage.** That's the whole picture.

| Concern | Lives in | Responsibility |
|---------|----------|----------------|
| **UI** | `app/`, `components/` | Render state, call actions. No fetching, no business rules. |
| **State** | `lib/useApp.ts` | One `useReducer` holding all trails; persisted to `localStorage`. Exposes actions. |
| **Data** | `lib/api.ts` | One typed `Api` interface → Semble endpoints. Swappable mock. |

**One rule:** components never touch `lib/api.ts` directly — they call actions from
`useApp()`, which call the API. Keeps the UI dumb and the data layer swappable.

## Structure

```
forager/
├─ app/
│  ├─ layout.tsx          # <html> shell + globals.css
│  └─ page.tsx            # the app: useApp() + composes the UI
├─ components/            # presentational, prop-driven
│  ├─ TopBar.tsx
│  ├─ TrailsDrawer.tsx    # trail list, rename, save-as-collection, new
│  ├─ Panes.tsx           # maps state → ordered panes, owns scroll
│  ├─ Pane.tsx            # one pane: header + filter pills + link list
│  ├─ LinkCard.tsx        # list item + compact header + seed variants
│  ├─ Footer.tsx          # walked-path chips (seed group + steps)
│  └─ ui.tsx              # Thumb, IconButton, Toast
├─ lib/
│  ├─ types.ts            # Link, Related, Trail, Rel
│  ├─ api.ts              # Api interface + semble + mock impls
│  ├─ useApp.ts           # reducer + localStorage; all state & actions
│  └─ helpers.ts          # interweave, dedupe, paneOfStep, ids
└─ styles/
   └─ tokens.css          # design tokens (single source)
```

## The other two files

- [`ui.md`](ui.md) — layout, panes, components, styling.
- [`data.md`](data.md) — types, the `Api` interface + Semble mapping, state + storage.
