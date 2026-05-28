import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stitch, StitchError } from '@google/stitch-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const defaultOutDir = path.join(repoRoot, 'docs', 'stitch');

const DEFAULT_PROMPT = `
Create a polished, production-ready FleetFlow/Kinetic admin dashboard design.
Context: logistics and recruitment portal for RH/Admin/Direction.
Style: mobile-first dark application UI, accessible RGAA/WCAG AA, compact desktop layout,
professional information density, strong focus states, no marketing hero.
Use colors close to: #10141b background, #030816 app bar, #1c2027 surfaces,
#1683f7 primary action, #4a8eff secondary action, high contrast white text.
Screen content: role-aware admin command dashboard with KPI cards, recent inflow,
test validation queue, job/applicant activity, and clear navigation Home/Contacts/Tests/Jobs/Roles.
`;

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function download(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    throw new Error('STITCH_API_KEY is missing. Set it in your local environment before running this script.');
  }

  const targetOutDir = path.resolve(argValue('outDir', defaultOutDir));
  await mkdir(targetOutDir, { recursive: true });

  const title = argValue('title', 'FleetFlow MVP Design Lab');
  const prompt = argValue('prompt', DEFAULT_PROMPT);
  const device = argValue('device', 'DESKTOP');
  const existingProjectId = argValue('project', '');
  const slug = argValue('slug', '');

  let projectId = existingProjectId;
  if (!projectId) {
    const projectResult = await stitch.callTool('create_project', { title });
    projectId =
      projectResult?.projectId ??
      projectResult?.project_id ??
      projectResult?.project?.projectId ??
      projectResult?.project?.id ??
      projectResult?.id ??
      (typeof projectResult?.name === 'string' ? projectResult.name.replace(/^projects\//, '') : undefined);

    if (!projectId) {
      await writeFile(
        path.join(targetOutDir, 'last-create-project-result.json'),
        JSON.stringify(projectResult, null, 2),
      );
      throw new Error('Stitch created a project but the project id shape was unknown. See docs/stitch/last-create-project-result.json');
    }
  }

  const project = stitch.project(String(projectId));
  const screen = await project.generate(prompt, device);
  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basename = slug || `${stamp}-fleetflow-admin`;
  const htmlPath = path.join(targetOutDir, `${basename}.html`);
  const imagePath = path.join(targetOutDir, `${basename}.png`);
  const manifestPath = path.join(targetOutDir, `${basename}-manifest.json`);
  const latestPath = path.join(defaultOutDir, 'latest.json');

  await download(htmlUrl, htmlPath);
  await download(imageUrl, imagePath);

  const manifest = {
    createdAt: new Date().toISOString(),
    projectId,
    screenId: screen.id,
    title,
    device,
    htmlPath,
    imagePath,
    htmlUrl,
    imageUrl,
  };

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  await writeFile(latestPath, JSON.stringify(manifest, null, 2));

  console.log(`Stitch design generated: ${imagePath}`);
  console.log(`HTML export: ${htmlPath}`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Screen ID: ${screen.id}`);
}

main().catch((error) => {
  if (error instanceof StitchError) {
    console.error(`Stitch error ${error.code}: ${error.message}`);
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exit(1);
});
