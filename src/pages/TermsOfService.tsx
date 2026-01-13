/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of En Pensent LLC.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, FileText, AlertTriangle, Copyright, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/shop/Footer';

const TermsOfService = () => {
  const currentYear = new Date().getFullYear();
  
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
            <h1 className="text-lg font-royal font-bold text-gold-gradient">Legal</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-royal font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: January {currentYear}
          </p>
        </div>

        {/* Copyright Notice Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copyright className="w-5 h-5 text-primary" />
              Copyright Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              © {currentYear} En Pensent LLC. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              The En Pensent platform, including but not limited to its software, design, visual elements,
              algorithms, user interface, and all associated intellectual property, is protected by copyright,
              trademark, and other intellectual property laws. The unique chess visualization technology,
              color palette systems, and artistic rendering methods are proprietary trade secrets of En Pensent LLC.
            </p>
          </CardContent>
        </Card>

        {/* Main Terms */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                By accessing or using the En Pensent platform ("Service"), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, you may not access or use the Service.
              </p>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the Service
                constitutes acceptance of any modifications.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                2. Proprietary Technology
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                The Service incorporates proprietary technology including, but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chess game visualization algorithms and rendering engines</li>
                <li>Color palette generation and application systems</li>
                <li>Vision scoring and marketplace valuation methods</li>
                <li>QR code integration and scanning technology</li>
                <li>Royalty calculation and distribution systems</li>
                <li>User interface designs and interactive elements</li>
              </ul>
              <p className="font-medium text-foreground mt-4">
                Reverse engineering, decompiling, disassembling, or attempting to derive the source code
                of any portion of the Service is strictly prohibited.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                3. Intellectual Property Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                All content, features, and functionality of the Service—including but not limited to text,
                graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software—
                are the exclusive property of En Pensent LLC and are protected by international copyright,
                trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                <p className="font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Prohibited Activities
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2 text-destructive/80">
                  <li>Copying, reproducing, or cloning the Service or its features</li>
                  <li>Creating derivative works based on the Service's design or functionality</li>
                  <li>Scraping, harvesting, or extracting data from the Service</li>
                  <li>Using automated tools to access or interact with the Service</li>
                  <li>Circumventing any security or access control measures</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                4. User Content & Visions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                When you create visualizations ("Visions") using the Service, you retain ownership of your
                original chess games and uploaded content. However, the artistic rendering, visual
                representation, and any derivative works created by the Service remain the intellectual
                property of En Pensent LLC.
              </p>
              <p>
                You are granted a limited, non-exclusive license to use, display, and sell your Visions
                through the En Pensent marketplace, subject to our royalty and fee structures.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                5. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                EN PENSENT LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
                OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                6. Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                United States, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Service shall be resolved
                through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                7. Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                For questions about these Terms or to report violations of intellectual property rights,
                please contact us at: <span className="text-primary">legal@enpensent.com</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Final Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Lock className="w-3 h-3" />
            Protected by U.S. Copyright Law • Patent Pending Technology
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
