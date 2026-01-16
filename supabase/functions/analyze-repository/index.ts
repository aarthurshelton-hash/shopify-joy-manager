import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
    status: string;
  }>;
}

interface ParsedRepo {
  owner: string;
  repo: string;
}

function parseGitHubUrl(url: string): ParsedRepo | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /^([^\/]+)\/([^\/]+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.replace(/\.git$/, '').match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  return null;
}

function classifyCommitType(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('feat') || msg.includes('feature') || msg.includes('add')) return 'feature';
  if (msg.includes('fix') || msg.includes('bug') || msg.includes('patch')) return 'bugfix';
  if (msg.includes('refactor') || msg.includes('clean') || msg.includes('restructure')) return 'refactor';
  if (msg.includes('doc') || msg.includes('readme')) return 'documentation';
  if (msg.includes('test') || msg.includes('spec')) return 'test';
  if (msg.includes('style') || msg.includes('format') || msg.includes('lint')) return 'style';
  if (msg.includes('perf') || msg.includes('optim')) return 'performance';
  if (msg.includes('build') || msg.includes('ci') || msg.includes('deploy')) return 'infrastructure';
  if (msg.includes('chore') || msg.includes('update dep') || msg.includes('bump')) return 'chore';
  if (msg.includes('breaking') || msg.includes('!:')) return 'breaking';
  if (msg.includes('revert')) return 'revert';
  if (msg.includes('merge')) return 'merge';
  if (msg.includes('init') || msg.includes('initial')) return 'initial';
  if (msg.includes('wip') || msg.includes('work in progress')) return 'wip';
  if (msg.includes('hotfix') || msg.includes('urgent')) return 'hotfix';
  
  return 'other';
}

function categorizeFile(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const path = filename.toLowerCase();
  
  if (path.includes('test') || path.includes('spec') || path.includes('__tests__')) return 'test';
  if (path.includes('doc') || ext === 'md' || ext === 'txt') return 'documentation';
  if (path.includes('config') || ['json', 'yaml', 'yml', 'toml', 'ini'].includes(ext)) return 'config';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h'].includes(ext)) return 'source';
  if (['css', 'scss', 'sass', 'less', 'styl'].includes(ext)) return 'style';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) return 'asset';
  if (path.includes('migration') || path.includes('schema')) return 'database';
  if (path.includes('.github') || path.includes('ci') || path.includes('docker')) return 'infrastructure';
  
  return 'other';
}

function calculateQuadrantProfile(commits: GitHubCommit[]): Record<string, number> {
  // Map commits to a 2D grid based on time and impact
  const quadrants = { q1: 0, q2: 0, q3: 0, q4: 0 };
  
  if (commits.length === 0) return quadrants;
  
  const sortedCommits = [...commits].sort((a, b) => 
    new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
  );
  
  const midpoint = Math.floor(sortedCommits.length / 2);
  
  sortedCommits.forEach((commit, index) => {
    const isEarly = index < midpoint;
    const impact = (commit.stats?.total || 0);
    const isHighImpact = impact > 50; // threshold for high impact
    
    if (isEarly && isHighImpact) quadrants.q1++;
    else if (isEarly && !isHighImpact) quadrants.q2++;
    else if (!isEarly && isHighImpact) quadrants.q3++;
    else quadrants.q4++;
  });
  
  // Normalize to percentages
  const total = commits.length;
  return {
    q1: quadrants.q1 / total,
    q2: quadrants.q2 / total,
    q3: quadrants.q3 / total,
    q4: quadrants.q4 / total,
  };
}

function calculateTemporalFlow(commits: GitHubCommit[]): Record<string, number> {
  if (commits.length < 3) {
    return { opening: 0.33, midgame: 0.34, endgame: 0.33 };
  }
  
  const sortedCommits = [...commits].sort((a, b) => 
    new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
  );
  
  const third = Math.floor(sortedCommits.length / 3);
  
  const phases = {
    opening: sortedCommits.slice(0, third),
    midgame: sortedCommits.slice(third, third * 2),
    endgame: sortedCommits.slice(third * 2),
  };
  
  const calculatePhaseIntensity = (phaseCommits: GitHubCommit[]) => {
    if (phaseCommits.length === 0) return 0;
    const totalChanges = phaseCommits.reduce((sum, c) => sum + (c.stats?.total || 0), 0);
    return totalChanges / phaseCommits.length;
  };
  
  const intensities = {
    opening: calculatePhaseIntensity(phases.opening),
    midgame: calculatePhaseIntensity(phases.midgame),
    endgame: calculatePhaseIntensity(phases.endgame),
  };
  
  const total = intensities.opening + intensities.midgame + intensities.endgame || 1;
  
  return {
    opening: intensities.opening / total,
    midgame: intensities.midgame / total,
    endgame: intensities.endgame / total,
  };
}

function detectCriticalMoments(commits: GitHubCommit[]): Array<{ index: number; type: string; description: string }> {
  const moments: Array<{ index: number; type: string; description: string }> = [];
  
  if (commits.length === 0) return moments;
  
  const sortedCommits = [...commits].sort((a, b) => 
    new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
  );
  
  // Calculate average changes
  const avgChanges = sortedCommits.reduce((sum, c) => sum + (c.stats?.total || 0), 0) / sortedCommits.length;
  
  sortedCommits.forEach((commit, index) => {
    const changes = commit.stats?.total || 0;
    const message = commit.commit.message.toLowerCase();
    
    // Large refactors
    if (changes > avgChanges * 3 && (message.includes('refactor') || message.includes('restructure'))) {
      moments.push({
        index,
        type: 'major_refactor',
        description: `Major restructuring: ${commit.commit.message.slice(0, 50)}`,
      });
    }
    
    // Breaking changes
    if (message.includes('breaking') || message.includes('!:')) {
      moments.push({
        index,
        type: 'breaking_change',
        description: `Breaking change: ${commit.commit.message.slice(0, 50)}`,
      });
    }
    
    // Hotfixes
    if (message.includes('hotfix') || message.includes('urgent fix')) {
      moments.push({
        index,
        type: 'crisis_response',
        description: `Crisis response: ${commit.commit.message.slice(0, 50)}`,
      });
    }
    
    // Major features
    if (changes > avgChanges * 2 && (message.includes('feat') || message.includes('add'))) {
      moments.push({
        index,
        type: 'major_feature',
        description: `Major feature: ${commit.commit.message.slice(0, 50)}`,
      });
    }
  });
  
  return moments.slice(0, 10); // Limit to 10 most significant moments
}

function classifyArchetype(metrics: Record<string, number>, commits: GitHubCommit[]): string {
  const { featureRatio, bugfixRatio, refactorRatio, docRatio, testRatio } = metrics;
  
  // High feature ratio with low bugs = rapid growth
  if (featureRatio > 0.4 && bugfixRatio < 0.2) return 'rapid_growth';
  
  // High refactor ratio = refactor cycle
  if (refactorRatio > 0.3) return 'refactor_cycle';
  
  // High bugfix ratio with low refactor = tech debt spiral
  if (bugfixRatio > 0.4 && refactorRatio < 0.1) return 'tech_debt_spiral';
  
  // Balanced metrics with good docs = stability plateau
  if (Math.abs(featureRatio - bugfixRatio) < 0.1 && docRatio > 0.1) return 'stability_plateau';
  
  // High feature with high test = quality focused
  if (featureRatio > 0.3 && testRatio > 0.2) return 'quality_focused';
  
  // Mostly features in bursts = feature burst
  if (featureRatio > 0.5) return 'feature_burst';
  
  // High churn (many small commits) = experimental
  const avgChanges = commits.reduce((sum, c) => sum + (c.stats?.total || 0), 0) / commits.length;
  if (avgChanges < 20 && commits.length > 50) return 'experimental';
  
  // Check for death march pattern (increasing bug fixes over time)
  const sortedCommits = [...commits].sort((a, b) => 
    new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
  );
  const firstHalf = sortedCommits.slice(0, Math.floor(sortedCommits.length / 2));
  const secondHalf = sortedCommits.slice(Math.floor(sortedCommits.length / 2));
  const firstHalfBugs = firstHalf.filter(c => classifyCommitType(c.commit.message) === 'bugfix').length / firstHalf.length;
  const secondHalfBugs = secondHalf.filter(c => classifyCommitType(c.commit.message) === 'bugfix').length / secondHalf.length;
  
  if (secondHalfBugs > firstHalfBugs * 1.5 && secondHalfBugs > 0.3) return 'death_march';
  
  // Maintenance mode (mostly small fixes and docs)
  if (bugfixRatio + docRatio > 0.5 && featureRatio < 0.2) return 'maintenance_mode';
  
  // Default to steady development
  return 'steady_development';
}

function generateFingerprint(commits: GitHubCommit[], owner: string, repo: string): string {
  const commitTypes = commits.map(c => classifyCommitType(c.commit.message));
  const typeString = commitTypes.join('');
  const hash = Array.from(typeString).reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return `${owner}-${repo}-${Math.abs(hash).toString(16)}`;
}

function determineDominantForce(metrics: Record<string, number>): 'primary' | 'secondary' | 'balanced' {
  const { featureRatio, bugfixRatio } = metrics;
  
  if (featureRatio > bugfixRatio * 1.5) return 'primary';
  if (bugfixRatio > featureRatio * 1.5) return 'secondary';
  return 'balanced';
}

function determineFlowDirection(temporalFlow: Record<string, number>): 'forward' | 'lateral' | 'backward' | 'chaotic' {
  const { opening, midgame, endgame } = temporalFlow;
  
  // Forward: increasing intensity over time
  if (endgame > midgame && midgame > opening) return 'forward';
  
  // Backward: decreasing intensity
  if (opening > midgame && midgame > endgame) return 'backward';
  
  // Lateral: stable in the middle
  if (midgame > opening && midgame > endgame) return 'lateral';
  
  // Chaotic: unpredictable
  return 'chaotic';
}

function calculateIntensity(commits: GitHubCommit[]): number {
  if (commits.length === 0) return 0;
  
  const totalChanges = commits.reduce((sum, c) => sum + (c.stats?.total || 0), 0);
  const avgChangesPerCommit = totalChanges / commits.length;
  
  // Normalize to 0-1 scale (assuming 100 changes per commit is high intensity)
  return Math.min(avgChangesPerCommit / 100, 1);
}

function generatePrediction(archetype: string): { outcome: string; confidence: number } {
  const predictions: Record<string, { outcome: string; confidence: number }> = {
    rapid_growth: { outcome: 'success', confidence: 0.75 },
    refactor_cycle: { outcome: 'success', confidence: 0.8 },
    tech_debt_spiral: { outcome: 'failure', confidence: 0.7 },
    stability_plateau: { outcome: 'success', confidence: 0.85 },
    feature_burst: { outcome: 'uncertain', confidence: 0.5 },
    death_march: { outcome: 'failure', confidence: 0.8 },
    quality_focused: { outcome: 'success', confidence: 0.9 },
    experimental: { outcome: 'uncertain', confidence: 0.4 },
    maintenance_mode: { outcome: 'success', confidence: 0.7 },
    steady_development: { outcome: 'success', confidence: 0.75 },
  };
  
  return predictions[archetype] || { outcome: 'uncertain', confidence: 0.5 };
}

function generateRecommendations(archetype: string, metrics: Record<string, number>): string[] {
  const recommendations: string[] = [];
  
  const archetypeRecs: Record<string, string[]> = {
    rapid_growth: [
      'Consider adding more tests to maintain quality during rapid development',
      'Document key architectural decisions before they become tribal knowledge',
      'Set up CI/CD pipelines to catch issues early',
    ],
    refactor_cycle: [
      'Excellent code health maintenance - consider feature velocity optimization',
      'Document refactoring patterns for team knowledge sharing',
      'Balance refactoring with feature delivery to maintain stakeholder confidence',
    ],
    tech_debt_spiral: [
      'URGENT: Schedule dedicated refactoring sprints',
      'Implement code review policies to prevent further debt accumulation',
      'Consider architectural review to identify systemic issues',
      'Add automated testing to prevent regression bugs',
    ],
    stability_plateau: [
      'Consider innovation sprints to maintain team engagement',
      'This is a healthy state - document what makes it work',
      'Look for opportunities to improve developer experience',
    ],
    feature_burst: [
      'Ensure adequate test coverage for new features',
      'Schedule technical debt paydown after feature push',
      'Document new features while context is fresh',
    ],
    death_march: [
      'CRITICAL: Slow down and address root causes of bugs',
      'Consider feature freeze until stability improves',
      'Review team workload and prevent burnout',
      'Implement better testing and code review processes',
    ],
    quality_focused: [
      'Excellent quality practices - maintain this balance',
      'Share testing strategies with other teams',
      'Consider documentation improvements for onboarding',
    ],
    experimental: [
      'Good exploration phase - consider stabilization timeline',
      'Document experiments and their outcomes',
      'Prepare for consolidation phase',
    ],
    maintenance_mode: [
      'Consider whether this project needs new features',
      'Document operational procedures for handoff',
      'Evaluate if modernization is needed',
    ],
    steady_development: [
      'Healthy development pattern - continue current practices',
      'Look for opportunities to improve efficiency',
      'Consider process documentation for team scaling',
    ],
  };
  
  recommendations.push(...(archetypeRecs[archetype] || []));
  
  // Add metric-specific recommendations
  if (metrics.testRatio < 0.1) {
    recommendations.push('Increase test coverage to improve confidence in changes');
  }
  if (metrics.docRatio < 0.05) {
    recommendations.push('Add more documentation to improve maintainability');
  }
  
  return recommendations;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repositoryUrl, githubToken } = await req.json();
    
    if (!repositoryUrl) {
      return new Response(
        JSON.stringify({ error: 'Repository URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const parsed = parseGitHubUrl(repositoryUrl);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Invalid GitHub repository URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { owner, repo } = parsed;
    
    // Prepare headers for GitHub API
    const githubHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'EnPensent-Code-Analyzer',
    };
    
    if (githubToken) {
      githubHeaders['Authorization'] = `Bearer ${githubToken}`;
    }
    
    // Fetch commits from GitHub API
    console.log(`Fetching commits for ${owner}/${repo}`);
    
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`,
      { headers: githubHeaders }
    );
    
    if (!commitsResponse.ok) {
      const errorText = await commitsResponse.text();
      console.error('GitHub API error:', commitsResponse.status, errorText);
      
      if (commitsResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Repository not found. Make sure it exists and is public, or provide a GitHub token for private repos.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (commitsResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'GitHub API rate limit exceeded. Please provide a GitHub token or try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `GitHub API error: ${commitsResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const commits: GitHubCommit[] = await commitsResponse.json();
    
    if (commits.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No commits found in repository' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch detailed stats for each commit (limited to first 50 for performance)
    const detailedCommits: GitHubCommit[] = [];
    const commitsToFetch = commits.slice(0, 50);
    
    for (const commit of commitsToFetch) {
      try {
        const detailResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
          { headers: githubHeaders }
        );
        
        if (detailResponse.ok) {
          const detailedCommit = await detailResponse.json();
          detailedCommits.push(detailedCommit);
        } else {
          detailedCommits.push(commit);
        }
      } catch (e) {
        console.error(`Error fetching commit ${commit.sha}:`, e);
        detailedCommits.push(commit);
      }
    }
    
    // Calculate metrics
    const commitTypes = detailedCommits.map(c => classifyCommitType(c.commit.message));
    const typeCounts: Record<string, number> = {};
    commitTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const total = commitTypes.length;
    const metrics = {
      featureRatio: (typeCounts['feature'] || 0) / total,
      bugfixRatio: (typeCounts['bugfix'] || 0) / total,
      refactorRatio: (typeCounts['refactor'] || 0) / total,
      docRatio: (typeCounts['documentation'] || 0) / total,
      testRatio: (typeCounts['test'] || 0) / total,
      choreRatio: (typeCounts['chore'] || 0) / total,
      totalCommits: commits.length,
      analyzedCommits: detailedCommits.length,
    };
    
    // Generate signature components
    const quadrantProfile = calculateQuadrantProfile(detailedCommits);
    const temporalFlow = calculateTemporalFlow(detailedCommits);
    const criticalMoments = detectCriticalMoments(detailedCommits);
    const archetype = classifyArchetype(metrics, detailedCommits);
    const fingerprint = generateFingerprint(detailedCommits, owner, repo);
    const dominantForce = determineDominantForce(metrics);
    const flowDirection = determineFlowDirection(temporalFlow);
    const intensity = calculateIntensity(detailedCommits);
    const prediction = generatePrediction(archetype);
    const recommendations = generateRecommendations(archetype, metrics);
    
    // Get unique contributors
    const contributors = new Set(detailedCommits.map(c => c.commit.author.email));
    
    // Calculate time range
    const sortedCommits = [...detailedCommits].sort((a, b) => 
      new Date(a.commit.author.date).getTime() - new Date(b.commit.author.date).getTime()
    );
    const analysisPeriodStart = sortedCommits[0]?.commit.author.date;
    const analysisPeriodEnd = sortedCommits[sortedCommits.length - 1]?.commit.author.date;
    
    // Prepare commit analysis data
    const commitAnalysis = detailedCommits.map(commit => {
      const fileCategories: Record<string, number> = {};
      commit.files?.forEach(file => {
        const category = categorizeFile(file.filename);
        fileCategories[category] = (fileCategories[category] || 0) + 1;
      });
      
      return {
        commit_hash: commit.sha,
        commit_message: commit.commit.message.slice(0, 500),
        commit_type: classifyCommitType(commit.commit.message),
        author: commit.commit.author.name,
        author_email: commit.commit.author.email,
        committed_at: commit.commit.author.date,
        files_changed: commit.files?.length || 0,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        file_categories: fileCategories,
        impact_score: (commit.stats?.total || 0) / 100,
      };
    });
    
    // Build the complete analysis result
    const analysisResult = {
      repository_url: `https://github.com/${owner}/${repo}`,
      repository_name: repo,
      owner,
      fingerprint,
      archetype,
      dominant_force: dominantForce,
      flow_direction: flowDirection,
      intensity,
      quadrant_profile: quadrantProfile,
      temporal_flow: temporalFlow,
      critical_moments: criticalMoments,
      code_metrics: {
        ...metrics,
        typeCounts,
      },
      total_commits: commits.length,
      total_contributors: contributors.size,
      analysis_period_start: analysisPeriodStart,
      analysis_period_end: analysisPeriodEnd,
      predicted_outcome: prediction.outcome,
      outcome_confidence: prediction.confidence,
      recommendations,
      commits: commitAnalysis,
    };
    
    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-repository:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
