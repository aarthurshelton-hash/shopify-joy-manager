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

// Import palette art assets
import artdecoArt from '@/assets/palettes/artdeco.jpg';
import autumnArt from '@/assets/palettes/autumn.jpg';
import cosmicArt from '@/assets/palettes/cosmic.jpg';
import cyberpunkArt from '@/assets/palettes/cyberpunk.jpg';
import desertArt from '@/assets/palettes/desert.jpg';
import egyptianArt from '@/assets/palettes/egyptian.jpg';
import greyscaleArt from '@/assets/palettes/greyscale.jpg';
import hotcoldArt from '@/assets/palettes/hotcold.jpg';
import japaneseArt from '@/assets/palettes/japanese.jpg';
import medievalArt from '@/assets/palettes/medieval.jpg';
import modernArt from '@/assets/palettes/modern.jpg';
import nordicArt from '@/assets/palettes/nordic.jpg';
import oceanArt from '@/assets/palettes/ocean.jpg';
import romanArt from '@/assets/palettes/roman.jpg';
import tropicalArt from '@/assets/palettes/tropical.jpg';
import vintageArt from '@/assets/palettes/vintage.jpg';

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

// Palette art entries for color themes
const PALETTE_ART_ENTRIES: Omit<AIArtItem, 'id' | 'created_at' | 'created_by'>[] = [
  {
    title: 'Hot & Cold',
    description: 'Fire and ice theme representing the eternal battle between warmth and cool tones',
    image_path: hotcoldArt,
    prompt: 'Fire and ice chess theme, flames and frost merging',
    category: 'palette',
    tags: ['hot', 'cold', 'fire', 'ice', 'temperature'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Medieval',
    description: 'Castle walls and armored knights in a medieval kingdom setting',
    image_path: medievalArt,
    prompt: 'Medieval castle and knights, royal chess atmosphere',
    category: 'palette',
    tags: ['medieval', 'castle', 'knights', 'kingdom', 'royal'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Egyptian',
    description: 'Ancient pyramids and pharaohs in the golden sands of Egypt',
    image_path: egyptianArt,
    prompt: 'Egyptian pyramids and pharaohs, golden desert chess',
    category: 'palette',
    tags: ['egyptian', 'pyramid', 'pharaoh', 'gold', 'desert'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Roman Empire',
    description: 'Gladiators and emperors in the grandeur of ancient Rome',
    image_path: romanArt,
    prompt: 'Roman colosseum and gladiators, imperial chess',
    category: 'palette',
    tags: ['roman', 'empire', 'gladiator', 'colosseum', 'ancient'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Modern',
    description: 'Clean contemporary aesthetics with sleek geometric design',
    image_path: modernArt,
    prompt: 'Modern minimalist chess, clean geometric design',
    category: 'palette',
    tags: ['modern', 'minimalist', 'geometric', 'clean', 'contemporary'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Greyscale',
    description: 'Timeless black and white photography aesthetic',
    image_path: greyscaleArt,
    prompt: 'Black and white chess, classic monochrome photography',
    category: 'palette',
    tags: ['greyscale', 'monochrome', 'black', 'white', 'classic'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Japanese',
    description: 'Cherry blossoms and samurai in traditional Japanese aesthetics',
    image_path: japaneseArt,
    prompt: 'Japanese cherry blossoms and samurai, zen chess',
    category: 'palette',
    tags: ['japanese', 'cherry blossom', 'samurai', 'zen', 'traditional'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Nordic',
    description: 'Vikings and northern lights in the frozen Nordic lands',
    image_path: nordicArt,
    prompt: 'Nordic vikings and aurora borealis, frost chess',
    category: 'palette',
    tags: ['nordic', 'viking', 'aurora', 'frost', 'scandinavia'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Art Deco',
    description: 'Roaring twenties glamour with geometric luxury patterns',
    image_path: artdecoArt,
    prompt: 'Art deco 1920s glamour, geometric gold patterns chess',
    category: 'palette',
    tags: ['art deco', '1920s', 'glamour', 'gold', 'geometric'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Tropical',
    description: 'Lush paradise with exotic flora and vibrant colors',
    image_path: tropicalArt,
    prompt: 'Tropical paradise, exotic flowers and palm chess',
    category: 'palette',
    tags: ['tropical', 'paradise', 'exotic', 'palm', 'vibrant'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Cyberpunk',
    description: 'Neon-lit dystopian future with high-tech aesthetics',
    image_path: cyberpunkArt,
    prompt: 'Cyberpunk neon city, futuristic tech chess',
    category: 'palette',
    tags: ['cyberpunk', 'neon', 'futuristic', 'tech', 'dystopia'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Autumn',
    description: 'Fall foliage with warm amber and golden leaves',
    image_path: autumnArt,
    prompt: 'Autumn fall leaves, warm golden forest chess',
    category: 'palette',
    tags: ['autumn', 'fall', 'leaves', 'golden', 'warm'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Ocean',
    description: 'Deep sea mysteries with coral reefs and marine life',
    image_path: oceanArt,
    prompt: 'Ocean depths, coral reef underwater chess',
    category: 'palette',
    tags: ['ocean', 'sea', 'coral', 'underwater', 'marine'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Desert',
    description: 'Golden dunes and ancient oases under blazing sun',
    image_path: desertArt,
    prompt: 'Desert dunes and oasis, golden sand chess',
    category: 'palette',
    tags: ['desert', 'dunes', 'sand', 'oasis', 'sun'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Cosmic',
    description: 'Stars and galaxies in the infinite expanse of space',
    image_path: cosmicArt,
    prompt: 'Cosmic space galaxies, stellar nebula chess',
    category: 'palette',
    tags: ['cosmic', 'space', 'galaxy', 'stars', 'nebula'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
  {
    title: 'Vintage',
    description: 'Nostalgic retro aesthetics with sepia-toned elegance',
    image_path: vintageArt,
    prompt: 'Vintage retro sepia, nostalgic classic chess',
    category: 'palette',
    tags: ['vintage', 'retro', 'sepia', 'nostalgic', 'classic'],
    is_active: true,
    usage_locations: ['Palette Selector', 'Creative Mode'],
  },
];

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

  // Combine static and DB art items (excluding palette art which has its own section)
  const allArtItems: AIArtItem[] = [
    ...STATIC_ART_ENTRIES.map((item, i) => ({
      ...item,
      id: `static-${i}`,
      created_at: new Date().toISOString(),
      created_by: null,
    })),
    ...dbArtItems,
  ];

  // Total count including palette art
  const totalAssetCount = allArtItems.length + PALETTE_ART_ENTRIES.length;

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{totalAssetCount}</div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {allArtItems.filter(a => a.is_active).length + PALETTE_ART_ENTRIES.length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-violet-500">
                {PALETTE_ART_ENTRIES.length}
              </div>
              <div className="text-sm text-muted-foreground">Palette Art</div>
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

        {/* Color Palettes Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
              <Palette className="h-5 w-5 text-violet-500" />
            </div>
            <h2 className="text-xl font-semibold">Color Palette Art</h2>
            <Badge variant="secondary" className="text-xs">
              {PALETTE_ART_ENTRIES.length} themes
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {PALETTE_ART_ENTRIES.map((item, i) => (
              <Card 
                key={`palette-${i}`}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={item.image_path}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-violet-500/90 text-white text-xs">
                    Palette
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Other Art Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <ImageIcon className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold">Hero & Feature Art</h2>
            <Badge variant="secondary" className="text-xs">
              {STATIC_ART_ENTRIES.length + dbArtItems.length} assets
            </Badge>
          </div>
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
