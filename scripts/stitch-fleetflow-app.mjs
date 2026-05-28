import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stitch, StitchError } from '@google/stitch-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const stitchRoot = path.join(repoRoot, 'docs', 'stitch');

const FOUNDATION = `
FleetFlow / Kinetic logistics recruitment product.
Design a professional production MVP, not a marketing site.
Visual system: dark app UI, #10141b background, #030816 app/header, #1c2027 cards,
#242a34 raised surfaces, #3b4352 borders, #1683f7 primary blue, #4a8eff secondary blue,
clear orange warning, red danger, green success. High contrast RGAA/WCAG AA.
Typography: Inter/system, compact but breathable, no negative letter spacing.
Layout: mobile-first patterns that scale to a desktop app shell. Buttons must be explicit.
Accessibility: visible focus, real labels, readable error states, keyboard-friendly controls.
Avoid fake stock-photo atmosphere, gradient blobs, decorative clutter, huge hero sections.
Use realistic logistics/recruitment content labels only to demonstrate layout.
`;

const SCREENS = [
  {
    slug: '01-login',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create the login page. Centered FleetFlow logo, compact auth card that fits without scrolling
on a laptop viewport, dark autofill-safe inputs, email/password, remember me, forgot password,
primary Log in CTA, request access link, footer version V 0.0.0 "KINETIC" // SYSTEM_ACTIVE.
Professional proportions, generous spacing, no oversized card.
`,
  },
  {
    slug: '02-admin-dashboard',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create the Admin_Command dashboard desktop screen. Sidebar navigation with Dashboard, Contacts,
Tests, Jobs, Roles. Top app bar with search and profile. Main content: KPI cards in a compact grid,
recent inflow and test validation queue side by side, job activity overview, empty/loading/error
state treatment hints. Dense but calm desktop application layout.
`,
  },
  {
    slug: '03-contacts-directory',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create the contacts/personnel directory screen for admin/RH. Sidebar retained. Search and filters
for all/chauffeurs/candidats/managers, list/table hybrid of people, create contact CTA,
role/status chips, safe edit affordances. Include a right details drawer preview with personal
details, credentials, actions Call/Message/Edit Role.
`,
  },
  {
    slug: '04-tests-validation',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create the Tests admin page. Tabs Tests / Templates, search, filters by status/candidate/job/template/manager.
List all tests including in progress, completed, validated, rejected. Each card/row shows candidate,
job, template, progress, sections completed, status, and actions: View dossier, Relaunch, Validate, Reject.
Clear distinction between primary and secondary actions.
`,
  },
  {
    slug: '05-template-pool-question-editor',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create the template builder workflow screen. Left column: template basic info, duration, difficulty,
passing score. Middle: sections stacked with attached question pools. Right: pool/question editor panel.
Question types: free text, yes/no, true/false, rating, multiple choice, practical. Show correct answer
selection, eliminatory toggle, max points scaled to 100, manager comment field behavior. Include Add Pool
bottom sheet/modal visual.
`,
  },
  {
    slug: '06-jobs-applicants',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create Jobs and applicants management screen. Job list left or top with search/filters; selected job detail
with tabs Applicants / Details / Settings. Applicants table/cards show candidate, status, test score,
tests completed button in green, Launch Test, View Profile. Include safe empty state and clear disabled
state when a test is already in progress.
`,
  },
  {
    slug: '07-launch-evaluation',
    device: 'MOBILE',
    prompt: `
${FOUNDATION}
Create mobile Launch Evaluation screen. Back app bar. Title "Lancement du Test". Template summary,
progress of configuration, section cards for modules like Conduite de Nuit, Habilitation Hazmat,
Inspection Mecanique. Each section has points/duration and manager assignment select. Sticky bottom
CTA "Lancer l'evaluation" disabled until each required manager is selected.
`,
  },
  {
    slug: '08-manager-dashboard',
    device: 'MOBILE',
    prompt: `
${FOUNDATION}
Create Manager mobile dashboard. Header DriverRecruit, greeting, today's assigned tests, critical alerts,
local follow-up card, metrics cards, bottom nav Home Jobs Tests Profile. Manager only sees tests/sections
assigned to them. Strong mobile spacing, no cramped text.
`,
  },
  {
    slug: '09-manager-questionnaire',
    device: 'MOBILE',
    prompt: `
${FOUNDATION}
Create Manager questionnaire screen for evaluating a driver. Candidate header, current score, sections assigned
to this manager only. Questions support rating stars, yes/no, true/false, QCM, free text with manual score,
question comments, section comments, global observations, save draft, submit evaluation. Make errors clear:
"Champ obligatoire".
`,
  },
  {
    slug: '10-candidate-public-jobs',
    device: 'MOBILE',
    prompt: `
${FOUNDATION}
Create Candidate public jobs screen. Public job offers visible without login. Header Recrutement Routier,
search/filter cards, premium job cards with salary, location, contract, equipment, save icon, view details.
Bottom nav Offres / Candidatures / Tests / Profil, protected tabs open login modal if not authenticated.
`,
  },
  {
    slug: '11-candidate-applications-tests',
    device: 'MOBILE',
    prompt: `
${FOUNDATION}
Create Candidate dashboard/applications/tests screen. Candidate profile summary, application progress cards,
assigned tests, statuses entretien/test en cours/rejete, clear CTAs Acceder au test or Voir detail.
If no data, use a polished empty state without fake backend content.
`,
  },
  {
    slug: '12-test-assessment-detail',
    device: 'DESKTOP',
    prompt: `
${FOUNDATION}
Create admin/direction Test Assessment detail. Top summary score and candidate/job/template. Sections stacked
as accordions; opening a section reveals all responses, correct answers, manager comments, automatic score,
manual override, eliminatory markers. Global evaluator feedback below final section. Bottom actions:
Validate, Request retest, Reject candidate. Avoid compact cramped text.
`,
  },
];

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function projectIdFrom(result) {
  return (
    result?.projectId ??
    result?.project_id ??
    result?.project?.projectId ??
    result?.project?.id ??
    result?.id ??
    (typeof result?.name === 'string' ? result.name.replace(/^projects\//, '') : undefined)
  );
}

async function download(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

function htmlIndex({ title, projectId, screens }) {
  const cards = screens
    .map(
      (screen) => `
      <article>
        <h2>${screen.slug}</h2>
        <p>${screen.device} · Screen ${screen.screenId}</p>
        <a href="./${screen.htmlFile}">Open HTML</a>
        <img src="./${screen.imageFile}" alt="${screen.slug}" />
      </article>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin: 0; background: #0d1118; color: #f7f9ff; font-family: Inter, system-ui, sans-serif; }
    header { position: sticky; top: 0; z-index: 2; background: rgba(3, 8, 22, .92); border-bottom: 1px solid #263145; padding: 20px 28px; backdrop-filter: blur(16px); }
    h1 { margin: 0; font-size: 24px; }
    p { color: #aeb8ca; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; padding: 28px; }
    article { border: 1px solid #344052; border-radius: 18px; background: #171d26; padding: 18px; box-shadow: 0 22px 60px rgba(0,0,0,.32); }
    h2 { margin: 0 0 6px; font-size: 18px; }
    a { color: #74afff; font-weight: 800; }
    img { display: block; width: 100%; margin-top: 14px; border-radius: 12px; border: 1px solid #2b3546; background: #0b1018; }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <p>Project ${projectId} · ${screens.length} Stitch screens</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    throw new Error('STITCH_API_KEY is missing. Set it locally before running this script.');
  }

  const title = argValue('title', 'FleetFlow Complete App Design');
  const forceDevice = argValue('forceDevice', '');
  const deviceInstruction =
    forceDevice === 'MOBILE'
      ? '\nAdditional hard requirement: generate this as a 390px wide mobile app screen preview with bottom navigation when relevant, no desktop sidebar, no horizontal overflow, readable touch targets.\n'
      : '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folderPrefix = forceDevice === 'MOBILE' ? 'fleetflow-mobile-preview' : 'fleetflow-complete';
  const outDir = path.join(stitchRoot, `${folderPrefix}-${stamp}`);
  await mkdir(outDir, { recursive: true });

  const projectResult = await stitch.callTool('create_project', { title });
  const projectId = projectIdFrom(projectResult);
  if (!projectId) {
    await writeFile(path.join(outDir, 'create-project-result.json'), JSON.stringify(projectResult, null, 2));
    throw new Error(`Unable to resolve Stitch project id. See ${path.join(outDir, 'create-project-result.json')}`);
  }

  const project = stitch.project(String(projectId));
  const outputs = [];

  for (const screenSpec of SCREENS) {
    const device = forceDevice || screenSpec.device;
    console.log(`Generating ${screenSpec.slug} (${device})...`);
    const screen = await project.generate(`${screenSpec.prompt}${deviceInstruction}`, device);
    const htmlUrl = await screen.getHtml();
    const imageUrl = await screen.getImage();
    const htmlFile = `${screenSpec.slug}.html`;
    const imageFile = `${screenSpec.slug}.png`;

    await download(htmlUrl, path.join(outDir, htmlFile));
    await download(imageUrl, path.join(outDir, imageFile));

    outputs.push({
      ...screenSpec,
      device,
      screenId: screen.id,
      htmlFile,
      imageFile,
      htmlUrl,
      imageUrl,
    });
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    title,
    projectId,
    outDir,
    screens: outputs,
  };

  await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(outDir, 'index.html'), htmlIndex({ title, projectId, screens: outputs }));
  await writeFile(path.join(stitchRoot, 'latest-complete.json'), JSON.stringify(manifest, null, 2));

  console.log(`Complete Stitch board: ${path.join(outDir, 'index.html')}`);
  console.log(`Project ID: ${projectId}`);
}

main().catch((error) => {
  if (error instanceof StitchError) {
    console.error(`Stitch error ${error.code}: ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
