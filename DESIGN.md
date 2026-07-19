# CSD Recall Design System

## 1. Atmosphere & Identity

CSD Recall feels like a focused digital flashcard desk: bright, direct, and built around one active card. The signature is a broad white study card floating above a cool lavender workspace, with subject progress always visible before the learner starts reviewing. Quizlet informs the interaction grammar, not the branding or copy.

## 2. Color

### Palette

| Role | Token | Light | Usage |
|------|-------|-------|-------|
| Canvas | --canvas | #f6f7fb | App background |
| Surface | --surface | #ffffff | Header, cards, controls |
| Surface muted | --surface-muted | #edefff | Selected tabs and soft panels |
| Surface hover | --surface-hover | #f1f3f9 | Hover state |
| Text primary | --ink | #282e3e | Headings and main copy |
| Text secondary | --ink-muted | #586380 | Metadata and hints |
| Text tertiary | --ink-faint | #939bb4 | Secondary counters |
| Border | --line | #d9ddea | Dividers and outlines |
| Border strong | --line-strong | #b8bfd3 | Focused secondary controls |
| Accent | --accent | #4255ff | Primary actions and selection |
| Accent hover | --accent-hover | #3143e7 | Hovered primary actions |
| Accent soft | --accent-soft | #e8eaff | Progress and selected surfaces |
| On accent | --on-accent | #ffffff | Text on accent controls |
| Learning | --learning | #ffcd1f | Cards still being learned |
| Hard | --hard | #e64b4b | Cards needing immediate review |
| Known | --known | #2eaf7d | Mastered cards |
| Heatmap empty | --heatmap-empty | #dfe3ee | Unseen heatmap cells |
| Heatmap due | --heatmap-due | #f19898 | Due or hard heatmap cells |
| Heatmap learning | --heatmap-learning | #ffe17a | Learning heatmap cells |
| Heatmap known | --heatmap-known | #70caa4 | Known heatmap cells |
| Heatmap active | --heatmap-active | #282e3e | Current card heatmap cell |
| Shadow | --shadow-color | rgba(46, 54, 84, 0.12) | Elevated study card |
| Shadow strong | --shadow-strong | rgba(46, 54, 84, 0.18) | Hovered study card |

### Rules

- Accent is reserved for active navigation, focus, and the main flip action.
- Hard, learning, and known colors only communicate study status.
- Raw colors must not appear in component rules; extend this table first.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 24px | 700 | 1.25 | 0 | Current set title |
| H2 | 20px | 700 | 1.3 | Section headings |
| H3 | 16px | 700 | 1.35 | Subject names |
| Body large | 18px | 500 | 1.55 | Flashcard answer |
| Body | 16px | 400 | 1.5 | Main UI text |
| Body small | 14px | 500 | 1.45 | Metadata and controls |
| Caption | 12px | 600 | 1.4 | Progress labels |

### Font Stack

- Primary: "Segoe UI", Arial, Helvetica, sans-serif
- Numeric: "SFMono-Regular", Consolas, "Liberation Mono", monospace

### Rules

- Letter spacing remains 0.
- Counts use tabular figures.
- Vietnamese labels use `text-wrap: pretty` where wrapping is possible.

## 4. Spacing & Layout

All spacing derives from a 4px base.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight inline gap |
| --space-2 | 8px | Compact controls |
| --space-3 | 12px | Button and metadata spacing |
| --space-4 | 16px | Standard content padding |
| --space-5 | 20px | Card internal rhythm |
| --space-6 | 24px | Section spacing |
| --space-8 | 32px | Major content separation |
| --space-10 | 40px | Desktop page breathing room |

### Grid

- App header spans the viewport; study content is centered at a 1120px maximum.
- Subject cards form a three-column overview at desktop and a horizontal snap row on narrow screens.
- The flashcard uses a stable 16:9 front and matching back surface.
- Heatmaps use compact fixed cells that wrap on mobile without changing card controls.
- Breakpoints: 760px for compact controls, 980px for subject overview changes.

## 5. Components

### App Header
- **Structure**: brand, set summary, reset command
- **States**: default, hover, active, focus
- **Accessibility**: semantic header and labeled reset button
- **Motion**: micro press feedback only

### Subject Card
- **Structure**: course code, title, remaining count, total count, segmented progress track
- **Variants**: default, active
- **States**: default, hover, active, focus, empty progress
- **Accessibility**: native button with `aria-pressed` and complete progress label
- **Motion**: 140ms transform and surface transition

### Mode Tabs
- **Structure**: three study-mode buttons in a horizontal tab list
- **States**: default, selected, hover, active, focus
- **Accessibility**: `role=tablist`, `role=tab`, and `aria-selected`
- **Motion**: 140ms color and transform feedback

### Flashcard
- **Structure**: progress header, front slide surface, back notes surface, flip hint
- **Variants**: front, revealed, loading, error
- **States**: clickable surface, keyboard flip, focused card
- **Accessibility**: card button announces front/back state; embedded SVG is decorative to the card label
- **Motion**: 320ms 3D rotateY flip; reduced-motion fallback uses opacity

### Progress Heatmap
- **Structure**: small status cells for each subject overview and the active study set
- **Variants**: unseen, due/hard, learning, known, active
- **States**: visual only, summarized by the parent region label
- **Accessibility**: subject-level and active-set summary labels carry the counts
- **Motion**: no decorative motion

### Study Controls
- **Structure**: previous, flip, next, then spaced-repetition grade controls
- **States**: default, hover, active, focus, disabled
- **Accessibility**: native buttons with explicit labels and shortcut hints in `title`
- **Motion**: micro press feedback only

### Review Queue
- **Structure**: compact rows with subject, slide, and due state
- **Variants**: populated, empty
- **States**: default, hover, active, focus, selected
- **Accessibility**: each row is a fully labeled button
- **Motion**: no decorative motion

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 140ms | ease-out | Buttons and tabs |
| Standard | 220ms | ease-in-out | Progress and secondary transitions |
| Emphasis | 320ms | cubic-bezier(0.16, 1, 0.3, 1) | Subject change card entrance |

- Animate only opacity and transform.
- Every interactive element has hover, active, and visible focus states.
- `prefers-reduced-motion` reduces transitions to 1ms.

## 7. Depth & Surface

### Strategy

Mixed: tonal separation for navigation and subject overview, with one elevated study card as the dominant surface.

| Level | Value | Usage |
|-------|-------|-------|
| Hairline | 1px solid var(--line) | Controls and subject cards |
| Low | 0 2px 8px var(--shadow-color) | Active subject and small floating controls |
| Study | 0 12px 32px var(--shadow-color) | Main flashcard |
