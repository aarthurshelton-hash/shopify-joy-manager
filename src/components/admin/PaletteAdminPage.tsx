import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { colorPalettes, PaletteId, PieceType } from '@/lib/chess/pieceColors';
import { 
  isUserAdmin, 
  getPaletteOverrides, 
  savePaletteOverride, 
  deletePaletteOverride,
  countLinkedVisualizations,
  PaletteOverride 
} from '@/lib/admin/paletteAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Shield, 
  Palette, 
  Save, 
  RotateCcw, 
  Loader2, 
  Check, 
  AlertTriangle,
  Eye,
  Users
} from 'lucide-react';

const PIECE_TYPES: PieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];
const PIECE_NAMES: Record<PieceType, string> = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
};

const PaletteAdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [overrides, setOverrides] = useState<PaletteOverride[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<PaletteId | null>(null);
  const [editColors, setEditColors] = useState<{
    white: Record<PieceType, string>;
    black: Record<PieceType, string>;
  } | null>(null);
  const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      
      const adminStatus = await isUserAdmin(user.id);
      if (!adminStatus) {
        toast.error('Access denied', { description: 'Admin privileges required' });
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
      await loadData();
      setIsLoading(false);
    };
    
    checkAdmin();
  }, [user, navigate]);
  
  const loadData = async () => {
    const { data } = await getPaletteOverrides();
    setOverrides(data);
    
    // Load linked visualization counts
    const counts: Record<string, number> = {};
    for (const palette of colorPalettes.filter(p => p.id !== 'custom')) {
      counts[palette.id] = await countLinkedVisualizations(palette.id);
    }
    setLinkedCounts(counts);
  };
  
  const handleSelectPalette = (paletteId: PaletteId) => {
    const palette = colorPalettes.find(p => p.id === paletteId);
    if (!palette) return;
    
    // Check if there's an override
    const override = overrides.find(o => o.palette_id === paletteId);
    
    setSelectedPalette(paletteId);
    setEditColors({
      white: override?.white_colors || { ...palette.white },
      black: override?.black_colors || { ...palette.black },
    });
  };
  
  const handleColorChange = (side: 'white' | 'black', piece: PieceType, color: string) => {
    if (!editColors) return;
    
    setEditColors({
      ...editColors,
      [side]: {
        ...editColors[side],
        [piece]: color,
      },
    });
  };
  
  const handleSave = async () => {
    if (!selectedPalette || !editColors || !user) return;
    
    const linkedCount = linkedCounts[selectedPalette] || 0;
    if (linkedCount > 0) {
      setShowConfirmDialog(true);
      return;
    }
    
    await performSave();
  };
  
  const performSave = async () => {
    if (!selectedPalette || !editColors || !user) return;
    
    setIsSaving(true);
    setShowConfirmDialog(false);
    
    const { error, version } = await savePaletteOverride(
      selectedPalette,
      editColors.white,
      editColors.black,
      user.id
    );
    
    if (error) {
      toast.error('Failed to save', { description: error.message });
    } else {
      toast.success('Palette updated!', { 
        description: `Version ${version} saved. ${linkedCounts[selectedPalette] || 0} visualizations will use the new colors.` 
      });
      await loadData();
    }
    
    setIsSaving(false);
  };
  
  const handleRevert = async () => {
    if (!selectedPalette) return;
    
    setIsSaving(true);
    const { error } = await deletePaletteOverride(selectedPalette);
    
    if (error) {
      toast.error('Failed to revert', { description: error.message });
    } else {
      toast.success('Reverted to defaults');
      handleSelectPalette(selectedPalette);
      await loadData();
    }
    
    setIsSaving(false);
  };
  
  const getOriginalPalette = (paletteId: PaletteId) => {
    return colorPalettes.find(p => p.id === paletteId);
  };
  
  const hasOverride = (paletteId: string) => {
    return overrides.some(o => o.palette_id === paletteId);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!isAdmin) return null;
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Palette Administration</h1>
            <p className="text-muted-foreground text-sm">
              Modify featured palette colors. Changes propagate to all linked visualizations.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Palette List */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Featured Palettes
            </h2>
            {colorPalettes.filter(p => p.id !== 'custom').map(palette => (
              <Card 
                key={palette.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedPalette === palette.id ? 'border-primary ring-1 ring-primary/20' : ''
                }`}
                onClick={() => handleSelectPalette(palette.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{palette.name}</span>
                    <div className="flex items-center gap-1.5">
                      {hasOverride(palette.id) && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Modified
                        </Badge>
                      )}
                      {linkedCounts[palette.id] > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          <Users className="h-2.5 w-2.5" />
                          {linkedCounts[palette.id]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {PIECE_TYPES.map(pt => (
                      <div 
                        key={`w-${pt}`}
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: palette.white[pt] }}
                      />
                    ))}
                    {PIECE_TYPES.map(pt => (
                      <div 
                        key={`b-${pt}`}
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: palette.black[pt] }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Editor */}
          <div className="md:col-span-2">
            {selectedPalette && editColors ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        {getOriginalPalette(selectedPalette)?.name}
                      </CardTitle>
                      <CardDescription>
                        {getOriginalPalette(selectedPalette)?.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {hasOverride(selectedPalette) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRevert}
                          disabled={isSaving}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Revert
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* White Pieces */}
                  <div>
                    <h3 className="font-medium mb-3 text-sm">
                      {getOriginalPalette(selectedPalette)?.legendTheme.whiteEmoji} White Pieces
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {PIECE_TYPES.map(pt => (
                        <div key={`w-${pt}`} className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">
                            {PIECE_NAMES[pt]}
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={editColors.white[pt]}
                              onChange={(e) => handleColorChange('white', pt, e.target.value)}
                              className="w-10 h-8 p-0.5 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={editColors.white[pt]}
                              onChange={(e) => handleColorChange('white', pt, e.target.value)}
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Black Pieces */}
                  <div>
                    <h3 className="font-medium mb-3 text-sm">
                      {getOriginalPalette(selectedPalette)?.legendTheme.blackEmoji} Black Pieces
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {PIECE_TYPES.map(pt => (
                        <div key={`b-${pt}`} className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">
                            {PIECE_NAMES[pt]}
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              value={editColors.black[pt]}
                              onChange={(e) => handleColorChange('black', pt, e.target.value)}
                              className="w-10 h-8 p-0.5 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={editColors.black[pt]}
                              onChange={(e) => handleColorChange('black', pt, e.target.value)}
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Preview */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3 text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Color Preview
                    </h3>
                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">White</span>
                        <div className="flex gap-1">
                          {PIECE_TYPES.map(pt => (
                            <div 
                              key={`preview-w-${pt}`}
                              className="w-8 h-8 rounded-md shadow-sm"
                              style={{ backgroundColor: editColors.white[pt] }}
                              title={PIECE_NAMES[pt]}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Black</span>
                        <div className="flex gap-1">
                          {PIECE_TYPES.map(pt => (
                            <div 
                              key={`preview-b-${pt}`}
                              className="w-8 h-8 rounded-md shadow-sm"
                              style={{ backgroundColor: editColors.black[pt] }}
                              title={PIECE_NAMES[pt]}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Palette className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a palette to edit its colors
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Palette Update
            </DialogTitle>
            <DialogDescription>
              This palette is linked to <strong>{linkedCounts[selectedPalette || ''] || 0}</strong> visualizations.
              Saving these changes will affect how all linked visualizations render.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={performSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Confirm Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaletteAdminPage;
