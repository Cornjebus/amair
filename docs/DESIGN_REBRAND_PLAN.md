# MyAmari Design Rebrand Plan

> **Status:** In Progress
> **Target:** Transform from generic AI SaaS (52/100) to premium cozy-modern family brand (85+/100)
> **Inspiration:** Lovevery - warm, sophisticated, trustworthy

---

## Brand Direction

### Feeling
- **Cozy** - Warm, inviting, bedtime comfort
- **Modern** - Clean, sophisticated, trustworthy
- **Premium** - Worth the investment for your family

### Logo
- Wordmark "amari" in warm serif
- Butterfly replaces dot on "i"
- Charcoal text (#2D3436) + Terracotta butterfly (#E07A5F)

---

## Color Palette

### Light Mode

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--amari-charcoal` | Warm Charcoal | `#2D3436` | Primary text, headings |
| `--amari-terracotta` | Soft Terracotta | `#E07A5F` | Primary CTA, accents |
| `--amari-sage` | Sage Green | `#81B29A` | Success, secondary accent |
| `--amari-cream` | Warm Cream | `#FAF7F2` | Page background |
| `--amari-white` | Soft White | `#FFFFFF` | Cards, surfaces |
| `--amari-muted` | Warm Gray | `#9A8C7D` | Secondary text, borders |
| `--amari-rose` | Dusty Rose | `#D4A5A5` | Subtle highlights |
| `--amari-sand` | Sand | `#E8E2D9` | Borders, dividers |

### Dark Mode (Intentionally Designed)

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--amari-charcoal` | Deep Night | `#1A1D1E` | Page background |
| `--amari-terracotta` | Warm Terracotta | `#E8907A` | Primary CTA (slightly lighter) |
| `--amari-sage` | Soft Sage | `#95C4AC` | Success (slightly lighter) |
| `--amari-cream` | Warm Ivory | `#F5F0E8` | Primary text |
| `--amari-white` | Dark Surface | `#252829` | Cards, surfaces |
| `--amari-muted` | Soft Gray | `#A89F94` | Secondary text |
| `--amari-rose` | Muted Rose | `#C9A3A3` | Subtle highlights |
| `--amari-sand` | Dark Sand | `#3D3A36` | Borders, dividers |

---

## Typography

### Fonts
- **Display:** Fraunces (Google Fonts) - Headlines, hero text
- **Body:** DM Sans (Google Fonts) - Body text, UI elements

### Scale
```
text-xs:   0.75rem  (12px)
text-sm:   0.875rem (14px)
text-base: 1rem     (16px)
text-lg:   1.125rem (18px)
text-xl:   1.25rem  (20px)
text-2xl:  1.5rem   (24px)
text-3xl:  1.875rem (30px)
text-4xl:  2.25rem  (36px)
text-5xl:  3rem     (48px)
text-6xl:  3.75rem  (60px)
```

---

## Component Styles

### Buttons
- **Primary:** Terracotta bg, white text, no shadow, subtle hover darken
- **Secondary:** Transparent, charcoal border, charcoal text
- **Ghost:** No border, charcoal text, subtle hover bg

### Cards
- White background (dark: dark surface)
- 1px sand border (dark: dark sand)
- `rounded-2xl` (16px)
- No shadow (or very subtle warm shadow)

### Inputs
- White background
- Sand border
- `rounded-xl` (12px)
- Terracotta focus ring

---

## Design Principles

1. **Generous whitespace** - Let content breathe
2. **One accent per section** - No rainbow gradients
3. **Warm shadows only** - If any, tinted warm not pure black
4. **No glass morphism** - Solid colors, clean edges
5. **No hover scale** - Subtle color transitions instead
6. **Real imagery** - Product shots, family moments (future)

---

## Phases

### Phase 1: Design Foundation ✅
- [x] New color palette in Tailwind
- [x] New fonts loaded
- [x] Logo extracted and saved
- [x] Favicon created
- [x] CSS custom properties set

### Phase 2: Component Library
- [ ] New button variants
- [ ] New card styles
- [ ] New input styles
- [ ] Typography utilities

### Phase 3: Landing Pages
- [ ] Header with new logo
- [ ] Homepage rebrand
- [ ] Pricing page rebrand
- [ ] Gifts page rebrand
- [ ] Footer rebrand

### Phase 4: App Pages
- [ ] Dashboard rebrand
- [ ] Create page rebrand
- [ ] Stories list rebrand
- [ ] Story detail rebrand
- [ ] Settings rebrand

### Phase 5: Polish
- [ ] Micro-animations
- [ ] Loading states
- [ ] Empty states
- [ ] Success/error states

---

## Testing

- **Visual Regression:** Playwright screenshots
- **Accessibility:** axe-core for color contrast
- **E2E:** Full user flows after each phase
