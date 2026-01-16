import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Database, Brain, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function CompetitiveMoatVisual() {
  return (
    <div className="space-y-6">
      {/* Moat Layers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MoatCard
          icon={<FileText className="h-5 w-5" />}
          title="Patent Protection"
          status="Pending"
          statusColor="amber"
          description="Temporal Signature™ extraction method patent application filed"
          strength={85}
        />
        <MoatCard
          icon={<Database className="h-5 w-5" />}
          title="Data Network Effect"
          status="Active"
          statusColor="green"
          description="Every analysis adds to our pattern library—competitors start from zero"
          strength={70}
        />
        <MoatCard
          icon={<Brain className="h-5 w-5" />}
          title="Domain Expertise"
          status="Strong"
          statusColor="green"
          description="Deep chess + code pattern recognition knowledge built over years"
          strength={90}
        />
        <MoatCard
          icon={<Clock className="h-5 w-5" />}
          title="First-Mover"
          status="Established"
          statusColor="blue"
          description="First to market with universal temporal pattern recognition"
          strength={75}
        />
      </div>

      {/* Why This Can't Be Copied */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Why This Can't Be Easily Replicated
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* What we have */}
            <div>
              <h4 className="font-semibold text-green-500 flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Our Advantages
              </h4>
              <ul className="space-y-2">
                <Advantage text="Patent-pending Temporal Signature™ methodology" />
                <Advantage text="Multi-domain proof (chess → code = universal)" />
                <Advantage text="Growing pattern library with each analysis" />
                <Advantage text="Unique archetype classification system" />
                <Advantage text="Proven prediction accuracy metrics" />
                <Advantage text="Integrated monetization (Hustlenomics)" />
              </ul>
            </div>

            {/* Competitor barriers */}
            <div>
              <h4 className="font-semibold text-destructive flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4" />
                Competitor Barriers
              </h4>
              <ul className="space-y-2">
                <Barrier text="Would need to invent different methodology (patent)" />
                <Barrier text="Must build pattern library from scratch" />
                <Barrier text="No cross-domain validation possible" />
                <Barrier text="Can't replicate our archetype taxonomy" />
                <Barrier text="Years behind on domain expertise" />
                <Barrier text="No established user base for data flywheel" />
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Landscape</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Capability</th>
                  <th className="text-center py-2 px-3">En Pensent</th>
                  <th className="text-center py-2 px-3">Chess.com</th>
                  <th className="text-center py-2 px-3">GitHub Copilot</th>
                  <th className="text-center py-2 px-3">Traditional ML</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow 
                  feature="Universal pattern extraction"
                  enpensent={true}
                  chesscom={false}
                  copilot={false}
                  ml={false}
                />
                <ComparisonRow 
                  feature="Cross-domain transfer"
                  enpensent={true}
                  chesscom={false}
                  copilot={false}
                  ml={false}
                />
                <ComparisonRow 
                  feature="No training required"
                  enpensent={true}
                  chesscom={false}
                  copilot={false}
                  ml={false}
                />
                <ComparisonRow 
                  feature="Outcome prediction"
                  enpensent={true}
                  chesscom="partial"
                  copilot={false}
                  ml={true}
                />
                <ComparisonRow 
                  feature="Visual fingerprinting"
                  enpensent={true}
                  chesscom={false}
                  copilot={false}
                  ml={false}
                />
                <ComparisonRow 
                  feature="Archetype classification"
                  enpensent={true}
                  chesscom="partial"
                  copilot={false}
                  ml="partial"
                />
                <ComparisonRow 
                  feature="Real-world scanning"
                  enpensent={true}
                  chesscom={false}
                  copilot={false}
                  ml={false}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Defensibility Timeline */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Defensibility Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/30" />
            <div className="space-y-6 ml-10">
              <TimelineItem 
                year="Now"
                title="First-Mover + Patent Pending"
                description="Unique methodology protected, building initial pattern library"
                current
              />
              <TimelineItem 
                year="Year 1"
                title="Network Effects Compound"
                description="10,000+ patterns analyzed, prediction accuracy improves 20%+"
              />
              <TimelineItem 
                year="Year 2"
                title="Data Moat Established"
                description="100,000+ patterns, new domains added, impossible to catch up"
              />
              <TimelineItem 
                year="Year 3+"
                title="Industry Standard"
                description="Platform becomes default for pattern recognition across industries"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MoatCard({ 
  icon, 
  title, 
  status, 
  statusColor, 
  description, 
  strength 
}: { 
  icon: React.ReactNode;
  title: string;
  status: string;
  statusColor: 'green' | 'amber' | 'blue';
  description: string;
  strength: number;
}) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    blue: 'bg-blue-500/10 text-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <Badge className={colorClasses[statusColor]}>
              {status}
            </Badge>
          </div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground mb-3">{description}</p>
          
          {/* Strength bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strength}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">{strength}% strength</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Advantage({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
      <span>{text}</span>
    </li>
  );
}

function Barrier({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{text}</span>
    </li>
  );
}

function ComparisonRow({ 
  feature, 
  enpensent, 
  chesscom, 
  copilot, 
  ml 
}: { 
  feature: string;
  enpensent: boolean | 'partial';
  chesscom: boolean | 'partial';
  copilot: boolean | 'partial';
  ml: boolean | 'partial';
}) {
  const renderCheck = (value: boolean | 'partial') => {
    if (value === true) return <span className="text-green-500">✓</span>;
    if (value === 'partial') return <span className="text-amber-500">◐</span>;
    return <span className="text-muted-foreground">✗</span>;
  };

  return (
    <tr className="border-b border-muted/50">
      <td className="py-2 px-3">{feature}</td>
      <td className="py-2 px-3 text-center font-bold">{renderCheck(enpensent)}</td>
      <td className="py-2 px-3 text-center">{renderCheck(chesscom)}</td>
      <td className="py-2 px-3 text-center">{renderCheck(copilot)}</td>
      <td className="py-2 px-3 text-center">{renderCheck(ml)}</td>
    </tr>
  );
}

function TimelineItem({ 
  year, 
  title, 
  description, 
  current 
}: { 
  year: string;
  title: string;
  description: string;
  current?: boolean;
}) {
  return (
    <div className="relative">
      <div className={`absolute -left-10 w-4 h-4 rounded-full border-2 ${current ? 'bg-primary border-primary' : 'bg-background border-primary/50'}`} />
      <div>
        <Badge variant={current ? 'default' : 'secondary'} className="mb-1">{year}</Badge>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
