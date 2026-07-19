# CSD Recall Design System

## 1. Atmosphere & Identity

CSD Recall is a quiet study desk for dense semester materials. The signature is a warm paper workspace with a persistent review queue: the learner always sees what is due now, what is weak, and what subject they are inside.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --surface-primary | #ffffff | #121214 | Page background |
| Surface/secondary | --surface-secondary | #f6f5f4 | #1a1a1e | Sidebars and study bands |
| Surface/elevated | --surface-elevated | #ffffff | #202026 | Cards, toolbar, iframe frame |
| Text/primary | --text-primary | #000000f2 | #f5f5f7 | Headings and primary copy |
| Text/secondary | --text-secondary | #615d59 | #b7b4af | Help text and captions |
| Text/tertiary | --text-tertiary | #a39e98 | #8e8e93 | Muted counters |
| Border/default | --border-default | rgba(0,0,0,0.10) | rgba(255,255,255,0.10) | Cards and separators |
| Border/subtle | --border-subtle | rgba(0,0,0,0.06) | rgba(255,255,255,0.06) | Fine dividers |
| Accent/primary | --accent-primary | #0075de | #4da3ff | Primary action, focus, selected state |
| Accent/hover | --accent-hover | #005bab | #7ab8ff | Hover and active state |
| Status/success | --status-success | #1aae39 | #4ade80 | Known cards |
| Status/warning | --status-warning | #dd5b00 | #f59e0b | Learning cards |
| Status/error | --status-error | #c2410c | #fb7185 | Hard cards |
| Status/info | --status-info | #097fe8 | #62aef0 | Review metadata |

### Rules

Accent blue is reserved for controls and selected learning state. Subject identity comes from text labels, not extra accent colors.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | 48px | 700 | 1.05 | 0 | App title |
| H1 | 36px | 700 | 1.15 | 0 | Current mode title |
| H2 | 26px | 700 | 1.23 | 0 | Panel headings |
| H3 | 22px | 700 | 1.27 | 0 | Card titles |
| Body/lg | 18px | 600 | 1.45 | 0 | Study prompt |
| Body | 16px | 400 | 1.5 | 0 | Default text |
| Body/sm | 14px | 400 | 1.45 | 0 | Secondary UI |
| Caption | 12px | 600 | 1.35 | 0 | Badges and counters |

### Font Stack

- Primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif
- Mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace

## 4. Spacing & Layout

### Base Unit

All spacing derives from 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight icon gaps |
| --space-2 | 8px | Compact controls |
| --space-3 | 12px | Field padding |
| --space-4 | 16px | Standard panel padding |
| --space-5 | 20px | Toolbar rhythm |
| --space-6 | 24px | Card padding |
| --space-8 | 32px | Main grid gap |
| --space-10 | 40px | Study stage padding |

### Grid

- Max content width: 1440px
- Main layout: 280px subject rail, flexible study stage, 320px queue rail
- Breakpoints: 720px collapses rails into stacked panels, 1100px narrows the queue rail

## 5. Components

### Subject Button
- **Structure**: button with course code, title, counters, progress bar
- **Variants**: default, active
- **Spacing**: --space-3 and --space-4
- **States**: hover tonal fill, active press, focus ring
- **Accessibility**: native button with aria-pressed
- **Motion**: 150ms transform and background

### Study Card
- **Structure**: header metadata, prompt face, answer frame, action bar
- **Variants**: front, revealed, empty
- **Spacing**: --space-6 and --space-8
- **States**: revealed toggles iframe visibility, hard/good/easy buttons
- **Accessibility**: keyboard shortcuts and visible focus
- **Motion**: 220ms opacity and transform for reveal

### Review Queue
- **Structure**: due card rows grouped by subject
- **Variants**: due, later, complete
- **Spacing**: --space-3
- **States**: hover selected row, focus ring
- **Accessibility**: buttons expose slide and subject names
- **Motion**: no decorative motion

### Toolbar
- **Structure**: segmented mode controls, search, utility buttons
- **Variants**: learn, review, browse
- **Spacing**: --space-2 and --space-3
- **States**: selected segment, hover, focus
- **Accessibility**: aria-pressed on mode buttons
- **Motion**: 150ms background and transform

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | Button press |
| Standard | 220ms | ease-in-out | Reveal answer, panel switch |
| Emphasis | 360ms | cubic-bezier(0.16, 1, 0.3, 1) | New card entrance |

Only transform and opacity animate. Reduced motion disables transitions that are not needed for state clarity.

## 7. Depth & Surface

### Strategy

Mixed: warm tonal sections plus whisper borders and low-opacity layered shadows.

| Level | Value | Usage |
|-------|-------|-------|
| Whisper border | 1px solid var(--border-default) | Panels and rows |
| Card shadow | 0 4px 18px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03) | Study cards |
| Deep shadow | 0 18px 60px rgba(0,0,0,0.10) | Focused frame |
