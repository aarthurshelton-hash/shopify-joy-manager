import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { PremiumAnalyticsDashboard } from '@/components/premium/PremiumAnalyticsDashboard';

const PremiumAnalytics: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Premium Market Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Exclusive data insights for Visionary members to make informed decisions
          </p>
        </div>

        <PremiumAnalyticsDashboard />
      </main>

      <Footer />
    </div>
  );
};

export default PremiumAnalytics;
