import { definePreset } from '@primeng/themes';
import Lara from '@primeng/themes/lara';

/**
 * Tema PrimeNG di MAIA (sistema di temi di PrimeNG 18+, design token).
 *
 * Fino a PrimeNG 17 l'app usava il tema CSS "saga-blue", che non esiste piu'.
 * Questo preset parte da Lara e ne riprende l'aspetto: blu Material come colore primario dei
 * componenti, grigi Bootstrap per testi, bordi e superfici, angoli di 3px, spaziature compatte.
 * Il rosso dell'app (--primary-color) resta solo negli stili dell'app, come prima.
 * Vedi src/styles/README-layer.md per l'ordine dei CSS.
 */
/** Colori delle severita' dei pulsanti di saga-blue: [sfondo, hover, active, testo]. */
const SAGA_SEVERITIES: Record<string, [string, string, string, string]> = {
  secondary: ['#607d8b', '#56717d', '#4d646f', '#ffffff'],
  info: ['#0288d1', '#027abc', '#026da7', '#ffffff'],
  success: ['#689f38', '#5e8f32', '#537f2d', '#ffffff'],
  warn: ['#fbc02d', '#fab710', '#e8a704', '#212529'],
  help: ['#9c27b0', '#8c239e', '#7d1f8d', '#ffffff'],
  danger: ['#d32f2f', '#c02929', '#aa2424', '#ffffff'],
};

/** Token del pulsante pieno, outlined e text per ogni severita' (sfondi di hover/active come saga: 4% / 16%). */
function sagaButtonColors() {
  const root: Record<string, object> = {}, outlined: Record<string, object> = {}, text: Record<string, object> = {};
  for (const [sev, [bg, hover, active, color]] of Object.entries(SAGA_SEVERITIES)) {
    root[sev] = { background: bg, hoverBackground: hover, activeBackground: active, borderColor: bg, hoverBorderColor: hover,
      activeBorderColor: active, color, hoverColor: color, activeColor: color };
    const light = `color-mix(in srgb, ${bg} 4%, transparent)`, strong = `color-mix(in srgb, ${bg} 16%, transparent)`;
    outlined[sev] = { hoverBackground: light, activeBackground: strong, borderColor: bg, color: bg };
    text[sev] = { hoverBackground: light, activeBackground: strong, color: bg };
  }
  return { root, outlined, text };
}

export const MaiaPreset = definePreset(Lara, {
  primitive: {
    borderRadius: { none: '0', xs: '2px', sm: '3px', md: '3px', lg: '3px', xl: '3px' },
  },
  semantic: {
    // blu Material (saga-blue: #2196F3)
    primary: {
      50: '#e3f2fd', 100: '#bbdefb', 200: '#90caf9', 300: '#64b5f6', 400: '#42a5f5', 500: '#2196f3',
      600: '#1e88e5', 700: '#1976d2', 800: '#1565c0', 900: '#0d47a1', 950: '#0b3c86',
    },
    formField: {
      paddingX: '0.5rem',
      paddingY: '0.5rem',
    },
    list: {
      padding: '0.5rem 0',
      option: { padding: '0.5rem 1rem' },
      optionGroup: { padding: '0.75rem 1rem' },
    },
    navigation: {
      list: { padding: '0.25rem 0' },
      item: { padding: '0.75rem 1.25rem' },
      submenuLabel: { padding: '0.75rem 1.25rem' },
    },
    overlay: {
      select: { shadow: '0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12)' },
      popover: { shadow: '0 1px 3px rgba(0,0,0,.3)' },
      navigation: { shadow: '0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12)' },
      modal: { shadow: '0 1px 3px rgba(0,0,0,.3)' },
    },
    colorScheme: {
      light: {
        // grigi Bootstrap, gli stessi di saga-blue (#495057 testo, #6c757d secondario, #ced4da bordi dei campi...)
        surface: {
          0: '#ffffff', 50: '#f8f9fa', 100: '#e9ecef', 200: '#dee2e6', 300: '#ced4da', 400: '#adb5bd',
          500: '#6c757d', 600: '#495057', 700: '#495057', 800: '#343a40', 900: '#212529', 950: '#121416',
        },
        primary: { color: '#2196f3', contrastColor: '#ffffff', hoverColor: '#0d89ec', activeColor: '#0b7ad1' },
        highlight: { background: '#e3f2fd', focusBackground: '#cbe7fb', color: '#495057', focusColor: '#495057' },
        focusRing: { shadow: '0 0 0 0.2rem #a6d5fa' },
        // campi disabilitati come saga: sfondo bianco (l'opacita' 0.6 la applica gia' PrimeNG)
        formField: { disabledBackground: '{surface.0}' },
      },
    },
  },
  // Componenti: misure e pesi di PrimeNG 17 dove Lara 18+ e' diverso. Fino a PrimeNG 17 l'app caricava lara-light-blue
  // e poi saga-blue: vinceva saga, ma dove saga non definiva una proprieta' restava Lara 17 (es. etichette in grassetto).
  components: {
    button: {
      root: { paddingX: '1rem', paddingY: '0.5rem', iconOnlyWidth: '2.357rem', label: { fontWeight: '700' },
        sm: { fontSize: '0.875rem', paddingX: '0.875rem', paddingY: '0.4375rem' } },
      colorScheme: { light: sagaButtonColors() },
    },
    tabs: {
      tablist: { borderWidth: '0 0 2px 0', borderColor: '{content.border.color}' },
      tab: { borderWidth: '0 0 2px 0', borderColor: '{content.border.color}', hoverBorderColor: '{text.muted.color}',
        color: '{text.muted.color}', hoverColor: '{text.muted.color}', padding: '1rem', fontWeight: '600', margin: '0 0 -2px 0' },
      tabpanel: { padding: '1rem' },
      activeBar: { height: '0' },
      colorScheme: { light: { tab: { background: '{surface.0}', hoverBackground: '{surface.0}', activeBackground: '{surface.0}' } } },
    },
    datatable: {
      header: { padding: '1rem' },
      headerCell: { padding: '1rem', selectedBackground: '{surface.50}', selectedColor: '{primary.color}' },
      bodyCell: { padding: '1rem' },
      footerCell: { padding: '1rem' },
      footer: { padding: '1rem' },
      columnTitle: { fontWeight: '600' },
      columnFooter: { fontWeight: '600' },
      colorScheme: { light: { root: { borderColor: '{surface.100}' }, row: { stripedBackground: '#fcfcfc' } } },
    },
    treetable: {
      row: { hoverColor: '{content.hover.color}' }, // in Lara 18 punta a un token inesistente
      nodeToggleButton: { size: '2rem' },
      header: { padding: '1rem' },
      headerCell: { padding: '1rem' },
      bodyCell: { padding: '1rem' },
      columnTitle: { fontWeight: '600' },
      colorScheme: { light: { root: { borderColor: '{surface.100}' } } },
    },
    paginator: {
      root: { gap: '0.286rem' },
      navButton: { width: '2.357rem', height: '2.357rem', borderRadius: '3px' },
    },
    checkbox: { root: { width: '20px', height: '20px' }, icon: { size: '14px' } },
    radiobutton: { root: { width: '20px', height: '20px' } },
    panel: {
      root: { background: '{content.background}', color: '{content.color}' }, // mancano in Lara 18
      header: { padding: '1rem', borderRadius: '3px 3px 0 0' },
      toggleableHeader: { padding: '0.5rem 1rem' },
      title: { fontWeight: '600' },
      content: { padding: '1rem' },
      footer: { padding: '1rem' },
    },
    card: {
      root: { shadow: '0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12)' },
      body: { padding: '1rem' },
      title: { fontSize: '1.5rem', fontWeight: '700' },
    },
    menubar: { root: { padding: '0.5rem', gap: '0', borderColor: '{content.border.color}' }, baseItem: { padding: '0.75rem 1rem' },
      submenu: { color: '{content.color}' } }, // submenu.color manca in Lara 18
    menu: { item: { padding: '0.75rem 1.25rem' } },
    tree: { root: { padding: '1rem', gap: '2px' }, node: { padding: '0', gap: '0.5rem' }, nodeToggleButton: { size: '2rem' } },
    slider: { root: { borderRadius: '{content.border.radius}' } }, // manca in Lara 18
    listbox: { list: { header: { padding: '0.5rem 1rem' } } },
    dialog: {
      root: { shadow: '0px 11px 15px -7px rgba(0,0,0,.2), 0px 24px 38px 3px rgba(0,0,0,.14), 0px 9px 46px 8px rgba(0,0,0,.12)' },
      content: { padding: '0 1.5rem 2rem 1.5rem' },
      footer: { padding: '0 1.5rem 1.5rem 1.5rem' },
    },
    fieldset: { root: { padding: '0' }, legend: { padding: '1rem', fontWeight: '600' }, content: { padding: '1rem' } },
    chip: {
      root: { paddingX: '0.5rem', paddingY: '0', gap: '0' },
      colorScheme: { light: { root: { background: '{surface.200}', color: '{text.color}' }, icon: { color: '{text.color}' }, removeIcon: { color: '{text.color}' } } },
    },
    tag: { root: { fontSize: '0.75rem', padding: '0.25rem 0.4rem' } },
    colorpicker: { preview: { width: '2rem', height: '2rem' } },
    toolbar: { root: { padding: '1rem' } },
    togglebutton: {
      root: { padding: '0.5rem 1rem', fontWeight: '700', checkedBackground: '{primary.color}', checkedColor: '{primary.contrast.color}',
        checkedBorderColor: '{primary.color}' },
      icon: { checkedColor: '{primary.contrast.color}' },
      content: { left: '0', top: '0' },
    },
    splitter: { gutter: { background: '{surface.50}' }, colorScheme: { light: { handle: { background: '{surface.200}' } } } },
    tooltip: { root: { padding: '0.5rem' }, colorScheme: { light: { root: { background: '{text.color}' } } } },
    select: { dropdown: { width: '2.357rem' } },
    multiselect: { dropdown: { width: '2.357rem' } },
    treeselect: { dropdown: { width: '2.357rem' } },
    autocomplete: { dropdown: { width: '2.357rem' } },
  },
});
