/**
 * IBKR Gateway Settings
 * Allows configuring a custom gateway URL for remote access
 */

import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  getGatewayUrl, 
  setGatewayUrl, 
  resetGatewayUrl, 
  isUsingCustomGateway 
} from '@/lib/trading/ibkrConfig';

interface IBKRGatewaySettingsProps {
  onSettingsChange?: () => void;
}

export function IBKRGatewaySettings({ onSettingsChange }: IBKRGatewaySettingsProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(getGatewayUrl().replace('/v1/api', ''));
  const { toast } = useToast();
  
  const isCustom = isUsingCustomGateway();

  const handleSave = () => {
    setGatewayUrl(url);
    toast({
      title: 'Gateway URL Updated',
      description: `Now connecting to: ${url}`,
    });
    setOpen(false);
    onSettingsChange?.();
  };

  const handleReset = () => {
    resetGatewayUrl();
    setUrl('https://localhost:5000');
    toast({
      title: 'Gateway Reset',
      description: 'Using default localhost:5000',
    });
    onSettingsChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Gateway Settings
          {isCustom && <Wifi className="h-3 w-3 text-primary" />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>IBKR Gateway Configuration</DialogTitle>
          <DialogDescription>
            Configure the gateway URL for remote access. Use your machine's IP 
            address when accessing from the published domain.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gateway-url">Gateway Base URL</Label>
            <Input
              id="gateway-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://192.168.1.100:5000"
            />
            <p className="text-xs text-muted-foreground">
              Enter the base URL without /v1/api (it's added automatically)
            </p>
          </div>
          
          <Alert>
            <AlertDescription className="text-sm space-y-2">
              <p><strong>For remote access:</strong></p>
              <ol className="list-decimal list-inside text-xs space-y-1">
                <li>Find your computer's local IP (e.g., 192.168.1.100)</li>
                <li>Ensure IBKR gateway is running on that machine</li>
                <li>Enter: <code>https://YOUR_IP:5000</code></li>
                <li>Your firewall must allow port 5000</li>
              </ol>
            </AlertDescription>
          </Alert>
          
          {isCustom && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4 text-primary" />
              Currently using custom gateway
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
