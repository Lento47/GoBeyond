---
version: alpha
name: GoBeyond
description: Editorial minimalism meets Caribbean warmth. Clean white surfaces, slate ink, blue accents. Rounded geometry with soft glass textures.
colors:
  primary: "#0f172a"
  secondary: "#475569"
  tertiary: "#1d4ed8"
  neutral: "#fdfdfd"
  neutral-muted: "#f8fafc"
  accent-warm: "#f59e0b"
  success: "#16a34a"
  error: "#dc2626"
typography:
  heading-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 8rem
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  heading-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 4rem
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  heading-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 2rem
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 300
    lineHeight: 1.7
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
  label-xs:
    fontFamily: Inter
    fontSize: 0.625rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.15em"
    textTransform: uppercase
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 48px
  xl: 80px
  section: 128px
components:
  navbar:
    backgroundColor: "rgba(255, 255, 255, 0.72)"
    rounded: "{rounded.full}"
    padding: "16px 32px"
  navbar-glass:
    backgroundColor: "rgba(255, 255, 255, 0.72)"
    backdropFilter: blur(18px)
    border: 1px solid rgba(226, 232, 240, 0.8)
    rounded: "{rounded.full}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: 14px 28px
    typography: "{typography.label-sm}"
  button-primary-hover:
    backgroundColor: "{colors.tertiary}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 14px 28px
    border: 1px solid rgba(226, 232, 240, 0.8)
  card-glass:
    backgroundColor: "rgba(255, 255, 255, 0.72)"
    backdropFilter: blur(18px)
    rounded: "{rounded.xl}"
    border: 1px solid rgba(226, 232, 240, 0.8)
  card-glass-hover:
    transform: translateY(-2px)
    borderColor: "rgba(29, 78, 216, 0.2)"
    boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.08)"
  tag-primary:
    backgroundColor: "rgba(29, 78, 216, 0.08)"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.full}"
    border: 1px solid rgba(29, 78, 216, 0.15)
  card-header-dark:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
  link-nav:
    typography: "{typography.label-xs}"
    textColor: "{colors.secondary}"
  link-nav-active:
    textColor: "{colors.tertiary}"
---

## Overview

GoBeyond is a youth education platform based in Puerto Limon, Costa Rica. The landing page uses **editorial minimalism**: generous white space, bold typographic hierarchy, and a warm blue accent. The design is clean and institutional with subtle depth from glass textures, paper grain, and slow ambient animations.

Tone: Confident, warm, professional. Not cold or corporate — approachable and human.

## Colors

- **Primary (#0f172a):** Deep slate ink for headlines, buttons, and dark card headers. Near-black with blue undertones.
- **Secondary (#475569):** Body text and muted labels. Passes WCAG AA (4.5:1) on white at 14px+.
- **Tertiary (#1d4ed8):** "GoBeyond Blue" — the sole interaction accent. Links, active nav, CTA hover, focus rings. Used sparingly.
- **Neutral (#fdfdfd):** Page background. Slightly warm white — not pure #fff.
- **Neutral muted (#f8fafc):** Card and section backgrounds. Cool tint for contrast against the warm white page.
- **Accent warm (#f59e0b):** Reserved for admin/teacher workspace badges. Not used on public landing.
- **Success (#16a34a) / Error (#dc2626):** Form feedback only.

Never use purple gradients, never apply the tertiary blue as a full-section background — it is an accent, not a canvas.

## Typography

- **Plus Jakarta Sans** for all editorial headings. Geometric with subtle humanist curves. Weight 800 only — headings are always bold.
- **Inter** for body text, buttons, and UI. Weight 300 for large body, 400 for standard, 600–700 for labels.
- **JetBrains Mono** for data labels, benefit numbers, and badge text. Weight 700 only.

Line heights are tight on headings (0.92–0.95), relaxed on body (1.6–1.7).

## Layout & Spacing

- Section vertical padding: `py-32` (128px) — generous breathing room.
- Card internal padding: `p-8` (32px) on glass cards, `p-6` (24px) on smaller cards.
- Navbar: fixed, 64px height, rounded-full, max-w-7xl, 24px from top.
- Grids: 2-col for program details, 3-col for cards/paquetes, 1-col mobile.

## Shapes

All interactive elements use `rounded-full` (9999px). Cards use `rounded-[2rem]` (32px). Inputs use `rounded-2xl` (16px) or `rounded-full`. No sharp corners anywhere — everything feels soft and approachable.

## Components

- **navbar**: Fixed, floating, glass-immersive. Logo left, nav items center (scrollable overflow), Ingresar button right. Mobile: hamburger → full-screen panel.
- **button-primary**: Dark (primary bg), white text, rounded-full. Hover turns blue (tertiary). Used for hero CTAs and Ingresar.
- **button-ghost**: Transparent with slate border. Used for secondary hero CTA.
- **card-glass**: White glass with blur backdrop. Hover lifts 2px with blue border glow. Used everywhere: bento grid, learning paths, testimonials, package cards.
- **tag-primary**: Light blue pill badge for program eyebrows and certification labels.
- **card-header-dark**: Dark gradient card top with initials watermark. Used on package cards only.
- **link-nav**: Small uppercase mono labels. Active state is blue, default is slate-500.
