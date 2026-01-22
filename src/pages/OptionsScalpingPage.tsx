/**
 * Options Scalping Page
 * 
 * 24/7 American Options Scalping Terminal with Multi-Timeframe Prediction
 * En Pensent™ Patent-Pending Technology
 * @version 7.50-OPTIONS
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OptionsScalpingTerminal from '@/components/options/OptionsScalpingTerminal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const OptionsScalpingPage: React.FC = () => {
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
              <h1 className="font-display font-bold text-lg uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Options Scalping Terminal
              </h1>
              <p className="text-xs text-muted-foreground">
                En Pensent™ American Options Prediction Engine v7.50
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link to="/trading">
              <Button variant="outline" size="sm" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Market Trading
              </Button>
            </Link>
            <Link to="/benchmark">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="w-4 h-4" />
                Benchmark
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <ErrorBoundary componentName="OptionsScalpingTerminal">
          <OptionsScalpingTerminal />
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

export default OptionsScalpingPage;
