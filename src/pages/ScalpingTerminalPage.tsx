/**
 * Scalping Terminal Page
 * 
 * The full trading dashboard with real-time predictions and cross-market analysis.
 * Part of the En Pensent Universal Pattern Recognition System.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MultiMarketScalpingTerminal from '@/components/scalping/MultiMarketScalpingTerminal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ScalpingTerminalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg uppercase tracking-wide">
                Scalping Terminal
              </h1>
              <p className="text-xs text-muted-foreground">
                En Pensent™ Real-Time Market Prediction Engine
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/strategic-plan">
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Strategic Plan
              </Button>
            </Link>
            <Link to="/code-analysis">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="w-4 h-4" />
                Code Analysis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <ErrorBoundary componentName="ScalpingTerminal">
          <MultiMarketScalpingTerminal />
        </ErrorBoundary>
      </div>

      {/* Footer Attribution */}
      <div className="border-t border-border/50 py-4 text-center text-xs text-muted-foreground">
        <p>
          En Pensent™ Patent-Pending Technology • Universal Temporal Pattern Recognition
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} Alec Arthur Shelton "The Artist" - Inventor & CEO
        </p>
      </div>
    </div>
  );
};

export default ScalpingTerminalPage;
