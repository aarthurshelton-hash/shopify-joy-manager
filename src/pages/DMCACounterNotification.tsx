import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Scale, CheckCircle2, Shield, ArrowLeft } from "lucide-react";

const counterNotificationSchema = z.object({
  notifier_name: z.string().min(2, "Full legal name is required"),
  notifier_email: z.string().email("Valid email is required"),
  notifier_address: z.string().min(10, "Complete physical address is required"),
  notifier_phone: z.string().optional(),
  original_takedown_description: z.string().min(20, "Please describe the original takedown notice"),
  removed_content_url: z.string().optional(),
  removed_content_description: z.string().min(20, "Please describe the removed content"),
  good_faith_statement: z.boolean().refine(val => val === true, { message: "You must confirm this statement" }),
  perjury_statement: z.boolean().refine(val => val === true, { message: "You must confirm this statement" }),
  jurisdiction_consent: z.boolean().refine(val => val === true, { message: "You must consent to jurisdiction" }),
  electronic_signature: z.string().min(2, "Electronic signature is required"),
});

type CounterNotificationData = z.infer<typeof counterNotificationSchema>;

const DMCACounterNotification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CounterNotificationData, string>>>({});
  
  const [formData, setFormData] = useState<CounterNotificationData>({
    notifier_name: "",
    notifier_email: "",
    notifier_address: "",
    notifier_phone: "",
    original_takedown_description: "",
    removed_content_url: "",
    removed_content_description: "",
    good_faith_statement: false,
    perjury_statement: false,
    jurisdiction_consent: false,
    electronic_signature: "",
  });

  const handleInputChange = (field: keyof CounterNotificationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const result = counterNotificationSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CounterNotificationData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof CounterNotificationData] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const insertData = {
        notifier_name: result.data.notifier_name,
        notifier_email: result.data.notifier_email,
        notifier_address: result.data.notifier_address,
        notifier_phone: result.data.notifier_phone || null,
        original_takedown_description: result.data.original_takedown_description,
        removed_content_url: result.data.removed_content_url || null,
        removed_content_description: result.data.removed_content_description,
        good_faith_statement: result.data.good_faith_statement,
        perjury_statement: result.data.perjury_statement,
        jurisdiction_consent: result.data.jurisdiction_consent,
        electronic_signature: result.data.electronic_signature,
        user_id: user?.id || null,
      };

      const { error } = await supabase
        .from('dmca_counter_notifications')
        .insert(insertData);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Counter-notification submitted successfully");
    } catch (error) {
      console.error("Error submitting counter-notification:", error);
      toast.error("Failed to submit counter-notification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Counter-Notification Received</CardTitle>
              <CardDescription className="text-base mt-2">
                Your DMCA counter-notification has been submitted successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">What happens next?</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>We will review your counter-notification within 3 business days</li>
                  <li>If valid, we will forward it to the original complainant</li>
                  <li>The complainant has 10-14 business days to file a court action</li>
                  <li>If no action is filed, your content may be restored</li>
                </ol>
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return Home
                </Button>
                <Button onClick={() => navigate("/dmca")}>
                  DMCA Information
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dmca")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to DMCA Information
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Scale className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">DMCA Counter-Notification</h1>
            <p className="text-muted-foreground">
              Dispute a DMCA takedown if you believe your content was wrongly removed
            </p>
          </div>
        </div>

        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Legal Document Warning</AlertTitle>
          <AlertDescription>
            This is a legal document. Filing a false counter-notification can result in legal liability. 
            You should consult with an attorney before submitting this form if you are unsure about your rights.
          </AlertDescription>
        </Alert>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>
                    Provide your complete contact information as required by law
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notifier_name">Full Legal Name *</Label>
                    <Input
                      id="notifier_name"
                      value={formData.notifier_name}
                      onChange={(e) => handleInputChange("notifier_name", e.target.value)}
                      placeholder="Your full legal name"
                      className={errors.notifier_name ? "border-destructive" : ""}
                    />
                    {errors.notifier_name && (
                      <p className="text-sm text-destructive">{errors.notifier_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifier_email">Email Address *</Label>
                    <Input
                      id="notifier_email"
                      type="email"
                      value={formData.notifier_email}
                      onChange={(e) => handleInputChange("notifier_email", e.target.value)}
                      placeholder="your@email.com"
                      className={errors.notifier_email ? "border-destructive" : ""}
                    />
                    {errors.notifier_email && (
                      <p className="text-sm text-destructive">{errors.notifier_email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifier_address">Physical Address *</Label>
                    <Textarea
                      id="notifier_address"
                      value={formData.notifier_address}
                      onChange={(e) => handleInputChange("notifier_address", e.target.value)}
                      placeholder="Complete physical address including city, state/province, postal code, and country"
                      className={errors.notifier_address ? "border-destructive" : ""}
                    />
                    {errors.notifier_address && (
                      <p className="text-sm text-destructive">{errors.notifier_address}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifier_phone">Phone Number (optional)</Label>
                    <Input
                      id="notifier_phone"
                      type="tel"
                      value={formData.notifier_phone}
                      onChange={(e) => handleInputChange("notifier_phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Removed Content Details</CardTitle>
                  <CardDescription>
                    Describe the content that was removed and the original takedown
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="original_takedown_description">Original Takedown Description *</Label>
                    <Textarea
                      id="original_takedown_description"
                      value={formData.original_takedown_description}
                      onChange={(e) => handleInputChange("original_takedown_description", e.target.value)}
                      placeholder="Describe the DMCA takedown notice you received (date received, complainant if known, etc.)"
                      rows={3}
                      className={errors.original_takedown_description ? "border-destructive" : ""}
                    />
                    {errors.original_takedown_description && (
                      <p className="text-sm text-destructive">{errors.original_takedown_description}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="removed_content_url">Original Content URL (if applicable)</Label>
                    <Input
                      id="removed_content_url"
                      value={formData.removed_content_url}
                      onChange={(e) => handleInputChange("removed_content_url", e.target.value)}
                      placeholder="https://enpensent.com/vision/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="removed_content_description">Content Description *</Label>
                    <Textarea
                      id="removed_content_description"
                      value={formData.removed_content_description}
                      onChange={(e) => handleInputChange("removed_content_description", e.target.value)}
                      placeholder="Describe the content that was removed and why you believe you have the right to use it"
                      rows={4}
                      className={errors.removed_content_description ? "border-destructive" : ""}
                    />
                    {errors.removed_content_description && (
                      <p className="text-sm text-destructive">{errors.removed_content_description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Legal Statements</CardTitle>
                  <CardDescription>
                    You must confirm all of the following statements under penalty of perjury
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="good_faith_statement"
                      checked={formData.good_faith_statement}
                      onCheckedChange={(checked) => handleInputChange("good_faith_statement", checked === true)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="good_faith_statement" className="font-normal cursor-pointer">
                        I have a good faith belief that the material was removed or disabled as a result of mistake 
                        or misidentification of the material to be removed or disabled.
                      </Label>
                      {errors.good_faith_statement && (
                        <p className="text-sm text-destructive">{errors.good_faith_statement}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="perjury_statement"
                      checked={formData.perjury_statement}
                      onCheckedChange={(checked) => handleInputChange("perjury_statement", checked === true)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="perjury_statement" className="font-normal cursor-pointer">
                        I swear, under penalty of perjury, that the information in this notification is accurate 
                        and that I am the owner of the content that was removed, or am authorized to act on behalf 
                        of the owner.
                      </Label>
                      {errors.perjury_statement && (
                        <p className="text-sm text-destructive">{errors.perjury_statement}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="jurisdiction_consent"
                      checked={formData.jurisdiction_consent}
                      onCheckedChange={(checked) => handleInputChange("jurisdiction_consent", checked === true)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="jurisdiction_consent" className="font-normal cursor-pointer">
                        I consent to the jurisdiction of the Federal District Court for the judicial district in 
                        which my address is located, or if my address is outside the United States, the judicial 
                        district in which En Pensent is located, and will accept service of process from the 
                        person who provided the original DMCA notification or an agent of such person.
                      </Label>
                      {errors.jurisdiction_consent && (
                        <p className="text-sm text-destructive">{errors.jurisdiction_consent}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Electronic Signature</CardTitle>
                  <CardDescription>
                    Type your full legal name as your electronic signature
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="electronic_signature">Electronic Signature *</Label>
                    <Input
                      id="electronic_signature"
                      value={formData.electronic_signature}
                      onChange={(e) => handleInputChange("electronic_signature", e.target.value)}
                      placeholder="Type your full legal name"
                      className={`font-serif italic ${errors.electronic_signature ? "border-destructive" : ""}`}
                    />
                    {errors.electronic_signature && (
                      <p className="text-sm text-destructive">{errors.electronic_signature}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Counter-Notification"}
              </Button>
            </form>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  The DMCA provides a mechanism for you to dispute takedowns if you believe 
                  your content was removed by mistake or misidentification.
                </p>
                <p>
                  After we receive your counter-notification, we will forward it to the 
                  original complainant. They then have 10-14 business days to notify us 
                  that they have filed a court action.
                </p>
                <p>
                  If we don't receive notice of a court action, we may restore your content.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                <CardTitle>Important Considerations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>
                  <strong>Perjury Risk:</strong> Filing a false counter-notification 
                  is perjury and can result in legal consequences.
                </p>
                <p>
                  <strong>Potential Lawsuit:</strong> The original complainant may 
                  file a lawsuit against you to prevent restoration of your content.
                </p>
                <p>
                  <strong>Legal Advice:</strong> We strongly recommend consulting 
                  with an attorney before filing a counter-notification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DMCACounterNotification;
