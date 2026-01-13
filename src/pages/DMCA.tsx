/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
 * Proprietary and Confidential.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, FileWarning, Send, CheckCircle, Scale, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Footer } from '@/components/shop/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

const dmcaSchema = z.object({
  reporter_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  reporter_email: z.string().trim().email("Invalid email address").max(255),
  reporter_address: z.string().trim().max(500).optional(),
  reporter_phone: z.string().trim().max(20).optional(),
  copyrighted_work_description: z.string().trim().min(20, "Please provide a detailed description (at least 20 characters)").max(2000),
  infringing_material_url: z.string().trim().url("Please enter a valid URL").max(500),
  infringing_material_description: z.string().trim().min(20, "Please provide a detailed description (at least 20 characters)").max(2000),
  good_faith_statement: z.boolean().refine(val => val === true, { message: "You must confirm this statement" }),
  accuracy_statement: z.boolean().refine(val => val === true, { message: "You must confirm this statement" }),
  electronic_signature: z.string().trim().min(2, "Please provide your signature").max(100),
});

type DMCAFormData = z.infer<typeof dmcaSchema>;

const DMCA = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof DMCAFormData, string>>>({});
  const [formData, setFormData] = useState<Partial<DMCAFormData>>({
    reporter_name: '',
    reporter_email: '',
    reporter_address: '',
    reporter_phone: '',
    copyrighted_work_description: '',
    infringing_material_url: '',
    infringing_material_description: '',
    good_faith_statement: false,
    accuracy_statement: false,
    electronic_signature: '',
  });

  const handleChange = (field: keyof DMCAFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = dmcaSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof DMCAFormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof DMCAFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = {
        reporter_name: result.data.reporter_name,
        reporter_email: result.data.reporter_email,
        reporter_address: result.data.reporter_address || null,
        reporter_phone: result.data.reporter_phone || null,
        copyrighted_work_description: result.data.copyrighted_work_description,
        infringing_material_url: result.data.infringing_material_url,
        infringing_material_description: result.data.infringing_material_description,
        good_faith_statement: result.data.good_faith_statement,
        accuracy_statement: result.data.accuracy_statement,
        electronic_signature: result.data.electronic_signature,
        user_id: user?.id || null,
      };

      const { error } = await supabase
        .from('dmca_reports')
        .insert(insertData);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('DMCA report submitted successfully');
    } catch (error) {
      console.error('Error submitting DMCA report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </Button>
              </Link>
              <h1 className="text-lg font-royal font-bold text-gold-gradient">DMCA</h1>
              <div className="w-20" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-royal font-bold mb-4">Report Submitted</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for submitting your DMCA takedown notice. Our legal team will review your report
              and respond within 5-7 business days. You will receive updates at the email address provided.
            </p>
            <Link to="/">
              <Button className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Return Home
              </Button>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-royal font-bold text-gold-gradient">DMCA</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileWarning className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-royal font-bold mb-4">DMCA Takedown Notice</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            En Pensent respects intellectual property rights and expects our users to do the same.
            If you believe your copyrighted work has been infringed, submit a takedown notice below.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-primary" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                En Pensent is committed to protecting intellectual property. We respond to all valid DMCA
                takedown notices in accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Scale className="w-5 h-5 text-primary" />
                Legal Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Filing a false DMCA notice may result in legal liability. Ensure your claim is valid before
                submitting. We may share your information with the alleged infringer.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">Important Legal Notice</p>
              <p className="text-destructive/80">
                Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material
                is infringing may be subject to liability for damages. Please consult with an attorney if you are
                unsure whether material infringes your copyright.
              </p>
            </div>
          </div>
        </div>

        {/* DMCA Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Report Infringement
            </CardTitle>
            <CardDescription>
              Complete all required fields to submit a valid DMCA takedown notice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                  Your Contact Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporter_name">Full Legal Name *</Label>
                    <Input
                      id="reporter_name"
                      value={formData.reporter_name}
                      onChange={(e) => handleChange('reporter_name', e.target.value)}
                      placeholder="Your full legal name"
                      className={errors.reporter_name ? 'border-destructive' : ''}
                    />
                    {errors.reporter_name && (
                      <p className="text-xs text-destructive">{errors.reporter_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reporter_email">Email Address *</Label>
                    <Input
                      id="reporter_email"
                      type="email"
                      value={formData.reporter_email}
                      onChange={(e) => handleChange('reporter_email', e.target.value)}
                      placeholder="your@email.com"
                      className={errors.reporter_email ? 'border-destructive' : ''}
                    />
                    {errors.reporter_email && (
                      <p className="text-xs text-destructive">{errors.reporter_email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporter_address">Mailing Address</Label>
                    <Input
                      id="reporter_address"
                      value={formData.reporter_address}
                      onChange={(e) => handleChange('reporter_address', e.target.value)}
                      placeholder="Street address, city, state, zip"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reporter_phone">Phone Number</Label>
                    <Input
                      id="reporter_phone"
                      type="tel"
                      value={formData.reporter_phone}
                      onChange={(e) => handleChange('reporter_phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Copyrighted Work */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                  Copyrighted Work Details
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="copyrighted_work_description">
                    Description of Copyrighted Work *
                  </Label>
                  <Textarea
                    id="copyrighted_work_description"
                    value={formData.copyrighted_work_description}
                    onChange={(e) => handleChange('copyrighted_work_description', e.target.value)}
                    placeholder="Describe the copyrighted work that you believe has been infringed. Include registration numbers if available."
                    rows={4}
                    className={errors.copyrighted_work_description ? 'border-destructive' : ''}
                  />
                  {errors.copyrighted_work_description && (
                    <p className="text-xs text-destructive">{errors.copyrighted_work_description}</p>
                  )}
                </div>
              </div>

              {/* Infringing Material */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                  Infringing Material
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="infringing_material_url">
                    URL of Infringing Material *
                  </Label>
                  <Input
                    id="infringing_material_url"
                    type="url"
                    value={formData.infringing_material_url}
                    onChange={(e) => handleChange('infringing_material_url', e.target.value)}
                    placeholder="https://example.com/infringing-content"
                    className={errors.infringing_material_url ? 'border-destructive' : ''}
                  />
                  {errors.infringing_material_url && (
                    <p className="text-xs text-destructive">{errors.infringing_material_url}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="infringing_material_description">
                    Description of Infringement *
                  </Label>
                  <Textarea
                    id="infringing_material_description"
                    value={formData.infringing_material_description}
                    onChange={(e) => handleChange('infringing_material_description', e.target.value)}
                    placeholder="Explain how this material infringes your copyright. Be specific about what elements are copied."
                    rows={4}
                    className={errors.infringing_material_description ? 'border-destructive' : ''}
                  />
                  {errors.infringing_material_description && (
                    <p className="text-xs text-destructive">{errors.infringing_material_description}</p>
                  )}
                </div>
              </div>

              {/* Statements */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                  Required Statements
                </h3>

                <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="good_faith_statement"
                      checked={formData.good_faith_statement as boolean}
                      onCheckedChange={(checked) => handleChange('good_faith_statement', !!checked)}
                      className={errors.good_faith_statement ? 'border-destructive' : ''}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="good_faith_statement" className="text-sm leading-relaxed cursor-pointer">
                        I have a good faith belief that the use of the material in the manner complained of is not
                        authorized by the copyright owner, its agent, or the law. *
                      </Label>
                      {errors.good_faith_statement && (
                        <p className="text-xs text-destructive">{errors.good_faith_statement}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="accuracy_statement"
                      checked={formData.accuracy_statement as boolean}
                      onCheckedChange={(checked) => handleChange('accuracy_statement', !!checked)}
                      className={errors.accuracy_statement ? 'border-destructive' : ''}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="accuracy_statement" className="text-sm leading-relaxed cursor-pointer">
                        I swear, under penalty of perjury, that the information in this notification is accurate,
                        and that I am the copyright owner or am authorized to act on behalf of the owner. *
                      </Label>
                      {errors.accuracy_statement && (
                        <p className="text-xs text-destructive">{errors.accuracy_statement}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Electronic Signature */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                  Electronic Signature
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="electronic_signature">
                    Type your full legal name as your electronic signature *
                  </Label>
                  <Input
                    id="electronic_signature"
                    value={formData.electronic_signature}
                    onChange={(e) => handleChange('electronic_signature', e.target.value)}
                    placeholder="Your full legal name"
                    className={`font-serif italic ${errors.electronic_signature ? 'border-destructive' : ''}`}
                  />
                  {errors.electronic_signature && (
                    <p className="text-xs text-destructive">{errors.electronic_signature}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    By typing your name above, you acknowledge that this constitutes your legal electronic signature.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit DMCA Takedown Notice
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Designated Agent */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Designated DMCA Agent</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>En Pensent LLC</strong><br />
              DMCA Agent<br />
              Email: <span className="text-primary">dmca@enpensent.com</span>
            </p>
            <p className="pt-2">
              You may also send DMCA notices to our designated agent by email. Please include all
              required information as specified in 17 U.S.C. § 512(c)(3).
            </p>
          </CardContent>
        </Card>

        {/* Copyright Notice */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} En Pensent LLC. All rights reserved. Protected by U.S. Copyright Law.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DMCA;
