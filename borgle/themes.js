// Borgle themes. Two variants; tweakable via color + font.

const BORGLE_THEMES = {
  // Warm & earthy — cream, terracotta, forest (the default)
  hearth: {
    name: 'Hearth',
    '--bg': '#F4EBDD',
    '--bg-2': '#EADFCE',
    '--paper': '#FBF5EA',
    '--ink': '#2A1F1A',
    '--ink-dim': '#5C4A3E',
    '--ink-mute': '#8A7765',
    '--accent': '#C65D3E',        // terracotta
    '--accent-deep': '#9E4526',
    '--accent-soft': '#F2C8B4',
    '--forest': '#3F5E3A',
    '--forest-soft': '#CADBB6',
    '--sun': '#E9A13B',
    '--sun-soft': '#F6D799',
    '--error': '#B8382A',
    '--tile-face': '#FBF5EA',
    '--tile-edge': '#D9C9AE',
    '--tile-ink': '#2A1F1A',
  },
  // Cool variant — cream + teal + coral (NYT-games adjacent)
  grove: {
    name: 'Grove',
    '--bg': '#EEF1E8',
    '--bg-2': '#E3E8DA',
    '--paper': '#F7F9F2',
    '--ink': '#1F2A22',
    '--ink-dim': '#3E5145',
    '--ink-mute': '#718072',
    '--accent': '#E67455',         // coral-orange
    '--accent-deep': '#B9492D',
    '--accent-soft': '#F5CDBC',
    '--forest': '#2B6E5E',         // teal-forest
    '--forest-soft': '#BAD9CE',
    '--sun': '#ECB24F',
    '--sun-soft': '#F6DEA6',
    '--error': '#B8382A',
    '--tile-face': '#F7F9F2',
    '--tile-edge': '#C8D2BD',
    '--tile-ink': '#1F2A22',
  },
};

const BORGLE_FONTS = {
  // Default: rounded display for letters + warm serif for headings + sans for UI
  rounded: {
    name: 'Rounded',
    display: '"Fraunces", Georgia, serif',
    tile: '"Fraunces", Georgia, serif',
    ui: '"Inter Tight", -apple-system, "Helvetica Neue", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    tileWeight: 600,
    displayWeight: 700,
  },
  chunky: {
    name: 'Chunky',
    display: '"Space Grotesk", "Inter Tight", sans-serif',
    tile: '"Space Grotesk", "Inter Tight", sans-serif',
    ui: '"Inter Tight", sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
    tileWeight: 700,
    displayWeight: 700,
  },
  editorial: {
    name: 'Editorial',
    display: '"Playfair Display", "Fraunces", Georgia, serif',
    tile: '"Playfair Display", Georgia, serif',
    ui: '"Inter Tight", sans-serif',
    mono: '"JetBrains Mono", monospace',
    tileWeight: 700,
    displayWeight: 800,
  },
};

function applyBorgleTheme(themeKey, fontKey) {
  const theme = BORGLE_THEMES[themeKey] || BORGLE_THEMES.hearth;
  const font = BORGLE_FONTS[fontKey] || BORGLE_FONTS.rounded;
  const root = document.documentElement;
  for (const k in theme) {
    if (k.startsWith('--')) root.style.setProperty(k, theme[k]);
  }
  root.style.setProperty('--font-display', font.display);
  root.style.setProperty('--font-tile', font.tile);
  root.style.setProperty('--font-ui', font.ui);
  root.style.setProperty('--font-mono', font.mono);
  root.style.setProperty('--tile-weight', font.tileWeight);
  root.style.setProperty('--display-weight', font.displayWeight);
}

window.BorgleThemes = { BORGLE_THEMES, BORGLE_FONTS, applyBorgleTheme };
