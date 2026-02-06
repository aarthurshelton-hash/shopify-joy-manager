#!/usr/bin/env node
/**
 * Live A/B Test Dashboard
 * 
 * Real-time monitoring dashboard with web interface
 * Run: node farm/scripts/dashboard.mjs
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const PORT = 3333;

// HTML template with embedded charts
const DASHBOARD_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>EP A/B Test Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a; color: #fff; padding: 20px;
    }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { color: #888; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .card { 
      background: #1a1a1a; border-radius: 12px; padding: 20px;
      border: 1px solid #333;
    }
    .card h3 { font-size: 14px; color: #888; margin-bottom: 15px; text-transform: uppercase; }
    .metric { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .metric.green { color: #4ade80; }
    .metric.blue { color: #60a5fa; }
    .metric.yellow { color: #fbbf24; }
    .metric.red { color: #f87171; }
    .comparison { display: flex; justify-content: space-between; margin-top: 20px; }
    .comparison-item { text-align: center; }
    .comparison-item .value { font-size: 32px; font-weight: bold; }
    .comparison-item .label { font-size: 12px; color: #888; margin-top: 5px; }
    .progress-bar { 
      width: 100%; height: 8px; background: #333; border-radius: 4px;
      margin-top: 10px; overflow: hidden;
    }
    .progress-fill { 
      height: 100%; background: linear-gradient(90deg, #4ade80, #22c55e);
      border-radius: 4px; transition: width 0.3s;
    }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #333; }
    th { color: #888; font-weight: normal; }
    .positive { color: #4ade80; }
    .negative { color: #f87171; }
    .chart { width: 100%; height: 200px; margin-top: 15px; }
    .status { display: inline-flex; align-items: center; gap: 8px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.active { background: #4ade80; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .refresh-info { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>En Pensent A/B Test Dashboard</h1>
    <p>4-Quadrant vs 8-Quadrant Signature Comparison</p>
  </div>
  
  <div class="grid">
    <div class="card">
      <h3>Accuracy Comparison</h3>
      <div class="comparison">
        <div class="comparison-item">
          <div class="value blue" id="baseline-acc">--%</div>
          <div class="label">4-Quadrant</div>
        </div>
        <div class="comparison-item">
          <div class="value green" id="enhanced-acc">--%</div>
          <div class="label">8-Quadrant</div>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progress-bar" style="width: 0%"></div>
      </div>
      <p style="margin-top: 10px; color: #888; font-size: 14px;">
        Progress to target (76%): <span id="progress-text">0%</span>
      </p>
    </div>

    <div class="card">
      <h3>Improvement</h3>
      <div class="metric green" id="improvement">+--%</div>
      <p style="color: #888; font-size: 14px;">
        Target: +15-25% | <span id="significant">Calculating...</span>
      </p>
    </div>

    <div class="card">
      <h3>Sample Size</h3>
      <div class="metric yellow" id="sample-size">--</div>
      <p style="color: #888; font-size: 14px;">
        Need 100+ for significance
      </p>
    </div>

    <div class="card">
      <h3>Farm Status</h3>
      <div class="status">
        <div class="status-dot active"></div>
        <span>5 Workers Running</span>
      </div>
      <p style="color: #888; font-size: 14px; margin-top: 10px;">
        ~36,000 games/day capacity
      </p>
    </div>

    <div class="card">
      <h3>Statistical Significance</h3>
      <table>
        <tr><td>P-value</td><td id="p-value">--</td></tr>
        <tr><td>Z-score</td><td id="z-score">--</td></tr>
        <tr><td>Confidence</td><td id="confidence">--</td></tr>
        <tr><td>Cohen's d</td><td id="cohens-d">--</td></tr>
      </table>
    </div>

    <div class="card">
      <h3>Top Improved Archetypes</h3>
      <table id="archetypes">
        <tr><th>Archetype</th><th>Improvement</th></tr>
      </table>
    </div>
  </div>

  <p class="refresh-info">Auto-refreshing every 5 seconds | <span id="last-update">--</span></p>

  <script>
    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        updateDashboard(data);
      } catch (e) {
        console.error('Failed to fetch:', e);
      }
    }

    function updateDashboard(data) {
      if (!data.analysis) return;
      
      const a = data.analysis;
      document.getElementById('baseline-acc').textContent = a.baselineAccuracy.toFixed(1) + '%';
      document.getElementById('enhanced-acc').textContent = a.enhancedAccuracy.toFixed(1) + '%';
      document.getElementById('improvement').textContent = (a.improvement >= 0 ? '+' : '') + a.improvement.toFixed(1) + '%';
      document.getElementById('sample-size').textContent = a.total;
      
      const progress = Math.min(100, (a.enhancedAccuracy / 76) * 100);
      document.getElementById('progress-bar').style.width = progress + '%';
      document.getElementById('progress-text').textContent = progress.toFixed(0) + '%';
      
      if (a.statistics) {
        document.getElementById('p-value').textContent = a.statistics.pValue.toFixed(4);
        document.getElementById('z-score').textContent = a.statistics.z.toFixed(2);
        document.getElementById('confidence').textContent = a.statistics.significant ? '95% ✓' : '< 95%';
        document.getElementById('cohens-d').textContent = a.effectSize?.toFixed(2) || '--';
        document.getElementById('significant').textContent = a.statistics.significant ? 'Statistically Significant!' : 'Need more data';
      }
      
      const archTable = document.getElementById('archetypes');
      archTable.innerHTML = '<tr><th>Archetype</th><th>Improvement</th></tr>';
      a.archetypeImprovements?.slice(0, 5).forEach(item => {
        const row = archTable.insertRow();
        row.innerHTML = \`<td>\${item.archetype}</td><td class="\${item.improvement > 0 ? 'positive' : 'negative'}">\${item.improvement >= 0 ? '+' : ''}\${item.improvement.toFixed(1)}%</td>\`;
      });
      
      document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }

    fetchData();
    setInterval(fetchData, 5000);
  </script>
</body>
</html>`;

// Simple API to serve data
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.end(DASHBOARD_HTML);
  } else if (req.url === '/api/data') {
    try {
      const predictionsPath = path.join(DATA_DIR, 'predictions.json');
      const reportPath = path.join(DATA_DIR, 'ab-test-report.json');
      
      let analysis = null;
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(await readFile(reportPath, 'utf-8'));
        analysis = report.summary;
        analysis.total = report.summary.totalGames;
        analysis.archetypeImprovements = report.archetypeAnalysis;
        analysis.statistics = report.statistics;
        analysis.effectSize = report.effectSize;
      }
      
      res.end(JSON.stringify({ 
        analysis,
        timestamp: Date.now(),
        status: fs.existsSync(predictionsPath) ? 'running' : 'no-data'
      }));
    } catch (e) {
      res.end(JSON.stringify({ error: e.message }));
    }
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 A/B Test Dashboard running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop\n');
});
