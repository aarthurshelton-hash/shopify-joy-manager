import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Crown, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Palette,
  Calendar,
  Tag,
  MapPin
} from 'lucide-react';

// Import AI art assets
import uploadSectionHero from '@/assets/ai-art/upload-section-hero.jpg';

interface AIArtItem {
  id: string;
  title: string;
  description: string | null;
  image_path: string;
  prompt: string | null;
  category: string;
  tags: string[];
  is_active: boolean;
  usage_locations: string[];
  created_at: string;
  created_by: string | null;
}

// Static art entries that are in the codebase
const STATIC_ART_ENTRIES: Omit<AIArtItem, 'id' | 'created_at' | 'created_by'>[] = [
  {
    title: 'Upload Section Hero',
    description: 'A majestic chess visualization artwork representing the fusion of classic chess mastery and modern digital art. Features golden chess king, colorful data streams, and cosmic atmosphere.',
    image_path: uploadSectionHero,
    prompt: 'A majestic chess visualization artwork representing the fusion of classic chess mastery and modern digital art. Ultra high resolution. A grand composition featuring golden chess pieces (particularly a king) emerging from colorful flowing data streams and abstract color gradients. The scene blends rich jewel tones - deep navy blues, warm ambers, and royal golds - with ethereal light beams and geometric patterns suggesting game notation transforming into beautiful art. Chess boards fragment into artistic color palettes floating in a cosmic space. The style is sophisticated, premium, and evokes both strategic brilliance and artistic beauty. Digital painting with oil paint texture, dramatic lighting, cinematic 16:9 aspect ratio.',
    category: 'hero',
    tags: ['chess', 'king', 'cosmic', 'golden', 'data streams', 'visualization'],
    is_active: true,
    usage_locations: ['Homepage - Upload Your Game Section'],
  },
];

const AdminAIArtBank: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbArtItems, setDbArtItems] = useState<AIArtItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AIArtItem | null>(null);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (!data) {
          toast.error('Access denied. Admin privileges required.');
          navigate('/');
          return;
        }

        setIsAdmin(true);
        loadDbArtItems();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  const loadDbArtItems = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_art_bank')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbArtItems(data || []);
    } catch (error) {
      console.error('Error loading AI art:', error);
    }
  };

  const toggleActive = async (item: AIArtItem) => {
    if (!item.id.startsWith('static-')) {
      try {
        const { error } = await supabase
          .from('ai_art_bank')
          .update({ is_active: !item.is_active })
          .eq('id', item.id);

        if (error) throw error;
        toast.success(`Art ${item.is_active ? 'deactivated' : 'activated'}`);
        loadDbArtItems();
      } catch (error) {
        console.error('Error toggling art status:', error);
        toast.error('Failed to update art status');
      }
    }
  };

  const deleteArt = async (item: AIArtItem) => {
    if (item.id.startsWith('static-')) {
      toast.error('Static art assets cannot be deleted');
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_art_bank')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      toast.success('Art deleted successfully');
      loadDbArtItems();
    } catch (error) {
      console.error('Error deleting art:', error);
      toast.error('Failed to delete art');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Combine static and DB art items
  const allArtItems: AIArtItem[] = [
    ...STATIC_ART_ENTRIES.map((item, i) => ({
      ...item,
      id: `static-${i}`,
      created_at: new Date().toISOString(),
      created_by: null,
    })),
    ...dbArtItems,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-primary/20">
                <Palette className="h-6 w-6 text-amber-500" />
              </div>
              <h1 className="text-3xl font-royal font-bold tracking-wide">
                AI Art Bank
              </h1>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                <Crown className="h-3 w-3 mr-1" />
                CEO Access
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage AI-generated art assets used throughout the platform
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/ceo-dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{allArtItems.length}</div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {allArtItems.filter(a => a.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-500">
                {STATIC_ART_ENTRIES.length}
              </div>
              <div className="text-sm text-muted-foreground">Static Assets</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">
                {dbArtItems.length}
              </div>
              <div className="text-sm text-muted-foreground">Database Assets</div>
            </CardContent>
          </Card>
        </div>

        {/* Art Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allArtItems.map((item) => (
            <Card 
              key={item.id} 
              className={`overflow-hidden group hover:shadow-lg transition-all duration-300 ${
                !item.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Image Preview */}
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  src={item.image_path}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {item.id.startsWith('static-') ? (
                    <Badge className="bg-amber-500/90 text-white">
                      Static
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Database</Badge>
                  )}
                  {!item.is_active && (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!item.id.startsWith('static-') && (
                    <>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => toggleActive(item)}
                      >
                        {item.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => deleteArt(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
                
                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 4).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Usage locations */}
                {item.usage_locations.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{item.usage_locations.join(', ')}</span>
                  </div>
                )}
                
                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {item.id.startsWith('static-') 
                      ? 'Built-in asset' 
                      : new Date(item.created_at).toLocaleDateString()
                    }
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {item.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {allArtItems.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Art Assets</h3>
            <p className="text-muted-foreground">
              AI-generated art will appear here as it's created
            </p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminAIArtBank;
