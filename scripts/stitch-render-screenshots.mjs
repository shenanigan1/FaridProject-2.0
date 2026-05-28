import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const sourceDir = path.resolve(argValue('dir', path.join(repoRoot, 'docs', 'stitch')));
  const outputDir = path.resolve(argValue('out', sourceDir));
  const width = Number(argValue('width', '390'));
  const height = Number(argValue('height', '844'));
  const fullPage = argValue('fullPage', 'true') !== 'false';
  const files = (await readdir(sourceDir))
    .filter((file) => file.endsWith('.html') && file !== 'index.html')
    .sort();

  if (files.length === 0) {
    throw new Error(`No Stitch HTML screens found in ${sourceDir}`);
  }

  await mkdir(outputDir, { recursive: true });
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true });
    for (const file of files) {
      const url = pathToFileURL(path.join(sourceDir, file)).toString();
      const target = path.join(outputDir, file.replace(/\.html$/, '.png'));
      console.log(`Rendering ${file} -> ${target}`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.screenshot({ path: target, fullPage });
    }
  } finally {
    await browser.close();
  }

  console.log(`Mobile screenshots written to ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
