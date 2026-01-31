/**
 * Content Validation for Vision Marketplace
 * Validates visualizations before listing to prevent inappropriate content
 */

export interface ContentValidationResult {
  isValid: boolean;
  issues: string[];
  confidence: number;
  moderationFlags: {
    inappropriate: boolean;
    copyright: boolean;
    spam: boolean;
    qualityScore: number;
  };
}

export interface VisualizationContent {
  id: string;
  title: string;
  imagePath?: string;
  gameData?: Record<string, unknown>;
  userId: string;
}

// Words that indicate potential issues (basic filter)
const INAPPROPRIATE_PATTERNS = [
  /\bviolent\b/i,
  /\bhate\b/i,
  /\bexplicit\b/i,
  /\bnsfw\b/i,
  /\boffensive\b/i
];

const SPAM_PATTERNS = [
  /(.)\1{5,}/,           // Repeated characters (5+)
  /[!@#$%^&*]{4,}/,      // Too many special characters
  /\b(buy|sell|free|win|winner)\b/i, // Marketing spam
  /https?:\/\//i,        // URLs in titles
];

const COPYRIGHT_TERMS = [
  'chess.com',
  'lichess',
  'magnus carlsen',
  'kasparov',
  // Add more as needed
];

export class ContentValidator {
  /**
   * Validates a visualization for marketplace listing
   */
  static async validate(content: VisualizationContent): Promise<ContentValidationResult> {
    const issues: string[] = [];
    let confidence = 1.0;
    
    // Check for inappropriate content
    const inappropriateCheck = this.checkInappropriateContent(content);
    if (inappropriateCheck.detected) {
      issues.push(...inappropriateCheck.issues);
      confidence *= 0.3;
    }
    
    // Check for spam
    const spamCheck = this.checkSpam(content);
    if (spamCheck.detected) {
      issues.push(...spamCheck.issues);
      confidence *= 0.5;
    }
    
    // Check for potential copyright issues
    const copyrightCheck = this.checkCopyright(content);
    if (copyrightCheck.detected) {
      issues.push(...copyrightCheck.issues);
      confidence *= 0.7;
    }
    
    // Assess quality
    const qualityScore = this.assessQuality(content);
    if (qualityScore < 0.5) {
      issues.push('Low quality visualization');
      confidence *= qualityScore;
    }
    
    return {
      isValid: issues.length === 0 && confidence > 0.6,
      issues,
      confidence: Math.max(0, Math.min(1, confidence)),
      moderationFlags: {
        inappropriate: inappropriateCheck.detected,
        copyright: copyrightCheck.detected,
        spam: spamCheck.detected,
        qualityScore
      }
    };
  }

  /**
   * Checks for inappropriate content in title and metadata
   */
  private static checkInappropriateContent(content: VisualizationContent): {
    detected: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const title = content.title || '';
    
    for (const pattern of INAPPROPRIATE_PATTERNS) {
      if (pattern.test(title)) {
        issues.push(`Title contains potentially inappropriate content`);
        break;
      }
    }
    
    // Check game data for inappropriate naming
    if (content.gameData) {
      const eventName = (content.gameData.event as string) || '';
      const siteName = (content.gameData.site as string) || '';
      
      for (const pattern of INAPPROPRIATE_PATTERNS) {
        if (pattern.test(eventName) || pattern.test(siteName)) {
          issues.push('Game metadata contains potentially inappropriate content');
          break;
        }
      }
    }
    
    return {
      detected: issues.length > 0,
      issues
    };
  }

  /**
   * Checks for spam patterns
   */
  private static checkSpam(content: VisualizationContent): {
    detected: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const title = content.title || '';
    
    // Check for spam patterns
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(title)) {
        issues.push('Title appears to contain spam');
        break;
      }
    }
    
    // Check for ALL CAPS (more than 10 chars)
    if (title.length > 10 && title === title.toUpperCase()) {
      issues.push('Title is entirely uppercase');
    }
    
    // Check for very short or empty titles
    if (title.trim().length < 3) {
      issues.push('Title is too short');
    }
    
    // Check for very long titles
    if (title.length > 200) {
      issues.push('Title is too long');
    }
    
    return {
      detected: issues.length > 0,
      issues
    };
  }

  /**
   * Checks for potential copyright issues
   */
  private static checkCopyright(content: VisualizationContent): {
    detected: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    const title = (content.title || '').toLowerCase();
    
    // Check for trademarked terms
    for (const term of COPYRIGHT_TERMS) {
      if (title.includes(term.toLowerCase())) {
        issues.push(`Title may reference copyrighted/trademarked content: ${term}`);
        break;
      }
    }
    
    return {
      detected: issues.length > 0,
      issues
    };
  }

  /**
   * Assesses the quality of a visualization
   */
  private static assessQuality(content: VisualizationContent): number {
    let score = 0.8; // Base score
    
    // Title quality
    const title = content.title || '';
    if (title.length >= 5 && title.length <= 100) {
      score += 0.1;
    } else {
      score -= 0.1;
    }
    
    // Check if title is descriptive (not just random chars)
    const hasWords = /\b[a-zA-Z]{3,}\b/.test(title);
    if (hasWords) {
      score += 0.05;
    } else {
      score -= 0.2;
    }
    
    // Game data completeness
    if (content.gameData) {
      const hasEvent = !!content.gameData.event;
      const hasMoves = !!content.gameData.moves || !!content.gameData.pgn;
      const hasPlayers = !!content.gameData.white || !!content.gameData.black;
      
      const dataPoints = [hasEvent, hasMoves, hasPlayers].filter(Boolean).length;
      score += dataPoints * 0.05;
    } else {
      score -= 0.1;
    }
    
    // Has image
    if (content.imagePath) {
      score += 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Quick check if content can be listed
   */
  static async canList(content: VisualizationContent): Promise<boolean> {
    const result = await this.validate(content);
    return result.isValid;
  }

  /**
   * Get a human-readable summary of validation issues
   */
  static formatIssues(result: ContentValidationResult): string {
    if (result.isValid) {
      return 'Content validation passed';
    }
    
    return `Validation failed:\n${result.issues.map(i => `• ${i}`).join('\n')}`;
  }
}

export default ContentValidator;
