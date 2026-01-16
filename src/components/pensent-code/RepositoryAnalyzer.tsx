import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GitBranch, Key, ChevronDown, Loader2, Search } from 'lucide-react';
import { useCodeAnalysis } from '@/hooks/useCodeAnalysis';

interface RepositoryAnalyzerProps {
  onAnalysisComplete?: () => void;
}

export function RepositoryAnalyzer({ onAnalysisComplete }: RepositoryAnalyzerProps) {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const { analyzeRepository, isAnalyzing } = useCodeAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repositoryUrl.trim()) return;

    const result = await analyzeRepository(repositoryUrl, githubToken || undefined);
    if (result && onAnalysisComplete) {
      onAnalysisComplete();
    }
  };

  const exampleRepos = [
    { name: 'React', url: 'facebook/react' },
    { name: 'Vue', url: 'vuejs/vue' },
    { name: 'Next.js', url: 'vercel/next.js' },
    { name: 'Tailwind CSS', url: 'tailwindlabs/tailwindcss' },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Analyze Repository
        </CardTitle>
        <CardDescription>
          Enter a GitHub repository URL to analyze its code evolution patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repository">Repository URL</Label>
            <div className="flex gap-2">
              <Input
                id="repository"
                placeholder="github.com/owner/repo or owner/repo"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                disabled={isAnalyzing}
              />
              <Button type="submit" disabled={isAnalyzing || !repositoryUrl.trim()}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {exampleRepos.map((repo) => (
              <Button
                key={repo.url}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRepositoryUrl(repo.url)}
                disabled={isAnalyzing}
              >
                {repo.name}
              </Button>
            ))}
          </div>

          <Collapsible open={showToken} onOpenChange={setShowToken}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  GitHub Token (optional)
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showToken ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2">
                <Label htmlFor="token">Personal Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  disabled={isAnalyzing}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a token to access private repos or avoid rate limits. 
                  Token is not stored and only used for this analysis.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </CardContent>
    </Card>
  );
}
