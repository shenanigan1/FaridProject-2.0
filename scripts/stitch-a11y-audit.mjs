import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pa11y from 'pa11y';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function severity(issue) {
  if (issue.type === 'error') return 3;
  if (issue.type === 'warning') return 2;
  return 1;
}

async function main() {
  const dir = path.resolve(argValue('dir', path.join(repoRoot, 'docs', 'stitch')));
  const fileArg = argValue('file', '');
  const standard = argValue('standard', 'WCAG2AAA');
  const files = fileArg
    ? [path.basename(fileArg)]
    : (await readdir(dir)).filter((file) => file.endsWith('.html') && file !== 'index.html').sort();

  if (files.length === 0) {
    throw new Error(`No Stitch HTML screens found in ${dir}`);
  }

  const results = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const url = pathToFileURL(filePath).toString();
    console.log(`Auditing ${file} (${standard})...`);
    const result = await pa11y(url, {
      standard,
      runners: ['htmlcs'],
      timeout: 60000,
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
      },
      chromeLaunchConfig: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
    results.push({
      file,
      documentTitle: result.documentTitle,
      pageUrl: result.pageUrl,
      issueCount: result.issues.length,
      errorCount: result.issues.filter((issue) => issue.type === 'error').length,
      warningCount: result.issues.filter((issue) => issue.type === 'warning').length,
      noticeCount: result.issues.filter((issue) => issue.type === 'notice').length,
      issues: result.issues
        .sort((left, right) => severity(right) - severity(left))
        .map((issue) => ({
          type: issue.type,
          code: issue.code,
          message: issue.message,
          selector: issue.selector,
          context: issue.context,
        })),
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    standard,
    directory: dir,
    screenCount: results.length,
    totalIssues: results.reduce((sum, result) => sum + result.issueCount, 0),
    totalErrors: results.reduce((sum, result) => sum + result.errorCount, 0),
    totalWarnings: results.reduce((sum, result) => sum + result.warningCount, 0),
    results,
  };

  const reportPath = path.join(dir, 'accessibility-report.json');
  const markdownPath = path.join(dir, 'accessibility-report.md');
  await writeFile(reportPath, JSON.stringify(summary, null, 2));
  await writeFile(markdownPath, toMarkdown(summary));

  console.log(`Accessibility report: ${reportPath}`);
  console.log(`Errors: ${summary.totalErrors}, warnings: ${summary.totalWarnings}, total: ${summary.totalIssues}`);

  if (summary.totalErrors > 0) {
    process.exitCode = 1;
  }
}

function toMarkdown(summary) {
  const rows = summary.results
    .map(
      (result) =>
        `| ${result.file} | ${result.errorCount} | ${result.warningCount} | ${result.noticeCount} | ${result.issueCount} |`,
    )
    .join('\n');

  const details = summary.results
    .map((result) => {
      const topIssues = result.issues
        .slice(0, 8)
        .map((issue) => `- **${issue.type}** ${issue.message} \`${issue.selector ?? 'n/a'}\``)
        .join('\n') || '- Aucun probleme detecte.';
      return `### ${result.file}\n${topIssues}`;
    })
    .join('\n\n');

  return `# Stitch Accessibility Report

- Standard: ${summary.standard}
- Generated: ${summary.generatedAt}
- Screens: ${summary.screenCount}
- Errors: ${summary.totalErrors}
- Warnings: ${summary.totalWarnings}
- Total issues: ${summary.totalIssues}

| Screen | Errors | Warnings | Notices | Total |
| --- | ---: | ---: | ---: | ---: |
${rows}

${details}
`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
