---
name: TRACKr
description: A loud, tactile neo-brutalist job application tracker on flat warm paper, built to be the opposite of a spreadsheet.
colors:
  signal-blue: "#3B82F6"
  blue-mid: "#93C5FD"
  blue-tint: "#DBEAFE"
  offer-green: "#86EFAC"
  mint: "#D1FAE5"
  green-deep: "#15803D"
  stop-red: "#EF4444"
  red-deep: "#B91C1C"
  ink: "#000000"
  paper: "#F6F4EE"
  card: "#FFFFFF"
  text-body: "#1E293B"
  text-secondary: "#475569"
  text-muted: "#64748B"
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
  button-ghost:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-destructive:
    backgroundColor: "{colors.stop-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.card}"
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
    textColor: "{colors.card}"
    typography: "{typography.label}"
    padding: "16px"
  badge-beta:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  milestone-tile-achieved:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    padding: "12px"
---

# Design System: TRACKr

## Overview

**Creative North Star: "The Loud Spreadsheet Killer"**

TRACKr exists because a 50-column Excel sheet is miserable to live in during a job hunt. The interface answers that by being the opposite of a spreadsheet: heavy black outlines, hard offset shadows, saturated flat color, and a flat warm paper ground with nothing printed on it. Every card, button and column looks like a physical object with an edge, so the work surface feels handled rather than filled in. It is a tool used daily, so the loudness sits in the chrome and the edges, never in the reading: type is plain system sans, content sits on white paper, and color is reserved for meaning.

The voice is confident, high-contrast and encouraging. Copy and visuals both push momentum, not guilt: a missed day is never shown as a loss, empty states invite a next action, and milestones get a rotated "New" stamp instead of confetti. The system is bold because the user's ambition is bold, but it stays orderly enough to scan a board of forty applications.

This system rejects three things: generic Material/SaaS dashboards (soft shadows, pastel gradients, blue-gray chrome), Excel-style grids (dense gridlines, tiny cells, Office toolbars), and glassmorphism (frosted panels, glows, translucent layering).

**Key Characteristics:**
- 2px pure-black outline on nearly everything that is a surface or is interactive.
- Hard, blur-free offset shadows that act as the object's edge, not as ambient depth.
- Three hues only, each with one job: blue is action and progress, green is a good outcome, red is rejection, danger and overdue. Ink and paper do the rest.
- White cards on a flat warm-paper ground. No pattern behind the work; the kanban board draws its own lanes.
- Heavy weights (800 to 900) for headings and labels; system sans only.
- Interaction is physical: elements lift toward you on hover and press into the page on click.

## Colors

"Three Signals": ink, warm paper and white cards, plus blue, green and red with one job each. Colors are flat fills, never blended or gradated. Status reads as a pipeline: a blue ramp that deepens as an application gets closer, then green for an offer or red for a rejection.

### Primary
- **Signal Blue** (#3B82F6): the one action color. Primary buttons, the active navigation item, progress-bar fills, the Interview status, focus rings (at 50% opacity), and the "Job Hunt" headline word. Text on it is always black.
- **Blue Mid** (#93C5FD): Online Assessment, and secondary emphasis on landing tiles.
- **Blue Tint** (#DBEAFE): Applied, informational notices (the verify-email banner, low-confidence autofill), and table-row hover.

### Green
- **Offer Green** (#86EFAC): the Offer status, the offer-rate recap tile, and positive feature tiles. Black text.
- **Mint** (#D1FAE5): completed milestone tiles and every success notice or "ready" state (`NeoNotice`).
- **Green Deep** (#15803D): green text and icons on light grounds (5:1).

### Red
- **Stop Red** (#EF4444): fills for destructive buttons, error alerts, the Rejected status, and the error stat. Text on it is **black** (5.6:1; white would be 3.8:1).
- **Red Deep** (#B91C1C): red *text* on light grounds: overdue dates, inline error messages, the logout label (6.5:1). Never set body-size text in Stop Red itself.

### Neutral
- **Ink** (#000000): every border, every hard shadow, the table header, the BETA pill, and the darkest text. It is the defining color of the system.
- **Paper** (#F6F4EE): the warm ground behind every screen, in the app, on auth pages and on the landing page. Flat, never textured.
- **Card** (#FFFFFF): card, input, table, modal, sidebar and header surfaces.
- **Text Body** (#1E293B) is default text. **Text Secondary** (#475569) for supporting copy and metadata. **Text Muted** (#64748B) only on white (4.8:1); on Paper it is 4.3:1, so use Text Secondary there.

### Semantic
- **Status colors** (single source: `frontend/src/features/applications/statusMeta.ts`; the dashboard tiles, board headers, list chips and detail page all read it, and no screen may define its own): Applied (Blue Tint), Online Assessment (Blue Mid), Interview (Signal Blue), Offer (Offer Green), Rejected (Stop Red). Black text on every one. Labels always come from `STATUS_LABELS`, never the raw enum.
- **Notice vocabulary:** success is Mint, information is Blue Tint, failure is Stop Red (`NeoAlert`). There is no warning color: an overdue follow-up is red text on a white card, and attention is carried by words and an icon, not a fourth hue.

### Named Rules
**The Color-Is-Meaning Rule.** A saturated fill always means something: an action, a status, or danger. Never use accent color as decoration on an app screen.

**The Black-Text-On-Color Rule.** Text on every colored fill is black: Signal Blue, Blue Mid, Offer Green and Stop Red. White text is reserved for black fills (table header, BETA pill, recap header).

**The Three-Hues Rule.** Blue, green and red are the only hues. Do not introduce purple, orange, indigo or yellow; a new meaning is expressed with an icon, a word or a tint of an existing hue.

**The Flat-Fill Rule.** No gradients, no tints-as-glow, no patterned backgrounds.

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

Two shells share one grammar. The **app shell** is a 64px sticky white header with a 2px black bottom rule, a left sidebar that toggles between 96px (icons only) and 256px (icons plus labels), open by default from the `lg` breakpoint, and a main area that scrolls independently over flat Paper (height is the viewport minus the header, using `dvh` with a `vh` fallback). Content sits in a centered `max-w-6xl` column with 16px page padding on mobile and 32px from `md` upward. The sidebar is replaced by a 256px drawer below the `md` (768px) breakpoint. The **landing shell** is an 80px sticky header and full-width sections separated by 2px black rules, each with 96px vertical padding and a centered container.

Spacing follows the 4px Tailwind scale. The working rhythm is 8px inside controls, 12 to 16px between related elements, 24px inside cards, and 32px between dashboard cards (`mb-8`). Card grids use 32px gaps on the landing page and 12px gaps inside dense dashboard tiles. The kanban board is a horizontally scrolling row of columns with 12px gaps.

Density is moderate: generous padding on surfaces, compact 12px to 14px text inside cards so a board stays scannable. Mobile collapses multi-column card layouts to a single column and keeps the board horizontally scrollable.

## Elevation & Depth

Depth is structural, not atmospheric. Every raised surface carries a hard, zero-blur black offset shadow that reads as the object's physical edge; there are no soft or ambient shadows anywhere. Interaction changes the offset: elements lift toward the viewer on hover and press flat into the page on click. Layering beyond that is done with a black 2px outline and a dimmed backdrop (black at 50% with a slight blur) behind modals and drawers.

### Shadow Vocabulary
- **Rest** (`box-shadow: 4px 4px 0 0 #000`): cards, buttons, tables, the floating undo toast, the active nav item.
- **Hover / Lifted** (`6px 6px 0 0 #000` with a -2px x/y translate): buttons on hover (landing feature cards are static); also a dragged kanban card (with a 2-degree rotation).
- **Pressed** (`2px 2px 0 0 #000`, no translate): buttons on `:active`.
- **Small Edge** (`shadow-neo-sm`, `2px 2px 0 0 #000`): small pieces: avatar, eyebrow pills, icon tiles, tiny buttons.
- **Overlay** (`shadow-neo-modal`, `8px 8px 0 0 #000`): the modal and the mobile drawer.

### Named Rules
**The Hard-Edge Rule.** A shadow is either a solid black offset with zero blur, or it is absent. Never introduce a blurred shadow.

**The Reduced-Motion Rule.** With `prefers-reduced-motion`, nothing translates: hover/press lifts stop moving but the hard shadow still grows and shrinks, framer entrances keep only their opacity fade, and pulses go still. State changes must stay visible without movement.

**The Wordmark Rule.** Auth-page wordmarks are Signal Blue with the hard `drop-shadow-neo-sm` (2px, ink). It is the one place a shadow is applied to text.

**The Press Rule.** Interactive means pressable. Anything interactive with a resting shadow must lift on hover and sink on active. Cards keep their resting shadow as their physical edge, but a card only moves if it is itself a link or button.

## Shapes

The form language is blocky with small rounding. The radius rule: 8px (`rounded-lg`) for surfaces and buttons (buttons, cards, tables, the floating toast), 12px (`rounded-neo`) for nav items only, fully round for pills and avatars, and square for fields, modals and milestone tiles. Status chips in tables are the single small exception (2px). Anything else is drift. The recap share card is the one heavier exception: 4px border and 12px radius. Every shape is closed by a 2px solid black border; dashed 2px borders mean empty, unachieved, or "drop here". Tilted stamps (for example the "New" badge at +3 degrees, a dragged card at +2) are the one playful geometry device.

## Components

Character: tactile and unmissable. If it is interactive, it looks like a physical object you can press.

### Buttons
- **Shape:** 8px corners, 2px black border, 12px x 24px padding, bold system sans.
- **Primary:** Signal Blue fill, black text, hard rest shadow. Use `NeoButton` for actions and `NeoLinkButton` for navigation (it renders the same look on a router link); never put a `<button>` inside a `<Link>`.
- **Ghost:** white fill, black 2px border, no resting shadow; it lifts (shadow appears) only on hover. Use it for the quieter action beside a primary: Cancel, Import/Export, Sign In, Copy link, Previous/Next.
- **Destructive:** Stop Red fill, black text.
- **Focus:** keyboard focus draws a 2px Ink (#000) outline with a 2px offset, set once in `index.css` for every link, button, select, checkbox and radio. Inputs keep their blue ring (see Inputs).
- **Hover / Active:** translate (-2px, -2px) with shadow growing 4px to 6px on hover; on active snap back to (0, 0) with the shadow at 2px. Transition is 150ms on all properties. Disabled is 50% opacity with pointer events off.

### Chips and Pills
- **Style:** fully round, 2px black border, small edge shadow for eyebrow pills; bare pills (BETA, column counts) have no shadow. Landing eyebrow pills take a meaning-neutral fill from the blue or green family with black text.
- **BETA badge:** black fill, white text, 12px bold.
- **Status chips:** status-pair fill with matching dark text; in tables they are square-ish (2px radius) with a 2px black border and 12px bold text.
- **New stamp:** Signal Blue, black 2px border, 10px uppercase 900-weight text, rotated +3 degrees, pinned to a tile's corner.

### Cards / Containers
- **Corner Style:** 8px (landing feature cards: 12px).
- **Background:** Paper.
- **Shadow Strategy:** Rest shadow only. A card does not lift unless it is itself a link or button; landing feature cards are static.
- **Border:** 2px black.
- **Internal Padding:** 24px (cards), 12px (kanban cards and milestone tiles), 8px inside kanban columns.

### Inputs / Fields
- **Hint:** `NeoInput` takes a `hint` (quiet 12px help under the field, linked with `aria-describedby`); mark optional fields "(optional)" in the label.
- **Primitives:** `NeoInput`, `NeoSelect` and `NeoTextarea` share one grammar and one focus ring. Every labelled field goes through them; never hand-write the class string. `NeoSelect` renders a bare select when it has no label (toolbars, cards); override size with `className` (for example `w-auto p-2 font-bold`).
- **Style:** white (Card) fill, 2px black border, square corners, 12px x 16px padding, medium weight, grey placeholder. Labels sit above in uppercase tracked bold.
- **Focus:** no outline; a 4px ring in Signal Blue at 50% opacity.
- **Error:** border turns Stop Red, ring turns red at 50%; the message is bold 14px Red Deep below the field and is linked to it (`aria-invalid` + `aria-describedby`). This field-level text is the one sanctioned inline error; a failed *action* uses `NeoAlert`.
- **Disabled:** not specifically styled.

### Navigation
- Sidebar items are 12px-radius, 2px-bordered rows. **Inactive:** Text Muted on transparent with a transparent border. **Hover:** black border and a slate-50 fill. **Active:** Signal Blue fill, black text, black border, rest shadow, and a heavier 2.5px icon stroke. The collapsed sidebar centers icons and exposes labels as tooltips. The header pairs a bold wordmark ("TRACKr." with a BETA pill) with a circular Signal Blue avatar carrying the user's initial. Below `md` a hamburger opens a 256px drawer over a dimmed, blurred backdrop.

### Tables
- The company name is the row's link to the detail page (there is no Actions column). White body inside a black-bordered, shadowed, 8px-rounded frame. A company with an overdue follow-up shows a red-deep "Follow-up due" line with an alert glyph under its name (the same cue as the board). The list shows 15 rows per page with a "Showing x-y of N" count; "Clear filters" sits under the filter bar whenever any filter is active. Header row is solid black with white uppercase tracked text and 16px padding; rows are separated by 2px black rules and turn Blue Tint on hover.

### Landing: Product First
- The hero leads with the real product, not decoration: `ProductPreview` (a small board of fictional sample applications, labelled "Sample data") sits on an offset Signal Blue block (2px ink border, offset 16 to 24px down and right). It reuses the board's lane, header-strip and card styling and reads statuses from `statusMeta`, so it cannot drift from the app. Below `sm` it shows two lanes.
- Landing sections alternate flat Paper and white, separated by the 2px ink rules. No textures.
- **Progress line** (How It Works): three steps climb a staircase, filled Blue Tint, Blue Mid, Signal Blue, joined by a thick ink stepped line that ends in an Offer Green "OFFER" pill. Desktop only; below `md` the steps stack. It echoes the status ramp.
- **Paper stack** (`PaperStack`, built from `SampleApplicationCard`): three tilted sample cards stamped Applied, Interview and Offer. Used only as the first-run dashboard empty state. Decorative and `aria-hidden`; sample names are fictional.

### Modal and Drawer
- The modal is a paper panel (2px black border, `shadow-neo-modal`, square corners) centered over a black 50% backdrop with a slight blur; the mobile menu is the same paper panel pinned left at 256px, sliding in over 200ms (still under reduced motion), with scroll contained inside overlays. Both are real dialogs: `role="dialog"` and `aria-modal`, named by their title (the drawer is "Main menu"), closed by Escape, the close button (labelled "Close dialog" / "Close menu") or a backdrop click. Focus moves in on open, Tab stays inside, and focus returns to the opener on close. The shared behaviour lives in `frontend/src/lib/useDialog.ts`; any new overlay must use it.

### Kanban Board (signature)
- Five status columns drawn as lanes on the paper: a dashed ink-at-40% outline (it turns solid, with a Blue Tint fill, while a card is dragged over it), with a header strip that carries the status fill (see Semantic), an uppercase title, and a white, bordered count pill. Application cards are white, 2px black, 8px rounded, rest-shadowed, with a bold truncated company name, a medium role line, and small 12px bold metadata. A card overdue for follow-up turns its date red and gains an alert glyph. Dragging lifts the card with a hover shadow and a 2-degree tilt, leaves the origin at 40% opacity, and surfaces a bottom-center toast with an Undo action.

- **Move control:** each card ends with a quiet "MOVE TO v" label (uppercase 12px, underlines on hover) over an invisible native select, so keyboards and phone pickers work without a bordered field on every card. It lists the other four stages. Below `sm` the lanes are 75vw wide with proximity scroll-snap, so the next lane peeks as a scroll cue.

### Momentum Card (signature)
- A paper card with a large 900-weight streak number beside a grid of milestone tiles. Achieved tiles are Mint with a solid black border and check icon; unachieved tiles are white with a dashed slate border, a hollow circle, and a 1px-bordered progress bar filled with Signal Blue.

### Footer
- The brand quote and copyright close the landing page and the dashboard only. App screens do not repeat it. On the landing page the footer is a flat full-width band (no radius, no shadow); on the dashboard it is a card. The quote is not italic; italic is not in the type system, and there is no decorative accent rule.

### Loading, Error and Empty States
- **Loading:** `NeoSkeleton`, a pulsing paper block with the same border, radius and shadow as the thing that is loading (dashboard tiles, detail card, board, list, activity, recap, follow-up and momentum cards), with an `sr-only` status line. Never a bare "Loading..." line, and optional cards hold their space so the page does not jump.
- **Error:** a `NeoAlert` with a "Try again" action where a retry makes sense. Never render zeros or blanks for data that failed to load. A missing record says "not found" (404 only); any other failure says it could not load.
- **Empty:** a 2px dashed black box with a plain sentence (a brand-new dashboard leads with this and hides the streak and follow-up cards until there is something to show) (the first-run dashboard replaces the zero tiles with "Track your first application") and, where there is one obvious next step, a link button ("Add your first application"). Empty kanban columns show a small dashed "Nothing here yet" slot.

### Banner and Empty States
- **Notice banner:** Blue Tint, 2px black border, rest shadow, bold text, underlined inline actions. Save confirmations ("Changes saved.", "Added X.") use `NeoNotice`; after saving, focus returns to the page title.
- **Empty state:** Paper, 2px *dashed* black border, centered bold message, no shadow.
- **Success notice** (`NeoNotice`): Achieved Mint fill, black text, `role="status"`, optional Dismiss. For "Added Stripe." after a save and the password-reset confirmations.
- **Error alert** (`NeoAlert`): a failed action. Stop Red fill, black bold text, 2px black border, rest shadow, `role="alert"`. It sits next to the control that failed (above the submit button, above the board, inside the delete modal), names what didn't happen and what state things are in, and clears on the next attempt. For a failed load pass `onRetry` to add a "Try again" action. Use it instead of hand-rolling red banners.

## Do's and Don'ts

### Do:
- **Do** outline every surface and interactive control in 2px solid black (#000).
- **Do** use the hard-edge offset shadows (4px rest, 6px lifted, 2px pressed) and pair them with the lift/press motion.
- **Do** keep text on every colored fill black; use white only on black fills.
- **Do** use weight 800 to 900 for headings and uppercase tracked labels for form, table and column headings.
- **Do** build page structure from white cards on the flat Paper ground, with nothing printed behind them.
- **Do** keep the tone encouraging: frame progress as momentum and never as shortfall or guilt.
- **Do** show a date the user picked (applied, follow-up) with `formatCalendarDay` from `lib/dates.ts`: those are saved as midnight UTC and must not be formatted in the viewer's timezone. Real moments (created at, "2:30 pm") use plain `date-fns` and show in local time.
- **Do** give every page exactly one `h1`: the page title. Auth-page wordmarks are not headings. Announce async swaps (verifying, imported, unsubscribed) with `aria-live` or `role="status"`.
- **Do** make text links black and underlined; on hover fill them with Signal Blue (black text) instead of recolouring the text, which drops contrast.
- **Do** mark the current nav item with `aria-current="page"`, and announce async results (resend sent, link copied, success notices) in a `role="status"` region.
- **Do** keep touch targets at least 44px (use padding, negative margin or `min-h-11`, not a bigger icon) and give every route a title via `RouteTitle`.
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
- Recap share card tiles: interview rate is Blue Mid, offer rate is Offer Green, streak is Blue Tint, the rest are white. Keep new tiles to palette A.
- The recap share card (`rounded-xl`, 4px border) is the one deliberate exception to the radius rule in Shapes; a `rounded-md` remains on the status chips in tables only where Shapes allows it.
- `font-sans` is the only font token; there is no configured webfont, so rendering varies by OS.
