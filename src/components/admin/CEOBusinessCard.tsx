import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Mail, Globe, Phone, Linkedin, X, Download, Share2, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

interface CEOBusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const CEOBusinessCard: React.FC<CEOBusinessCardProps> = ({ isOpen, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const ceoInfo = {
    name: 'Alec Arthur Shelton',
    title: 'Founder & Chief Executive Officer',
    company: 'En Pensent',
    tagline: 'Chess Art Prints',
    email: 'ceo@enpensent.com',
    website: 'www.enpensent.com',
    phone: '+1 (555) EP-CHESS',
    linkedin: 'linkedin.com/in/alec-shelton',
    motto: '"Transforming Chess History Into Art"',
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
N:Shelton;Alec;Arthur;;
FN:Alec Arthur Shelton
TITLE:Founder & Chief Executive Officer
ORG:En Pensent
EMAIL:ceo@enpensent.com
URL:https://www.enpensent.com
NOTE:${ceoInfo.motto}
END:VCARD`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Alec Arthur Shelton - CEO, En Pensent',
          text: `${ceoInfo.name}\n${ceoInfo.title}\n${ceoInfo.company}\n${ceoInfo.email}`,
          url: `https://${ceoInfo.website}`,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: download vCard
      const blob = new Blob([vCardData], { type: 'text/vcard' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'alec-shelton-ceo.vcf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Contact card downloaded');
    }
  };

  const handleDownload = () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
N:Shelton;Alec;Arthur;;
FN:Alec Arthur Shelton
TITLE:Founder & Chief Executive Officer
ORG:En Pensent
EMAIL:ceo@enpensent.com
URL:https://www.enpensent.com
NOTE:${ceoInfo.motto}
END:VCARD`;

    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alec-shelton-ceo.vcf';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('vCard downloaded successfully');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>CEO Business Card</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {/* Card Container with 3D perspective */}
          <div 
            className="relative w-full aspect-[1.75/1] cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ perspective: '1000px' }}
          >
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                /* Front of Card */
                <motion.div
                  key="front"
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -180, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Premium dark gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
                  
                  {/* Gold foil accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
                  
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                  </div>
                  
                  {/* Card Content */}
                  <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
                    {/* Top section - Logo and company */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={enPensentLogo} 
                          alt="En Pensent" 
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/20"
                        />
                        <div>
                          <h3 className="text-lg sm:text-xl font-royal font-bold tracking-wider text-amber-400 uppercase">
                            En Pensent
                          </h3>
                          <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400">
                            {ceoInfo.tagline}
                          </p>
                        </div>
                      </div>
                      <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400/80" />
                    </div>
                    
                    {/* Bottom section - Name and title */}
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-royal font-bold text-white tracking-wide mb-1">
                        {ceoInfo.name}
                      </h2>
                      <p className="text-sm sm:text-base text-amber-400/90 font-medium tracking-wide">
                        {ceoInfo.title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Flip hint */}
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 flex items-center gap-1">
                    <span>Tap to flip</span>
                    <motion.div
                      animate={{ rotateY: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      ↺
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                /* Back of Card */
                <motion.div
                  key="back"
                  initial={{ rotateY: -180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 180, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {/* Back gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-amber-50" />
                  
                  {/* Gold accent bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
                  
                  {/* Card Content */}
                  <div className="relative h-full p-6 sm:p-8 flex flex-col justify-between">
                    {/* Contact details */}
                    <div className="space-y-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(ceoInfo.email, 'Email'); }}
                        className="flex items-center gap-3 text-slate-700 hover:text-amber-600 transition-colors group w-full text-left"
                      >
                        <Mail className="h-4 w-4 text-amber-500" />
                        <span className="text-sm sm:text-base">{ceoInfo.email}</span>
                        {copied === 'Email' ? (
                          <Check className="h-3 w-3 ml-auto text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(`https://${ceoInfo.website}`, 'Website'); }}
                        className="flex items-center gap-3 text-slate-700 hover:text-amber-600 transition-colors group w-full text-left"
                      >
                        <Globe className="h-4 w-4 text-amber-500" />
                        <span className="text-sm sm:text-base">{ceoInfo.website}</span>
                        {copied === 'Website' ? (
                          <Check className="h-3 w-3 ml-auto text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                      
                      <div className="flex items-center gap-3 text-slate-700">
                        <Phone className="h-4 w-4 text-amber-500" />
                        <span className="text-sm sm:text-base">{ceoInfo.phone}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-700">
                        <Linkedin className="h-4 w-4 text-amber-500" />
                        <span className="text-sm sm:text-base">{ceoInfo.linkedin}</span>
                      </div>
                    </div>
                    
                    {/* Motto */}
                    <p className="text-center text-sm sm:text-base italic text-slate-600 border-t border-amber-200 pt-4">
                      {ceoInfo.motto}
                    </p>
                  </div>
                  
                  {/* Flip hint */}
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Tap to flip</span>
                    <motion.div
                      animate={{ rotateY: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      ↺
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2 bg-background/80 backdrop-blur border-border"
            >
              <Download className="h-4 w-4" />
              Save Contact
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2 bg-background/80 backdrop-blur border-border"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-background/80 backdrop-blur"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CEOBusinessCard;
