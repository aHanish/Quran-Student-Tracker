/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#173b32',
    tint: '#246b55',

    // Core surfaces
    background: '#f7f5ed',
    foreground: '#173b32',

    // Cards / elevated surfaces
    card: '#fffdf7',
    cardForeground: '#173b32',

    // Primary action color (buttons, links, active states)
    primary: '#246b55',
    primaryForeground: '#fffdf7',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e9eee6',
    secondaryForeground: '#25483d',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#ecebe2',
    mutedForeground: '#718078',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f0e3c6',
    accentForeground: '#70562d',

    // Destructive actions (delete, error states)
    destructive: '#b94b43',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e2e4d9',
    input: '#d8ddd2',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;
