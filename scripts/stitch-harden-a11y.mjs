import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function screenTitle(filename) {
  return filename
    .replace(/^\d+-/, '')
    .replace(/\.html$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'));
  return match?.[1] ?? '';
}

function addAttribute(attrs, name, value) {
  if (new RegExp(`\\s${name}=`, 'i').test(attrs)) {
    return attrs;
  }
  return `${attrs} ${name}="${value}"`;
}

function accessibleLabelForField(attrs, fallback) {
  const placeholder = attrValue(attrs, 'placeholder');
  const name = attrValue(attrs, 'name');
  const id = attrValue(attrs, 'id');
  const type = attrValue(attrs, 'type');
  return placeholder || name || id || (type === 'checkbox' ? 'Option' : fallback);
}

function addLabelsToFields(html, tagName, fallback) {
  return html.replace(new RegExp(`<${tagName}\\b([^>]*)>`, 'gi'), (match, attrs) => {
    if (/aria-label=|aria-labelledby=|title=/i.test(attrs)) return match;
    const label = accessibleLabelForField(attrs, fallback).replaceAll('"', '&quot;');
    return `<${tagName}${addAttribute(attrs, 'aria-label', label)}>`;
  });
}

function stripText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x?[a-f0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function labelForIconButton(innerHtml) {
  const icon = innerHtml.match(/data-icon=["']([^"']+)["']/i)?.[1] ?? stripText(innerHtml);
  const labels = {
    add: 'Ajouter',
    arrow_back: 'Retour',
    check: 'Valider',
    close: 'Fermer',
    delete: 'Supprimer',
    edit: 'Modifier',
    filter_list: 'Filtrer',
    home: 'Accueil',
    login: 'Connexion',
    menu: 'Menu',
    more_vert: 'Plus d actions',
    notifications: 'Notifications',
    person: 'Profil',
    save: 'Enregistrer',
    search: 'Rechercher',
    tune: 'Filtres',
  };
  return labels[icon] ?? (icon ? icon.replaceAll('_', ' ') : 'Action');
}

function addLabelsToIconButtons(html) {
  return html.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, (match, attrs, innerHtml) => {
    if (/aria-label=|aria-labelledby=|title=/i.test(attrs)) return match;
    const text = stripText(innerHtml).replace(/\b(material symbols outlined|span)\b/gi, '').trim();
    if (text && !/^[a-z_]+$/i.test(text)) return match;
    const label = labelForIconButton(innerHtml).replaceAll('"', '&quot;');
    return `<button${addAttribute(attrs, 'aria-label', label)}>${innerHtml}</button>`;
  });
}

function hardenHtml(html, filename) {
  let output = html;
  const title = `FleetFlow - ${screenTitle(filename)}`;

  output = output.replace(/<html\b([^>]*)>/i, (_match, attrs) => {
    const withoutLang = attrs.replace(/\s+xml:lang=["'][^"']*["']/i, '').replace(/\s+lang=["'][^"']*["']/i, '');
    return `<html${withoutLang} lang="fr">`;
  });

  if (/<title>\s*<\/title>/i.test(output)) {
    output = output.replace(/<title>\s*<\/title>/i, `<title>${title}</title>`);
  } else if (!/<title>/i.test(output)) {
    output = output.replace(/<head>/i, `<head>\n<title>${title}</title>`);
  }

  output = output.replace(/<span\b([^>]*class=["'][^"']*material-symbols[^"']*["'][^>]*)>/gi, (match, attrs) => {
    return `<span${addAttribute(attrs, 'aria-hidden', 'true')}>`;
  });
  output = output.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    return /alt=/i.test(attrs) ? match : `<img${addAttribute(attrs, 'alt', '')}>`;
  });

  output = addLabelsToFields(output, 'input', 'Champ de saisie');
  output = addLabelsToFields(output, 'select', 'Liste de selection');
  output = output.replace(/<textarea\b([^>]*)>/gi, (match, attrs) => {
    if (/aria-label=|aria-labelledby=|title=/i.test(attrs)) return match;
    return `<textarea${addAttribute(attrs, 'aria-label', 'Zone de texte')}>`;
  });
  output = addLabelsToIconButtons(output);

  output = output
    .replace(/<h3\b/gi, '<h2')
    .replace(/<\/h3>/gi, '</h2>')
    .replace(/<h4\b/gi, '<h2')
    .replace(/<\/h4>/gi, '</h2>');

  output = output.replace('</head>', `${aaaCss()}\n</head>`);
  return output;
}

function aaaCss() {
  return `<style id="fleetflow-aaa-overrides">
  :root { color-scheme: dark; }
  html, body { background: #10141b !important; color: #fbfdff !important; }
  body, body * { text-shadow: none !important; }
  body :is(h1,h2,h3,h4,h5,h6,p,span,label,small,div,li,dt,dd,td,th,strong,em,a,button) {
    color: #fbfdff !important;
  }
  body :is(.text-outline,.text-on-surface-variant,.text-slate-400,.text-gray-400,.text-neutral-400,.text-zinc-400),
  body [class*="text-outline"],
  body [class*="text-on-surface-variant"],
  body [class*="text-gray"],
  body [class*="text-slate"],
  body [class*="text-zinc"],
  body [class*="text-neutral"] {
    color: #f8fbff !important;
  }
  body :is(header,main,footer,section,article,nav,form),
  body [class*="bg-background"],
  body [class*="bg-surface"],
  body [class*="bg-[#1C2027]"],
  body [class*="bg-[#030816]"] {
    border-color: #7f8da3 !important;
  }
  body [class*="bg-background"] {
    background-color: #10141b !important;
  }
  body :is(input,select,textarea) {
    background: #050914 !important;
    color: #ffffff !important;
    border: 1px solid #dbeafe !important;
  }
  body :is(input,textarea)::placeholder { color: #f1f5f9 !important; opacity: 1 !important; }
  body button,
  body a[role="button"],
  body [class*="bg-primary"],
  body [class*="bg-secondary-container"],
  body [class*="bg-[#1683F7]"],
  body [class*="bg-[#1683f7]"],
  body [class*="bg-blue"] {
    background-color: #003f8c !important;
    border-color: #bfdbfe !important;
    color: #ffffff !important;
  }
  body [class*="bg-green"],
  body [class*="bg-emerald"] {
    background-color: #064e3b !important;
    color: #ffffff !important;
    border-color: #a7f3d0 !important;
  }
  body [class*="bg-orange"],
  body [class*="bg-amber"],
  body [class*="bg-yellow"],
  body [class*="bg-tertiary"] {
    background-color: #5f2109 !important;
    color: #ffffff !important;
    border-color: #fed7aa !important;
  }
  body [class*="bg-red"],
  body [class*="bg-rose"],
  body [class*="bg-error"],
  body [class*="bg-danger"] {
    background-color: #7f1d1d !important;
    color: #ffffff !important;
    border-color: #fecaca !important;
  }
  body [class*="bg-success"] {
    background-color: #064e3b !important;
    color: #ffffff !important;
    border-color: #a7f3d0 !important;
  }
  body [class*="text-tertiary"],
  body [class*="text-error"],
  body [class*="text-danger"],
  body [class*="text-success"] {
    color: #ffffff !important;
  }
  body .material-symbols-outlined {
    color: #ffffff !important;
    background-color: #0b1220 !important;
    border-radius: 999px !important;
  }
  body :is(a,button,input,select,textarea,[tabindex]):focus-visible {
    outline: 3px solid #bfdbfe !important;
    outline-offset: 3px !important;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>`;
}

async function main() {
  const sourceDir = path.resolve(argValue('dir', path.join(repoRoot, 'docs', 'stitch')));
  const outputDir = path.resolve(argValue('out', path.join(sourceDir, 'aaa')));
  await mkdir(outputDir, { recursive: true });

  const files = (await readdir(sourceDir)).sort();
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const sourcePath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, file);
    if (file === 'index.html') {
      await copyFile(sourcePath, outputPath);
      continue;
    }
    const source = await readFile(sourcePath, 'utf8');
    await writeFile(outputPath, hardenHtml(source, file));
  }

  for (const file of files.filter((name) => name.endsWith('.json'))) {
    await copyFile(path.join(sourceDir, file), path.join(outputDir, file));
  }

  console.log(`AAA-hardened Stitch HTML written to ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
