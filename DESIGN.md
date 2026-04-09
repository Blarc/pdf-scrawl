# Design System Specification: The Fluid Architect

## 1. Overview & Creative North Star
**Creative North Star: The Living Blueprint**
This design system rejects the "static document" feel of traditional PDF readers. Instead, it treats the collaborative workspace as a **Living Blueprint**—a sophisticated, high-density environment where professional precision meets the raw, kinetic energy of human ideation.

The aesthetic strategy is **High-End Editorial Engineering**. We balance the "Authority" of deep blues and architectural grays with the "Invention" of vibrant annotation colors. We break the "template" look by using intentional white space, layered surfaces, and a typography scale that feels curated rather than generated.

---

## 2. Colors & Surface Philosophy

The palette is bifurcated: a grounded, stable UI framework and a high-chroma "Annotation Layer."

### The Surface Hierarchy (The "No-Line" Rule)
**Strict Mandate:** Prohibit 1px solid borders for sectioning. Boundaries are defined by background color shifts or tonal transitions.
- **Base Layer:** `surface` (#fbf9f8) is the canvas.
- **The Workspace:** The main PDF viewing area sits on `surface_container_lowest` (#ffffff) to maximize contrast.
- **The Navigation/Toolbars:** Use `surface_container` (#efeded) to distinguish utility from content.
- **Floating Panels:** Sidebar comments and activity feeds use `surface_bright` (#fbf9f8) with a 20px backdrop blur (Glassmorphism) to feel lightweight and integrated.

### The "Glass & Gradient" Rule
Main CTAs (like 'Share') must not be flat. Use a subtle linear gradient from `primary` (#00488d) to `primary_container` (#005fb8) at a 135° angle. This adds a "jewel" quality to high-priority actions.

### Annotation Tokens (The 'Scrawl' Palette)
- **Highlighter:** `tertiary_fixed` (#e4ec00) - Use with 40% opacity for text overlays.
- **Urgent Markup:** `error` (#ba1a1a) - For critical corrections.
- **System Action:** `primary_fixed` (#d6e3ff) - For collaborative cursors and selection boxes.

---

## 3. Typography: Editorial Authority

We use a triple-font strategy to distinguish between UI utility, document structure, and "human" elements.

*   **The Architect (Manrope):** Used for `display` and `headline` levels. Its geometric precision conveys professional confidence.
*   **The Utility (Inter):** Used for `title` and `body`. Chosen for its unparalleled legibility in high-density data environments (like comment sidebars).
*   **The Human (Plus Jakarta Sans):** Reserved for `label` and "random fun names" (collaborator aliases). This adds a playful, approachable touch to the collaborative aspect.

**Scale Highlights:**
- **Display-LG:** `manrope`, 3.5rem (Use for empty state headlines or splash screens).
- **Title-SM:** `inter`, 1rem (Primary UI text for tool labels).
- **Label-SM:** `plusJakartaSans`, 0.6875rem (Usernames in the activity feed).

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too heavy for a high-density editor. We achieve depth through **Tonal Layering** and **Ambient Light.**

- **The Layering Principle:** Instead of a shadow, place a `surface_container_highest` (#e4e2e2) element inside a `surface_container_low` (#f5f3f3) zone. The shift in value creates a "recessed" or "lifted" feel naturally.
- **Ambient Shadows:** For floating toolbars, use a shadow with a 32px blur, 0% spread, and 6% opacity of the `on_surface` color. It should feel like a soft glow, not a dark edge.
- **The Ghost Border:** If a boundary is required for accessibility (e.g., input fields), use `outline_variant` at 15% opacity. Never use 100% opaque lines.
- **Glassmorphism:** All floating menus must use `surface_container_lowest` at 85% opacity with a `12px` backdrop blur to prevent the UI from feeling "pasted" over the PDF content.

---

## 5. Components

### The "Precision" Toolbar (Drawing Tools)
- **Styling:** A vertical floating bar using the Glassmorphism rule. 
- **States:** Selected tools use `primary_fixed` (#d6e3ff) as a background "pill" shape (Radius: `full`) to indicate the active state.
- **Icons:** Sharp, 1.5px stroke weight.

### Action Buttons
- **Primary:** Gradient (`primary` to `primary_container`), `xl` (1.5rem) rounded corners.
- **Secondary:** Transparent background with a "Ghost Border" (20% `outline`).
- **Tertiary:** Pure text using `on_secondary_container` color for low-priority utility.

### Collaborative Sidebar (Activity Feed)
- **Structure:** No dividers. Use `spacing.8` (1.75rem) of vertical white space between comment threads.
- **Comment Cards:** Use `surface_container_low` for the card body. On hover, transition to `surface_container_high`.
- **User Chips:** `plusJakartaSans` font, `sm` (0.25rem) radius, using `secondary_fixed` (#c9e6fd) backgrounds.

### Inputs & Search
- **Style:** Understated. `surface_container_highest` background with a `sm` bottom-only radius to mimic a "ledger" feel.

---

## 6. Do's and Don'ts

### Do
- **Maximize the Canvas:** Use "Auto-hide" logic for sidebars to prioritize the PDF viewing area.
- **Use Intentional Asymmetry:** Align the "Share" button to a unique grid line to make it stand out from the utility tools.
- **Color with Purpose:** Use the vibrant 'scrawl' colors only for user-generated content; keep the system UI strictly in the professional blues/grays.

### Don't
- **Don't use 1px dividers.** Use background color steps (e.g., `surface` to `surface_container_low`).
- **Don't use pure black.** Always use `on_surface` (#1b1c1c) for text to maintain a premium, ink-on-paper feel.
- **Don't use sharp corners.** Everything must follow the `0.5rem` (DEFAULT) or `1rem` (lg) rounding scale to maintain a friendly, accessible atmosphere.
- **Don't clutter the editor.** If a tool isn't used frequently, tuck it into a "More" menu using `surface_bright` glassmorphism.

---

## 7. Spacing & Density
This system utilizes a **High-Density Logic**. 
- In the **Editor**, use `spacing.2` (0.4rem) for internal component padding to maximize screen real estate.
- In the **Marketing/Landing** areas, use `spacing.16` (3.5rem) to let the editorial typography breathe.