# Visual Design Enhancement Plan for SplitBill Web Application

**System Type:** Web Application
**Primary Function:** Splitting bills and expenses among groups or individuals.
**Target Audience:** Friends, roommates, colleagues, or anyone needing to manage shared expenses.

## Recommendations

Here's a breakdown of actionable recommendations to enhance the visual design:

### 1. Layout & Spacing

*   **Refine Structure:**
    *   **Current:** Layout appears functional but might lack strong visual hierarchy.
    *   **Recommendation:** Implement a consistent grid system (e.g., a 12-column grid using Tailwind CSS's grid utilities) for major page sections (header, main content, sidebar/footer if applicable). This will improve alignment and structure.
    *   **Recommendation:** Use clear visual separation for distinct sections (e.g., bill details, participants list, calculation summary) using subtle borders, background color variations (respecting themes), or increased spacing.
*   **White Space:**
    *   **Current:** Potential inconsistency in padding and margins around elements.
    *   **Recommendation:** Increase white space (margins and padding) around key elements like cards, buttons, form fields, and text blocks. Use a consistent spacing scale (e.g., Tailwind's default spacing scale: 4px base unit) for predictable rhythm. `p-4`, `m-6`, `space-y-4` are examples.
*   **Alignment:**
    *   **Current:** Possible minor misalignments.
    *   **Recommendation:** Ensure consistent text and element alignment (left-alignment for text is generally most readable). Use flexbox or grid utilities for precise alignment of items within containers.

**Mermaid Diagram (Conceptual Layout):**

```mermaid
graph TD
    A[Header: Logo, Nav, Theme Toggle] --> B{Main Content Area};
    B --> C[Section 1: Bill Overview/Input];
    B --> D[Section 2: Participants List];
    B --> E[Section 3: Expense Breakdown];
    B --> F[Section 4: Action Buttons];
    A --> G[Footer (Optional): Links, Info];

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
```

### 2. Typography

*   **Font Pairing:**
    *   **Current:** Need to check `css/custom.css` or `tailwind.config.js` for current fonts.
    *   **Recommendation:** Use a modern, readable sans-serif font pairing.
        *   **Headings:** *Poppins* or *Inter* (available on Google Fonts) - slightly bolder weight (e.g., 600 Semibold).
        *   **Body Text:** *Inter* or *Roboto* (available on Google Fonts) - regular weight (400). Ensure good contrast in both themes.
*   **Sizing Scale:**
    *   **Recommendation:** Implement a modular type scale (e.g., using Tailwind's font size utilities: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.). Base body text at `text-base` (typically 16px).
*   **Line Height:**
    *   **Recommendation:** Use appropriate line heights for readability (e.g., `leading-relaxed` or `1.6` for body text, slightly tighter for headings). Tailwind's `leading-` utilities can manage this.
*   **Implementation:** Define these in `tailwind.config.js` or a base CSS file.

### 3. Color Palette

*   **Existing Themes:** Acknowledge the dark and light theme structure. The goal is refinement, not replacement.
*   **Accent Colors:**
    *   **Current:** Check primary accent color usage.
    *   **Recommendation:** Ensure the primary accent color (used for buttons, links, active states) has sufficient contrast (WCAG AA minimum, AAA preferred) against backgrounds in *both* themes. Tools like WebAIM Contrast Checker can help. Consider a slightly desaturated or adjusted primary color if needed.
*   **Neutrals:**
    *   **Current:** Check the range of grays/neutrals used.
    *   **Recommendation:** Refine the neutral palette for both themes. Use a subtle range of grays (e.g., 5-7 shades) for backgrounds, borders, and text. Ensure text colors have adequate contrast against their immediate backgrounds.
        *   *Light Theme:* Very light gray background, dark gray text.
        *   *Dark Theme:* Very dark gray/off-black background, light gray text.
*   **State Colors:**
    *   **Recommendation:** Define clear, accessible colors for states: `success` (green), `error` (red), `warning` (yellow/orange), `info` (blue). Ensure these have good contrast, especially when used with text.

### 4. Iconography

*   **Style Consistency:**
    *   **Current:** Verify if icons have a consistent style.
    *   **Recommendation:** Choose *one* modern, clean icon style:
        *   **Line Icons (Recommended):** Offer a lighter, modern feel (e.g., Tabler Icons, Heroicons Outline).
        *   **Solid Icons:** Can work but ensure they aren't too heavy visually (e.g., Font Awesome Solid, Heroicons Solid).
*   **Library Suggestion:**
    *   **Recommendation:** Use a single, comprehensive, free CDN-hosted library:
        *   **Tabler Icons:** (https://tabler-icons.io/) - Excellent variety of clean line icons. CDN available.
        *   **Material Symbols (Google):** (https://fonts.google.com/icons) - Versatile, customizable (fill, weight, grade, optical size). CDN available.
        *   **Font Awesome Free:** (https://fontawesome.com/) - Popular, wide range, includes solid and regular styles. CDN available.
*   **Implementation:** Replace existing icons systematically. Use SVG or web font versions via CDN links.

### 5. Illustrations/Graphics

*   **Style Definition:**
    *   **Current:** Assess if illustrations are currently used and their style.
    *   **Recommendation:** Adopt a modern, professional, slightly abstract, or character-based vector illustration style that fits the "splitting bills" context (e.g., people collaborating, financial elements). Avoid overly complex or photo-realistic styles.
*   **Source Suggestion:**
    *   **Recommendation:** Use free, CDN-linkable vector illustration libraries:
        *   **unDraw:** (https://undraw.co/illustrations) - Customizable colors, large library, professional look. Direct linking might require hosting the downloaded SVG. Check license.
        *   **Humaaans:** (https://humaaans.com/) - Mix-and-match character illustrations. Check license for direct linking/hosting.
        *   Many other libraries exist (Open Peeps, etc.).
*   **Theme Compatibility:** Choose illustrations where colors can be adapted easily or use styles that work well on both light and dark backgrounds (e.g., outlines with minimal fill, or adaptable color palettes).

### 6. UI Components

*   **Buttons:**
    *   **Recommendation:** Use clear visual hierarchy: Primary action buttons (solid fill, accent color), secondary buttons (outline or subtle fill), tertiary/text buttons. Ensure adequate padding (`py-2 px-4` minimum) and clear hover/active/disabled states consistent across themes. Add subtle transitions.
*   **Forms:**
    *   **Recommendation:** Clean, simple input fields. Ensure clear labels, sufficient spacing between fields, visible focus states (e.g., border color change), and clear validation messages (using state colors). Consistency in styling dropdowns, checkboxes, radio buttons is key.
*   **Cards:**
    *   **Recommendation:** Use cards for distinct content blocks (e.g., individual bills, participant summaries). Apply consistent padding, subtle borders or shadows (adjust shadow intensity for dark/light themes), and clear typographic hierarchy within cards.
*   **Navigation:**
    *   **Recommendation:** Ensure clear indication of the active navigation item. Use appropriate spacing and clean typography. For mobile, consider a standard pattern like a bottom navigation bar or a hamburger menu.

## Next Steps

1.  **Review & Confirm:** User reviews this plan and confirms or requests modifications.
2.  **Save Plan (Optional):** Save this plan to a markdown file if requested.
3.  **Implementation:** Switch to a suitable mode (e.g., "Code") to implement these changes step-by-step, likely starting with `tailwind.config.js`, base CSS, and then component-level refinements.