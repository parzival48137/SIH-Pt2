# Design Brief

## Direction

SITREP — a field instrument panel for high-altitude shelter thermal engineering: dense monospace readouts, hairline-ruled cards, and a cold-to-warm thermal ramp that doubles as the data language.

## Tone

Industrial/utilitarian executed with precision — every pixel earns its place because the user is gloved, in glare or darkness, and reading numbers that decide fuel and lives.

## Differentiation

The thermal ramp is a first-class token set: the same eight-stop cold→warm scale drives temperature charts, scale legends, and the dew-point breach alert, so color always means a physical quantity.

## Color Palette

| Token      | OKLCH            | Role                                            |
| ---------- | ---------------- | ----------------------------------------------- |
| background | 0.17 0.014 250   | Cold night instrument base (primary theme)      |
| foreground | 0.96 0.006 250   | High-contrast readout text                      |
| card       | 0.215 0.016 250  | Panel surfaces, one step up from base           |
| primary    | 0.78 0.13 205    | Instrument cyan — active tabs, rings, key values |
| accent     | 0.79 0.15 72     | Warm amber — target lines, heating, interior temp |
| muted      | 0.26 0.014 250   | Secondary surfaces, inactive states             |
| destructive| 0.62 0.21 27     | Dew-point breach alert only                     |
| thermal-1..8 | 0.42 0.15 262 → 0.63 0.21 30 | Cold→warm data ramp (blue→cyan→green→yellow→red) |

## Typography

- Display: Space Grotesk — screen titles, card headers, verdict labels
- Body: DM Sans — labels, descriptions, controls
- Mono: JetBrains Mono — every measurement, unit, coordinate, and chart axis
- Scale: hero `text-2xl font-bold tracking-tight`, h2 `text-lg font-semibold`, label `text-[10px] font-mono uppercase tracking-[0.14em]`, body `text-sm`, readout `text-2xl font-mono tabular-nums`

## Elevation & Depth

Flat instrument surfaces with hairline borders and a 1px inset top highlight (`shadow-panel`); depth comes from surface lightness steps and inset wells, never from soft glow.

## Structural Zones

| Zone    | Background            | Border               | Notes                                                    |
| ------- | --------------------- | -------------------- | -------------------------------------------------------- |
| Header  | `bg-card` + `shadow-panel` | `border-b`      | Sector/coords in mono, status chip right-aligned          |
| Content | `bg-background`       | —                    | Cards on `bg-card`; alternate grouped sections `bg-muted/30` |
| Alerts  | `bg-destructive/10`   | `border-l-2 destructive` | Dew-point breach banner, no rounding on the rule side |
| Bottom nav | `bg-card`          | `border-t`           | 4 tabs, 56px touch targets, cyan active underline         |

## Spacing & Rhythm

Mobile-first single column with `px-4` gutters and `gap-3` card stacks; sections separated by `mt-6` with uppercase mono section labels; micro-spacing inside readouts is `gap-1` between value and unit.

## Component Patterns

- Buttons: 4px radius, solid `bg-primary` for primary actions, `border` outline for secondary, min 44px height, no pill shapes
- Cards: 4px radius `bg-card` with `border-border` and `shadow-panel`; numeric grids use `surface-inset` wells
- Badges: rectangular 2px radius, mono uppercase 10px, tinted background at 15% with full-strength text

## Motion

- Entrance: `sweep-in` 220ms ease-out on card mount, staggered 40ms across a stack
- Hover/press: `transition-smooth` 180ms on border, background, and ring only — never scale
- Decorative: `alert-pulse` 1.6s on the dew-point breach indicator; no ambient animation elsewhere

## Constraints

- Mobile-first: bottom navigation, 44px minimum touch targets, no hover-only affordances
- All numeric values render in `font-mono tabular-nums` with units in `text-muted-foreground`
- No decorative gradients, no pill radii, no playful color; color encodes physical quantity
- Charts use chart-1..5 + thermal ramp tokens only; no arbitrary hex in components

## Signature Detail

A hairline thermal-ramp strip pinned beneath every temperature chart, with tick marks and mono temperature labels — the app's color legend and its identity mark in one element.
