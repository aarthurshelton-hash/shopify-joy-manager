import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CEOBusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const CEOBusinessCard: React.FC<CEOBusinessCardProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const ceoInfo = {
    phone: '212 555 3287',
    company: 'En Pensent',
    firstName: 'ALEC',
    lastName: 'SHELTON',
    title: 'Chief Executive Officer',
    address: '358 Exchange Place',
    cityStateZip: 'New York, N.Y. 10099',
    fax: '212 555 6390',
    telex: '10 4534',
    email: 'ceo@enpensent.com',
    website: 'enpensent.com',
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Alec Shelton - CEO, En Pensent',
          text: `${ceoInfo.firstName} ${ceoInfo.lastName}\n${ceoInfo.title}\n${ceoInfo.company}\n${ceoInfo.email}`,
          url: `https://${ceoInfo.website}`,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    const vCardData = `BEGIN:VCARD
VERSION:3.0
N:Shelton;Alec;Arthur;;
FN:Alec Arthur Shelton
TITLE:Chief Executive Officer
ORG:En Pensent
EMAIL:ceo@enpensent.com
URL:https://www.enpensent.com
TEL:+1 212 555 3287
ADR:;;358 Exchange Place;New York;N.Y.;10099;USA
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
          {/* Traditional Business Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative w-full aspect-[1.75/1] rounded-sm overflow-hidden shadow-2xl"
            style={{
              background: '#fdfcfa',
            }}
          >
            {/* Subtle paper texture overlay */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Card Content - Traditional Layout */}
            <div className="relative h-full px-8 sm:px-10 py-5 sm:py-6 flex flex-col justify-between select-none">
              
              {/* Top Row - Phone & Company */}
              <div className="flex justify-between items-start">
                {/* Phone - Top Left */}
                <button 
                  onClick={() => handleCopy(ceoInfo.phone, 'Phone')}
                  className="text-[10px] sm:text-[11px] tracking-[0.08em] text-stone-700 hover:text-stone-900 transition-colors"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {ceoInfo.phone}
                  {copied === 'Phone' && <Check className="inline h-3 w-3 ml-1 text-green-600" />}
                </button>
                
                {/* Company with Chess Piece - Top Right */}
                <div className="flex items-center gap-1.5">
                  <span 
                    className="text-base sm:text-lg text-stone-800"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    ♔
                  </span>
                  <span 
                    className="text-[11px] sm:text-xs tracking-[0.15em] text-stone-800 font-normal italic"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {ceoInfo.company}
                  </span>
                </div>
              </div>
              
              {/* Center - Name & Title */}
              <div className="text-center">
                <h2 
                  className="text-xl sm:text-2xl tracking-[0.2em] text-stone-800 font-normal"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {ceoInfo.firstName} {ceoInfo.lastName}
                </h2>
                <p 
                  className="text-[10px] sm:text-[11px] tracking-[0.12em] text-stone-600 mt-1.5 italic"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {ceoInfo.title}
                </p>
              </div>
              
              {/* Bottom Row - Address Left, Contact Right */}
              <div className="flex justify-between items-end">
                {/* Address - Bottom Left */}
                <div 
                  className="text-[9px] sm:text-[10px] tracking-[0.05em] text-stone-600 leading-relaxed"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <p>{ceoInfo.address}</p>
                  <p>{ceoInfo.cityStateZip}</p>
                </div>
                
                {/* Contact Details - Bottom Right */}
                <div 
                  className="text-[9px] sm:text-[10px] tracking-[0.05em] text-stone-600 text-right leading-relaxed"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  <p>
                    <span className="text-stone-500">fax</span> {ceoInfo.fax}
                    <span className="mx-1.5 text-stone-400">|</span>
                    <span className="text-stone-500">telex</span> {ceoInfo.telex}
                  </p>
                  <button 
                    onClick={() => handleCopy(ceoInfo.email, 'Email')}
                    className="hover:text-stone-900 transition-colors inline-flex items-center gap-1"
                  >
                    {ceoInfo.email}
                    {copied === 'Email' && <Check className="h-2.5 w-2.5 text-green-600" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Subtle border */}
            <div className="absolute inset-0 pointer-events-none border border-stone-200/60 rounded-sm" />
          </motion.div>
          
          {/* Action buttons */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2 bg-background/90 backdrop-blur border-border"
            >
              <Download className="h-4 w-4" />
              Save Contact
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2 bg-background/90 backdrop-blur border-border"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-background/80 backdrop-blur h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CEOBusinessCard;
