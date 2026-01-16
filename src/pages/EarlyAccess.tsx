import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Users, Zap, Gift, CheckCircle, ArrowRight, Brain } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function EarlyAccess() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Store email (in production, this would go to a database)
    console.log('Early access signup:', email);
    setSubmitted(true);
    toast.success('You\'re on the list! Check your email for next steps.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Badge variant="outline" className="border-amber-500/50 text-amber-500">
              Limited Early Access
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-6 bg-primary/10 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            First 100 Users
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Be First to See the Future
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            En Pensent predicts outcomes from patterns—no training required. 
            Get early access and help shape a technology that could change everything.
          </p>
        </motion.div>

        {!submitted ? (
          <>
            {/* Email Capture */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-md mx-auto mb-16"
            >
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
                <Button type="submit" size="lg" className="px-6">
                  Get Access
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                No spam. Just early access and updates.
              </p>
            </motion.div>

            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <BenefitCard
                icon={<Gift className="w-6 h-6" />}
                title="Free Forever"
                description="Early adopters get permanent free access to core features"
              />
              <BenefitCard
                icon={<Users className="w-6 h-6" />}
                title="Shape the Product"
                description="Direct influence on features and roadmap"
              />
              <BenefitCard
                icon={<Zap className="w-6 h-6" />}
                title="First to Know"
                description="Be the first to use new domains as they launch"
              />
            </div>

            {/* Social Proof */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">47</div>
                    <div className="text-sm text-muted-foreground">People signed up</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">53</div>
                    <div className="text-sm text-muted-foreground">Spots remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">2</div>
                    <div className="text-sm text-muted-foreground">Domains live</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Try it Now */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-16 text-center"
            >
              <p className="text-muted-foreground mb-4">Want to see it in action first?</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/code-analysis')}>
                  <Brain className="w-4 h-4 mr-2" />
                  Try Code Analysis
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try Chess Analysis
                </Button>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">You're In! 🎉</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Welcome to the future. Check your email for your early access link and next steps.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/code-analysis')}>
                Start Analyzing Code
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Try Chess First
              </Button>
            </div>
          </motion.div>
        )}

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">Questions?</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <FAQItem
              question="What is En Pensent?"
              answer="A universal pattern recognition system that predicts outcomes from sequential data—without any training. It works on chess games, code repositories, and soon: music, health data, and more."
            />
            <FAQItem
              question="Why early access?"
              answer="We're building something fundamentally new. Early users help us validate the technology across real use cases and shape features that matter."
            />
            <FAQItem
              question="Is it really free?"
              answer="For the first 100 users, yes—permanently. We'll always have a free tier, but early adopters get expanded limits and priority access forever."
            />
            <FAQItem
              question="What data do you collect?"
              answer="Only what you explicitly share for analysis. We don't store your repositories or games—just the patterns we extract (with your permission)."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border bg-card text-center"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{question}</h3>
        <p className="text-sm text-muted-foreground">{answer}</p>
      </CardContent>
    </Card>
  );
}
