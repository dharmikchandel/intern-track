---
name: TRACKr
description: A loud, tactile neo-brutalist job application tracker, built to be the opposite of a spreadsheet.
colors:
  signal-blue: "#3B82F6"
  ultraviolet: "#8E51FF"
  hazard-orange: "#F97316"
  indigo-accent: "#6366F1"
  stop-red: "#EF4444"
  ink: "#000000"
  paper: "#FFFFFF"
  desk: "#F1F5F9"
  dot-grid: "#94A3B8"
  text-body: "#1E293B"
  text-secondary: "#475569"
  text-muted: "#64748B"
  highlight-yellow: "#FEF9C3"
  status-applied-bg: "#DBEAFE"
  status-applied-text: "#1E40AF"
  status-oa-text: "#854D0E"
  status-interview-bg: "#F3E8FF"
  status-interview-text: "#6B21A8"
  status-offer-bg: "#86EFAC"
  achieved-mint: "#D1FAE5"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji"
    fontSize: "4.5rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji"
    fontSize: "3rem"
    fontWeight: 900
    lineHeight: 1
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: "1.75rem"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: "1.25rem"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: "1.25rem"
    letterSpacing: "0.025em"
rounded:
  none: "0px"
  md: "6px"
  lg: "8px"
  neo: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.ultraviolet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-destructive:
    backgroundColor: "{colors.stop-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-body}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  nav-item-active:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.ink}"
    rounded: "{rounded.neo}"
    padding: "12px"
  table-head:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    padding: "16px"
  badge-beta:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  milestone-tile-achieved:
    backgroundColor: "{colors.achieved-mint}"
    textColor: "{colors.ink}"
    padding: "12px"
---

# Design System: TRACKr

## Overview

**Creative North Star: "The Loud Spreadsheet Killer"**

TRACKr exists because a 50-column Excel sheet is miserable to live in during a job hunt. The interface answers that by being the opposite of a spreadsheet: heavy black outlines, hard offset shadows, saturated flat color, and a dotted desk behind everything. Every card, button and column looks like a physical object with an edge, so the work surface feels handled rather than filled in. It is a tool used daily, so the loudness sits in the chrome and the edges, never in the reading: type is plain system sans, content sits on white paper, and color is reserved for meaning.

The voice is confident, high-contrast and encouraging. Copy and visuals both push momentum, not guilt: a missed day is never shown as a loss, empty states invite a next action, and milestones get a rotated "New" stamp instead of confetti. The system is bold because the user's ambition is bold, but it stays orderly enough to scan a board of forty applications.

This system rejects three things: generic Material/SaaS dashboards (soft shadows, pastel gradients, blue-gray chrome), Excel-style grids (dense gridlines, tiny cells, Office toolbars), and glassmorphism (frosted panels, glows, translucent layering).

**Key Characteristics:**
- 2px pure-black outline on nearly everything that is a surface or is interactive.
- Hard, blur-free offset shadows that act as the object's edge, not as ambient depth.
- Flat, saturated color fills; color always carries meaning (status, action, danger).
- White paper cards on a pale slate desk with a dot-grid texture.
- Heavy weights (800 to 900) for headings and labels; system sans only.
- Interaction is physical: elements lift toward you on hover and press into the page on click.

## Colors

A restrained neutral base of black ink, white paper and pale-slate desk, carrying a small set of saturated flat accents. Accents are never blended or gradated; they are fills.

### Primary
- **Signal Blue** (#3B82F6): the one action color. Primary buttons, the active navigation item, progress-bar fills, focus rings (at 50% opacity), links that need emphasis, and the "Job Hunt" headline word. Text on it is always black, never white.

### Secondary
- **Ultraviolet** (#8E51FF): the secondary button, secondary link text (login/register links, detail-page links), the tinted eyebrow pill on the hero (at 10%), and the register headline. Used sparingly; it is the second voice, never the first.

### Tertiary
- **Hazard Orange** (#F97316): landing-page eyebrow pills and feature icon tiles only.
- **Indigo Accent** (#6366F1): landing-page eyebrow pills and a feature icon tile. Do not introduce either into the app UI.

### Neutral
- **Ink** (#000000): every border, every hard shadow, the table header, the BETA pill, and the darkest text. It is the defining color of the system.
- **Paper** (#FFFFFF): card, input, table, modal, sidebar and header surfaces.
- **Desk** (#F1F5F9): the page background behind all paper surfaces.
- **Dot Grid** (#94A3B8): the 1px radial dots that texture the app's main area (75% opacity, 24px pitch).
- **Text Body** (#1E293B): default body text. **Text Secondary** (#475569) for supporting copy and metadata; **Text Muted** (#64748B) for inactive nav, placeholders and footnotes.
- **Highlight Yellow** (#FEF9C3): table-row hover, the email verification banner, and the Online Assessment status.

### Semantic
- **Stop Red** (#EF4444): destructive buttons, error text and borders, overdue follow-up indicators, the Rejected column header. White text sits on it.
- **Status pairs** (single source: `frontend/src/features/applications/statusMeta.ts`; the dashboard tiles, board headers, list chips and detail page all read it, and no screen may define its own): Applied (#DBEAFE on #1E40AF), Online Assessment (#FEF9C3 on #854D0E), Interview (#F3E8FF on #6B21A8), Offer (#86EFAC on black), Rejected (Stop Red on white). These tint kanban column headers, dashboard stat tiles and status chips. Labels always come from `STATUS_LABELS`, never the raw enum.
- **Achieved Mint** (#D1FAE5): completed milestone tiles and every success notice or "ready" state. Unachieved tiles are white with a dashed slate border.
- **Notice vocabulary:** success is Achieved Mint, warning or attention (overdue follow-ups, low-confidence autofill, duplicate rows, the verify-email banner, notes) is Highlight Yellow, and failure is Stop Red with white text (`NeoAlert`). Do not use other pale tints (red-50, rose, amber, green-100) for these meanings.

### Named Rules
**The Color-Is-Meaning Rule.** A saturated fill always means something: an action, a status, or danger. Never use accent color as decoration on an app screen.

**The Black-Text-On-Color Rule.** Text on Signal Blue, Ultraviolet and Offer green is black. White text is reserved for Stop Red, black fills (table header, BETA pill) and the small landing eyebrow pills in Hazard Orange or Indigo.

**The Flat-Fill Rule.** No gradients, no tints-as-glow. The only gradient in the product is a transparent fade-out of the hero's dot grid.

## Typography

**Display / Headline / Body Font:** the platform system sans stack (`ui-sans-serif, system-ui, sans-serif` with emoji fallbacks). No webfonts are loaded.
**Label/Mono Font:** same family; a monospace face appears only once, for a technical detail.

**Character:** Hard, heavy and plain. The personality comes from weight and case, not from a typeface: 900-weight headlines, uppercase tracked labels, and medium-weight body that stays out of the way.

### Hierarchy
- **Display** (900, 3rem to 4.5rem at `md`, line-height 1, tracking -0.025em): the landing hero only.
- **Headline** (900, 2.25rem to 3rem, line-height 1): landing section titles and page titles.
- **Title** (900, 1.25rem to 1.5rem, often uppercase): card and modal headings, section headers inside the app.
- **Body** (500 to 700, 0.875rem to 1rem, 1.25rem to 1.5rem line-height): application content and form values. Supporting landing copy scales to 1.25rem at weight 700.
- **Label** (700 to 900, 0.75rem to 0.875rem, tracking 0.025em, uppercase): form labels, table headers, column headers, tile captions.

### Named Rules
**The Heavy-Headings Rule.** All headings are at least weight 800; the dominant weight is 900. Never use light or regular weight for a heading.

**The Stamp-Label Rule.** Labels, table headers and column headers are uppercase and tracked, like stamped text on a physical form.

## Layout

Two shells share one grammar. The **app shell** is a 64px sticky white header with a 2px black bottom rule, a left sidebar that toggles between 96px (icons only) and 256px (icons plus labels), and a main area that scrolls independently over the dot grid. Content sits in a centered `max-w-6xl` column with 16px page padding on mobile and 32px from `md` upward. The sidebar is replaced by a 256px drawer below the `md` (768px) breakpoint. The **landing shell** is an 80px sticky header and full-width sections separated by 2px black rules, each with 96px vertical padding and a centered container.

Spacing follows the 4px Tailwind scale. The working rhythm is 8px inside controls, 12 to 16px between related elements, 24px inside cards, and 32px between dashboard cards (`mb-8`). Card grids use 32px gaps on the landing page and 12px gaps inside dense dashboard tiles. The kanban board is a horizontally scrolling row of columns with 12px gaps.

Density is moderate: generous padding on surfaces, compact 12px to 14px text inside cards so a board stays scannable. Mobile collapses multi-column card layouts to a single column and keeps the board horizontally scrollable.

## Elevation & Depth

Depth is structural, not atmospheric. Every raised surface carries a hard, zero-blur black offset shadow that reads as the object's physical edge; there are no soft or ambient shadows anywhere. Interaction changes the offset: elements lift toward the viewer on hover and press flat into the page on click. Layering beyond that is done with a black 2px outline and a dimmed backdrop (black at 50% with a slight blur) behind modals and drawers.

### Shadow Vocabulary
- **Rest** (`box-shadow: 4px 4px 0 0 #000`): cards, buttons, tables, the floating undo toast, the active nav item.
- **Hover / Lifted** (`6px 6px 0 0 #000` with a -2px x/y translate): buttons and landing feature cards on hover; also a dragged kanban card (with a 2-degree rotation).
- **Pressed** (`2px 2px 0 0 #000`, no translate): buttons on `:active`.
- **Small Edge** (`shadow-neo-sm`, `2px 2px 0 0 #000`): small pieces: avatar, eyebrow pills, icon tiles, tiny buttons.
- **Overlay** (`shadow-neo-modal`, `8px 8px 0 0 #000`): the modal and the mobile drawer.

### Named Rules
**The Hard-Edge Rule.** A shadow is either a solid black offset with zero blur, or it is absent. Never introduce a blurred shadow.

**The Press Rule.** Interactive means pressable. Anything interactive with a resting shadow must lift on hover and sink on active. Cards keep their resting shadow as their physical edge, but a card only moves if it is itself a link or button.

## Shapes

The form language is blocky with small rounding. The radius rule: 8px (`rounded-lg`) for surfaces and buttons (buttons, cards, tables, the floating toast), 12px (`rounded-neo`) for nav items only, fully round for pills and avatars, and square for fields, modals and milestone tiles. Status chips in tables are the single small exception (2px). Anything else is drift. The recap share card is the one heavier exception: 4px border and 12px radius. Every shape is closed by a 2px solid black border; dashed 2px borders mean empty, unachieved, or "drop here". Tilted stamps (for example the "New" badge at +3 degrees, a dragged card at +2) are the one playful geometry device.

## Components

Character: tactile and unmissable. If it is interactive, it looks like a physical object you can press.

### Buttons
- **Shape:** 8px corners, 2px black border, 12px x 24px padding, bold system sans.
- **Primary:** Signal Blue fill, black text, hard rest shadow. Use `NeoButton` for actions and `NeoLinkButton` for navigation (it renders the same look on a router link); never put a `<button>` inside a `<Link>`.
- **Secondary:** Ultraviolet fill, black text.
- **Destructive:** Stop Red fill, white text.
- **Focus:** keyboard focus draws a 2px Ink (#000) outline with a 2px offset, set once in `index.css` for every link, button, select, checkbox and radio. Inputs keep their blue ring (see Inputs).
- **Hover / Active:** translate (-2px, -2px) with shadow growing 4px to 6px on hover; on active snap back to (0, 0) with the shadow at 2px. Transition is 150ms on all properties. Disabled is 50% opacity with pointer events off.

### Chips and Pills
- **Style:** fully round, 2px black border, small edge shadow for eyebrow pills; bare pills (BETA, column counts) have no shadow. Landing eyebrow pills take a meaning-neutral accent fill (Hazard Orange or Indigo) with white text.
- **BETA badge:** black fill, white text, 12px bold.
- **Status chips:** status-pair fill with matching dark text; in tables they are square-ish (2px radius) with a 2px black border and 12px bold text.
- **New stamp:** Signal Blue, black 2px border, 10px uppercase 900-weight text, rotated +3 degrees, pinned to a tile's corner.

### Cards / Containers
- **Corner Style:** 8px (landing feature cards: 12px).
- **Background:** Paper.
- **Shadow Strategy:** Rest shadow; landing feature cards lift on hover.
- **Border:** 2px black.
- **Internal Padding:** 24px (cards), 12px (kanban cards and milestone tiles), 8px inside kanban columns.

### Inputs / Fields
- **Primitives:** `NeoInput`, `NeoSelect` and `NeoTextarea` share one grammar and one focus ring. Every labelled field goes through them; never hand-write the class string. `NeoSelect` renders a bare select when it has no label (toolbars, cards); override size with `className` (for example `w-auto p-2 font-bold`).
- **Style:** Paper fill, 2px black border, square corners, 12px x 16px padding, medium weight, grey placeholder. Labels sit above in uppercase tracked bold.
- **Focus:** no outline; a 4px ring in Signal Blue at 50% opacity.
- **Error:** border and message turn Stop Red, ring turns red at 50%; message is bold 14px below the field.
- **Disabled:** not specifically styled.

### Navigation
- Sidebar items are 12px-radius, 2px-bordered rows. **Inactive:** Text Muted on transparent with a transparent border. **Hover:** black border and a slate-50 fill. **Active:** Signal Blue fill, black text, black border, rest shadow, and a heavier 2.5px icon stroke. The collapsed sidebar centers icons and exposes labels as tooltips. The header pairs a bold wordmark ("TRACKr." with a BETA pill) with a circular Signal Blue avatar carrying the user's initial. Below `md` a hamburger opens a 256px drawer over a dimmed, blurred backdrop.

### Tables
- The company name is the row's link to the detail page (there is no Actions column). Paper body inside a black-bordered, shadowed, 8px-rounded frame. Header row is solid black with white uppercase tracked text and 16px padding; rows are separated by 2px black rules and turn Highlight Yellow on hover.

### Modal and Drawer
- The modal is a paper panel (2px black border, `shadow-neo-modal`, square corners) centered over a black 50% backdrop with a slight blur; the mobile menu is the same paper panel pinned left at 256px. Both are real dialogs: `role="dialog"` and `aria-modal`, named by their title (the drawer is "Main menu"), closed by Escape, the close button (labelled "Close dialog" / "Close menu") or a backdrop click. Focus moves in on open, Tab stays inside, and focus returns to the opener on close. The shared behaviour lives in `frontend/src/lib/useDialog.ts`; any new overlay must use it.

### Kanban Board (signature)
- Five status columns, each a bordered container whose header strip carries the status fill (see Semantic), an uppercase title, and a white, bordered count pill. Application cards are white, 2px black, 8px rounded, rest-shadowed, with a bold truncated company name, a medium role line, and small 12px bold metadata. A card overdue for follow-up turns its date red and gains an alert glyph. Dragging lifts the card with a hover shadow and a 2-degree tilt, leaves the origin at 40% opacity, and surfaces a bottom-center toast with an Undo action.

### Momentum Card (signature)
- A paper card with a large 900-weight streak number beside a grid of milestone tiles. Achieved tiles are Achieved Mint with a solid black border and check icon; unachieved tiles are white with a dashed slate border, a hollow circle, and a 1px-bordered progress bar filled with Signal Blue.

### Banner and Empty States
- **Notice banner:** Highlight Yellow, 2px black border, rest shadow, bold text, underlined inline actions.
- **Empty state:** Paper, 2px *dashed* black border, centered bold message, no shadow.
- **Error alert** (`NeoAlert`): a failed action. Stop Red fill, white bold text, 2px black border, rest shadow, `role="alert"`. It sits next to the control that failed (above the submit button, above the board, inside the delete modal), names what didn't happen and what state things are in, and clears on the next attempt. Use it instead of hand-rolling red banners.

## Do's and Don'ts

### Do:
- **Do** outline every surface and interactive control in 2px solid black (#000).
- **Do** use the hard-edge offset shadows (4px rest, 6px lifted, 2px pressed) and pair them with the lift/press motion.
- **Do** keep text on Signal Blue, Ultraviolet and Offer green black; use white only on Stop Red, black fills, and the landing eyebrow pills.
- **Do** use weight 800 to 900 for headings and uppercase tracked labels for form, table and column headings.
- **Do** build page structure from paper cards on the Desk background with the dot grid behind them.
- **Do** keep the tone encouraging: frame progress as momentum and never as shortfall or guilt.
- **Do** rely on the global 2px Ink focus outline for links and buttons; never suppress it with `outline-none` unless the control supplies its own visible ring.
- **Do** give every icon-only control an `aria-label` and every form control a `<label htmlFor>`; build overlays on `useDialog`.
- **Do** use dashed 2px borders to mean "empty", "unachieved" or "drop target".

### Don't:
- **Don't** make it look like a generic Material/SaaS dashboard: no soft shadows, pastel gradients, `rounded-2xl` cards or blue-gray chrome.
- **Don't** make it look like Excel: no dense gridlines, tiny cells, or office-style toolbars.
- **Don't** use glassmorphism: no frosted panels, glows, or translucent layered cards. The only blur in the system is the dimmed modal and drawer backdrop.
- **Don't** add blurred or spread shadows, gradients, or any color fill that doesn't carry meaning.
- **Don't** set body text in a light or regular weight, or swap in a decorative display face.
- **Don't** make a non-interactive card lift on hover, or leave an interactive raised element without its hover-lift and press-in.

### Known drift (not system)
These are inconsistencies found in the code. Treat them as bugs to resolve, not patterns to copy.
- Recap share card tiles: interview rate uses the Interview status purple and offer rate Offer green; the other tiles are Highlight Yellow or paper. Keep new tiles to that rule.
- Some code still breaks the radius rule in Shapes: `rounded-md` overrides on small buttons and the notice banner, and the recap share card (`rounded-xl`, 4px border).
- Shadows are still inlined as arbitrary values in places (`shadow-[2px_2px_0px_rgba(0,0,0,1)]`) instead of `shadow-neo-sm`. They match the tokens visually; swap them when touched.
- White text on Stop Red (#EF4444) is about 3.8:1, below WCAG AA for normal-size text; it is acceptable only at bold or large sizes.
- The landing hero uses a rocket emoji in its eyebrow; the app UI uses Lucide icons only.
- `font-sans` is the only font token; there is no configured webfont, so rendering varies by OS.
