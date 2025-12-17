#!/usr/bin/env npx tsx
/**
 * Lighthouse Performance Audit Script
 *
 * Runs Lighthouse audits on key pages and generates reports
 *
 * Usage:
 *   npx tsx scripts/lighthouse-audit.ts
 *   npm run lighthouse
 */

import { exec } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface LighthouseResult {
  page: string;
  url: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    tbt: number; // Total Blocking Time
    cls: number; // Cumulative Layout Shift
    si: number; // Speed Index
  };
}

const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000';

// Pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Landing Page', path: '/' },
  { name: 'Pricing Page', path: '/pricing' },
  { name: 'Demo Page', path: '/demo' },
  { name: 'Sign In Page', path: '/sign-in' },
  { name: 'Gifts Page', path: '/gifts' },
];

// Performance budgets
const PERFORMANCE_BUDGETS = {
  performance: 80,
  accessibility: 90,
  bestPractices: 80,
  seo: 80,
  fcp: 2000, // ms
  lcp: 3000, // ms
  tbt: 300, // ms
  cls: 0.1,
};

async function runLighthouse(url: string, outputPath: string): Promise<any> {
  const command = `npx lighthouse "${url}" \
    --output=json \
    --output=html \
    --output-path="${outputPath}" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --only-categories=performance,accessibility,best-practices,seo \
    --quiet`;

  try {
    await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });

    // Read the JSON output
    const jsonPath = `${outputPath}.report.json`;
    const { stdout } = await execAsync(`cat "${jsonPath}"`);
    return JSON.parse(stdout);
  } catch (error) {
    console.error(`Error running Lighthouse for ${url}:`, error);
    return null;
  }
}

function extractScores(lhr: any): LighthouseResult['scores'] {
  return {
    performance: Math.round((lhr.categories.performance?.score || 0) * 100),
    accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
    seo: Math.round((lhr.categories.seo?.score || 0) * 100),
  };
}

function extractMetrics(lhr: any): LighthouseResult['metrics'] {
  const audits = lhr.audits;
  return {
    fcp: audits['first-contentful-paint']?.numericValue || 0,
    lcp: audits['largest-contentful-paint']?.numericValue || 0,
    tbt: audits['total-blocking-time']?.numericValue || 0,
    cls: audits['cumulative-layout-shift']?.numericValue || 0,
    si: audits['speed-index']?.numericValue || 0,
  };
}

function formatScore(score: number, budget: number): string {
  const emoji = score >= budget ? '✅' : '❌';
  return `${emoji} ${score}`;
}

function formatMetric(value: number, budget: number, unit: string = 'ms'): string {
  const formattedValue = unit === 'ms' ? Math.round(value) : value.toFixed(3);
  const emoji = value <= budget ? '✅' : '❌';
  return `${emoji} ${formattedValue}${unit}`;
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Audit\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Create output directory
  const outputDir = 'lighthouse-report';
  await mkdir(outputDir, { recursive: true });

  const results: LighthouseResult[] = [];

  for (const page of PAGES_TO_AUDIT) {
    const url = `${BASE_URL}${page.path}`;
    const outputPath = `${outputDir}/${page.name.toLowerCase().replace(/\s+/g, '-')}`;

    console.log(`\n📊 Auditing: ${page.name} (${url})`);

    const lhr = await runLighthouse(url, outputPath);

    if (lhr) {
      const scores = extractScores(lhr);
      const metrics = extractMetrics(lhr);

      results.push({
        page: page.name,
        url,
        scores,
        metrics,
      });

      console.log(`   Performance:    ${formatScore(scores.performance, PERFORMANCE_BUDGETS.performance)}`);
      console.log(`   Accessibility:  ${formatScore(scores.accessibility, PERFORMANCE_BUDGETS.accessibility)}`);
      console.log(`   Best Practices: ${formatScore(scores.bestPractices, PERFORMANCE_BUDGETS.bestPractices)}`);
      console.log(`   SEO:            ${formatScore(scores.seo, PERFORMANCE_BUDGETS.seo)}`);
      console.log(`   FCP:            ${formatMetric(metrics.fcp, PERFORMANCE_BUDGETS.fcp)}`);
      console.log(`   LCP:            ${formatMetric(metrics.lcp, PERFORMANCE_BUDGETS.lcp)}`);
      console.log(`   TBT:            ${formatMetric(metrics.tbt, PERFORMANCE_BUDGETS.tbt)}`);
      console.log(`   CLS:            ${formatMetric(metrics.cls, PERFORMANCE_BUDGETS.cls, '')}`);
    } else {
      console.log(`   ❌ Failed to audit ${page.name}`);
    }
  }

  // Generate summary report
  console.log('\n========================================');
  console.log('LIGHTHOUSE AUDIT SUMMARY');
  console.log('========================================\n');

  // Calculate averages
  const avgScores = {
    performance: Math.round(results.reduce((acc, r) => acc + r.scores.performance, 0) / results.length),
    accessibility: Math.round(results.reduce((acc, r) => acc + r.scores.accessibility, 0) / results.length),
    bestPractices: Math.round(results.reduce((acc, r) => acc + r.scores.bestPractices, 0) / results.length),
    seo: Math.round(results.reduce((acc, r) => acc + r.scores.seo, 0) / results.length),
  };

  console.log('Average Scores:');
  console.log(`  Performance:    ${formatScore(avgScores.performance, PERFORMANCE_BUDGETS.performance)}`);
  console.log(`  Accessibility:  ${formatScore(avgScores.accessibility, PERFORMANCE_BUDGETS.accessibility)}`);
  console.log(`  Best Practices: ${formatScore(avgScores.bestPractices, PERFORMANCE_BUDGETS.bestPractices)}`);
  console.log(`  SEO:            ${formatScore(avgScores.seo, PERFORMANCE_BUDGETS.seo)}`);

  // Check for budget failures
  const failures: string[] = [];

  for (const result of results) {
    if (result.scores.performance < PERFORMANCE_BUDGETS.performance) {
      failures.push(`${result.page}: Performance ${result.scores.performance} < ${PERFORMANCE_BUDGETS.performance}`);
    }
    if (result.scores.accessibility < PERFORMANCE_BUDGETS.accessibility) {
      failures.push(`${result.page}: Accessibility ${result.scores.accessibility} < ${PERFORMANCE_BUDGETS.accessibility}`);
    }
    if (result.metrics.lcp > PERFORMANCE_BUDGETS.lcp) {
      failures.push(`${result.page}: LCP ${Math.round(result.metrics.lcp)}ms > ${PERFORMANCE_BUDGETS.lcp}ms`);
    }
    if (result.metrics.cls > PERFORMANCE_BUDGETS.cls) {
      failures.push(`${result.page}: CLS ${result.metrics.cls.toFixed(3)} > ${PERFORMANCE_BUDGETS.cls}`);
    }
  }

  if (failures.length > 0) {
    console.log('\n⚠️ Budget Failures:');
    failures.forEach((f) => console.log(`  - ${f}`));
  } else {
    console.log('\n✅ All pages meet performance budgets!');
  }

  // Save JSON summary
  const summaryPath = `${outputDir}/summary.json`;
  await writeFile(
    summaryPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        budgets: PERFORMANCE_BUDGETS,
        averages: avgScores,
        results,
        failures,
      },
      null,
      2
    )
  );

  console.log(`\n📁 Reports saved to: ${outputDir}/`);
  console.log(`   - summary.json`);
  PAGES_TO_AUDIT.forEach((page) => {
    const fileName = page.name.toLowerCase().replace(/\s+/g, '-');
    console.log(`   - ${fileName}.report.html`);
  });

  // Exit with error if there are failures
  if (failures.length > 0) {
    console.log('\n❌ Audit completed with failures');
    process.exit(1);
  } else {
    console.log('\n✅ Audit completed successfully');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
