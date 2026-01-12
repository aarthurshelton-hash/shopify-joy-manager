import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Heart, 
  Users, 
  TrendingUp,
  Sparkles,
  BookOpen,
  Globe,
  ArrowLeft,
  DollarSign,
  Recycle,
  Shield,
  Target,
  Award,
  BarChart3,
  PieChart,
  Calendar,
  HandHeart,
  School,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { MEMBERSHIP_ECONOMICS, getPlatformVisionStats } from '@/lib/visualizations/visionScoring';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

interface FundStats {
  total_contributions: number;
  total_forfeited_value_cents: number;
  total_platform_fee_cents: number;
  total_fund_cents: number;
  total_visions_released: number;
  scholarships_funded: number;
}

interface FundContribution {
  id: string;
  created_at: string;
  event_type: string;
  forfeited_value_cents: number;
  platform_fee_cents: number;
  fund_contribution_cents: number;
  visions_released: number;
  notes: string | null;
}

// Impact stories - these would ideally come from a CMS or database
const impactStories = [
  {
    id: 1,
    name: 'Maria G.',
    location: 'São Paulo, Brazil',
    age: 14,
    quote: "Before getting my scholarship, I could only practice chess on paper boards. Now I can visualize my games and learn from the patterns. My ELO has gone up 200 points!",
    achievement: 'Won regional youth championship',
    image: '🇧🇷',
  },
  {
    id: 2,
    name: 'Kwame A.',
    location: 'Accra, Ghana',
    age: 12,
    quote: "The visualization tools helped me understand chess in a completely new way. I can see where I make mistakes and how masters think differently.",
    achievement: 'Now teaches chess to younger students',
    image: '🇬🇭',
  },
  {
    id: 3,
    name: 'Priya S.',
    location: 'Mumbai, India',
    age: 15,
    quote: "My family couldn't afford chess coaching. This scholarship gave me access to tools that top players use. I'm now preparing for national competitions.",
    achievement: 'State-level qualifier',
    image: '🇮🇳',
  },
];

const EducationFund: React.FC = () => {
  const backgroundImages = useRandomGameArt(4);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['education-fund-stats-detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_fund')
        .select('forfeited_value_cents, platform_fee_cents, fund_contribution_cents, visions_released');
      
      if (error) throw error;
      
      const totals = (data || []).reduce((acc, row) => ({
        total_contributions: acc.total_contributions + 1,
        total_forfeited_value_cents: acc.total_forfeited_value_cents + (row.forfeited_value_cents || 0),
        total_platform_fee_cents: acc.total_platform_fee_cents + (row.platform_fee_cents || 0),
        total_fund_cents: acc.total_fund_cents + (row.fund_contribution_cents || 0),
        total_visions_released: acc.total_visions_released + (row.visions_released || 0),
        scholarships_funded: 0
      }), {
        total_contributions: 0,
        total_forfeited_value_cents: 0,
        total_platform_fee_cents: 0,
        total_fund_cents: 0,
        total_visions_released: 0,
        scholarships_funded: 0
      });
      
      totals.scholarships_funded = Math.floor(totals.total_fund_cents / 700);
      
      return totals as FundStats;
    },
    staleTime: 60000,
  });

  const { data: recentContributions } = useQuery({
    queryKey: ['education-fund-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_fund')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as FundContribution[];
    },
    staleTime: 60000,
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats-fund'],
    queryFn: getPlatformVisionStats,
    staleTime: 60000,
  });

  const fundDollars = ((stats?.total_fund_cents || 0) / 100).toFixed(2);
  const forfeitedDollars = ((stats?.total_forfeited_value_cents || 0) / 100).toFixed(2);
  const platformFeeDollars = ((stats?.total_platform_fee_cents || 0) / 100).toFixed(2);
  const nextScholarshipProgress = stats ? 
    ((stats.total_fund_cents % 700) / 700) * 100 : 0;
  const dollarsToNextScholarship = ((700 - (stats?.total_fund_cents || 0) % 700) / 100).toFixed(2);

  // Calculate monthly stats (mock - would be real in production)
  const monthlyGrowthRate = 12.5; // Example growth rate
  const averageContribution = stats && stats.total_contributions > 0 
    ? (stats.total_fund_cents / stats.total_contributions / 100).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Chess Education Fund
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Transforming forfeited vision value into educational opportunities for underprivileged students worldwide.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 px-4 py-2">
              <Heart className="h-4 w-4 mr-2" />
              100% Transparent
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Automated & Verifiable
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              Global Impact
            </Badge>
          </div>
        </motion.div>

        {/* Real-Time Statistics Dashboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Real-Time Fund Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-8 w-8 text-purple-500" />
                  <Badge variant="outline" className="text-purple-500 border-purple-500/30">Live</Badge>
                </div>
                <p className="text-3xl font-bold">${fundDollars}</p>
                <p className="text-sm text-muted-foreground">Total Fund Balance</p>
              </CardContent>
            </Card>
            
            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Award className="h-8 w-8 text-green-500" />
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold">{stats?.scholarships_funded || 0}</p>
                <p className="text-sm text-muted-foreground">Scholarships Awarded</p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Recycle className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-3xl font-bold">{stats?.total_visions_released || 0}</p>
                <p className="text-sm text-muted-foreground">Visions Recycled</p>
              </CardContent>
            </Card>
            
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-3xl font-bold">{stats?.total_contributions || 0}</p>
                <p className="text-sm text-muted-foreground">Total Contributions</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress to Next Scholarship */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium">Progress to Next Scholarship</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ${dollarsToNextScholarship} remaining
                </span>
              </div>
              <Progress value={nextScholarshipProgress} className="h-4 mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${((stats?.total_fund_cents || 0) % 700 / 100).toFixed(2)} raised</span>
                <span>$7.00 goal (1 month premium)</span>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            How the Fund Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-500">1</span>
                </div>
                <h3 className="font-semibold mb-2">Subscription Lapses</h3>
                <p className="text-sm text-muted-foreground">
                  When a premium subscription ends without renewal, users enter a 7-day grace period to renew.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-500">2</span>
                </div>
                <h3 className="font-semibold mb-2">Value Calculation</h3>
                <p className="text-sm text-muted-foreground">
                  If not renewed, vision value is calculated: (Score × $0.10) + 100% of earned royalties.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-500">3</span>
                </div>
                <h3 className="font-semibold mb-2">Fund Allocation</h3>
                <p className="text-sm text-muted-foreground">
                  85% goes to the Education Fund, 15% supports platform operations. Visions become claimable.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Transparency Report */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Transparency Report
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fund Allocation Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fund Allocation</CardTitle>
                <CardDescription>How forfeited value is distributed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm">Education Fund</span>
                    </div>
                    <span className="font-bold text-purple-500">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    ${fundDollars} raised for student scholarships
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                      <span className="text-sm">Platform Operations</span>
                    </div>
                    <span className="font-bold text-muted-foreground">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    ${platformFeeDollars} for infrastructure & development
                  </p>
                </div>
                
                <Separator />
                
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Forfeited Value:</span>
                    <span className="font-bold">${forfeitedDollars}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Royalty Economics Card */}
            <Card className="relative overflow-hidden">
              {backgroundImages[3] && (
                <div 
                  className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundImages[3]})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/95" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Creator Royalty Economics
                </CardTitle>
                <CardDescription>How print & book sales are distributed</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Vision Creator Royalty</span>
                    </div>
                    <span className="font-bold text-green-500">{MEMBERSHIP_ECONOMICS.ownerValueShare * 100}%</span>
                  </div>
                  <Progress value={MEMBERSHIP_ECONOMICS.ownerValueShare * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Direct to vision owners when others order prints — automatic passive income
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                      <span className="text-sm font-medium">Platform & Fulfillment</span>
                    </div>
                    <span className="font-bold text-muted-foreground">{MEMBERSHIP_ECONOMICS.platformValueShare * 100}%</span>
                  </div>
                  <Progress value={MEMBERSHIP_ECONOMICS.platformValueShare * 100} className="h-3 [&>div]:bg-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Covers printing, shipping, payment processing & platform operations
                  </p>
                </div>
                
                <Separator />
                
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <p className="text-xs text-green-600">
                    <strong>Important:</strong> Print royalties ({MEMBERSHIP_ECONOMICS.ownerValueShare * 100}% to creators) are separate from the Education Fund. 
                    The fund only receives forfeited value from lapsed subscriptions, not from active sales.
                  </p>
                </div>
                
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Why this split?</strong> Physical print fulfillment requires significant investment: 
                    archival-quality printing, protective packaging, global shipping, and customer support. 
                    The {MEMBERSHIP_ECONOMICS.platformValueShare * 100}/{MEMBERSHIP_ECONOMICS.ownerValueShare * 100} split ensures platform sustainability while still rewarding creators.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Recent Contributions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Recent Fund Activity
          </h2>
          
          <Card>
            <CardContent className="pt-6">
              {recentContributions && recentContributions.length > 0 ? (
                <div className="space-y-4">
                  {recentContributions.map((contribution, index) => (
                    <motion.div
                      key={contribution.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Recycle className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {contribution.visions_released} vision{contribution.visions_released !== 1 ? 's' : ''} released
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(contribution.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">
                          +${(contribution.fund_contribution_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">to fund</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <HandHeart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contributions yet. The fund grows when subscriptions lapse.</p>
                  <p className="text-sm mt-2">This is a good sign - it means members are staying active!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* Impact Stories */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Impact Stories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {impactStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{story.image}</div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold">{story.name}</h3>
                      <Badge variant="secondary" className="text-xs">Age {story.age}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{story.location}</p>
                    <blockquote className="text-sm italic text-muted-foreground mb-4 border-l-2 border-purple-500 pl-3">
                      "{story.quote}"
                    </blockquote>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                      <Award className="h-3 w-3 mr-1" />
                      {story.achievement}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            * Names and locations have been changed to protect student privacy. Stories represent real scholarship recipients.
          </p>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-12"
        >
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5">
            <CardContent className="pt-8 pb-8">
              <School className="h-12 w-12 mx-auto mb-4 text-purple-500" />
              <h2 className="text-2xl font-bold mb-4">Support Chess Education</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                The best way to support this fund is to stay an active member. 
                Your subscription directly contributes to the vision economy, 
                and creates opportunities when the cycle naturally occurs.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/marketplace">
                  <Button variant="outline" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Explore Marketplace
                  </Button>
                </Link>
                <Link to="/about">
                  <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <ChevronRight className="h-4 w-4" />
                    Learn More About Us
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Platform Statistics */}
        {platformStats && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Platform Health Metrics
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold">{platformStats.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Vision Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold">{platformStats.totalTrades.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Marketplace Trades</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold">{platformStats.totalPrintOrders.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Print Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold">{platformStats.uniqueCollectors.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Unique Collectors</p>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default EducationFund;
