import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'farm', 'config', 'autoTune.json');
const THRESHOLDS = {
  MIN_SAMPLE_SIZE: 100,
  TARGET_IMPROVEMENT: 15, // percentage points
  MIN_CONFIDENCE: 0.95,
  DEPLOY_THRESHOLD: 76, // minimum accuracy to auto-deploy
};

/**
 * Auto-tune system that adjusts parameters based on A/B results
 * and auto-deploys when thresholds are met
 */
export class AutoTuneSystem {
  constructor() {
    this.config = this.loadConfig();
    this.history = [];
  }

  loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    return {
      enabled: true,
      lastTuned: null,
      currentWeights: {
        kingside: 1.0,
        queenside: 1.0,
        center: 1.0,
        pieceTypeBonus: 0.15,
      },
      deploymentStatus: 'baseline', // 'baseline', 'testing', 'enhanced'
      autoDeployEnabled: true,
    };
  }

  saveConfig() {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  analyzeAndTune(analysis, predictions) {
    const results = {
      tuned: false,
      deployed: false,
      recommendations: [],
      actions: [],
    };

    if (!this.config.enabled) {
      results.recommendations.push('Auto-tune is disabled');
      return results;
    }

    // Check sample size
    if (analysis.total < THRESHOLDS.MIN_SAMPLE_SIZE) {
      results.recommendations.push(
        `Need ${THRESHOLDS.MIN_SAMPLE_SIZE - analysis.total} more games for tuning`
      );
      return results;
    }

    // Analyze archetype performance
    const underperforming = analysis.archetypeImprovements.filter(
      a => a.improvement < 0 && a.count >= 10
    );

    if (underperforming.length > 0) {
      results.recommendations.push(
        `Tune weights for underperforming archetypes: ${underperforming.map(a => a.archetype).join(', ')}`
      );
      this.adjustWeights(underperforming);
      results.tuned = true;
      results.actions.push('Adjusted archetype weights');
    }

    // Check if ready for auto-deploy
    if (this.shouldDeploy(analysis)) {
      results = this.deployEnhanced(analysis, results);
    }

    this.config.lastTuned = new Date().toISOString();
    this.saveConfig();
    this.history.push({ timestamp: Date.now(), results });

    return results;
  }

  shouldDeploy(analysis) {
    if (!this.config.autoDeployEnabled) return false;
    if (this.config.deploymentStatus === 'enhanced') return false;

    const meetsAccuracy = analysis.enhancedAccuracy >= THRESHOLDS.DEPLOY_THRESHOLD;
    const meetsImprovement = analysis.improvement >= THRESHOLDS.TARGET_IMPROVEMENT;
    const significant = analysis.statistics?.pValue < 0.05;

    return meetsAccuracy && meetsImprovement && significant;
  }

  deployEnhanced(analysis, results) {
    this.config.deploymentStatus = 'enhanced';
    results.deployed = true;
    results.actions.push(`Auto-deployed enhanced system (${analysis.enhancedAccuracy.toFixed(1)}% accuracy)`);
    
    // Write deployment marker
    const markerFile = path.join(process.cwd(), 'farm', 'data', '.enhanced-deployed');
    fs.writeFileSync(markerFile, JSON.stringify({
      deployedAt: new Date().toISOString(),
      accuracy: analysis.enhancedAccuracy,
      improvement: analysis.improvement,
      sampleSize: analysis.total,
    }));

    return results;
  }

  adjustWeights(underperformingArchetypes) {
    // Reduce weights for underperforming archetypes
    underperformingArchetypes.forEach(arch => {
      const factor = 0.9; // Reduce by 10%
      if (arch.archetype.includes('Kingside')) {
        this.config.currentWeights.kingside *= factor;
      } else if (arch.archetype.includes('Queenside')) {
        this.config.currentWeights.queenside *= factor;
      } else if (arch.archetype.includes('Tactical') || arch.archetype.includes('Dynamic')) {
        this.config.currentWeights.pieceTypeBonus *= factor;
      }
    });

    // Normalize weights
    const sum = Object.values(this.config.currentWeights).reduce((a, b) => a + b, 0);
    Object.keys(this.config.currentWeights).forEach(key => {
      this.config.currentWeights[key] /= sum;
    });
  }

  getStatus() {
    return {
      enabled: this.config.enabled,
      deploymentStatus: this.config.deploymentStatus,
      lastTuned: this.config.lastTuned,
      currentWeights: this.config.currentWeights,
      autoDeployEnabled: this.config.autoDeployEnabled,
      history: this.history.slice(-10),
    };
  }
}
