import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { HousePlan } from "@/lib/planGenerator";
import { Copy, RefreshCw, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";

const Prompt = () => {
  const [plan, setPlan] = useState<HousePlan | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedPlan = localStorage.getItem("currentPlan");
    if (storedPlan) {
      setPlan(JSON.parse(storedPlan));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Prompt copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy prompt");
    }
  };

  if (!plan) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">No plan found. Please generate a plan first.</p>
          <Link to="/">
            <Button variant="hero">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="AI Visual Prompts"
      description={`Ready-to-use AI prompts for generating visuals of your ${plan.houseType} design.`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/results">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">AI Visual Prompts</h1>
            <p className="text-muted-foreground">
              Copy these prompts into DALL-E, Midjourney, or Stable Diffusion
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Your House Design
                <Badge variant="secondary">{plan.houseType}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {plan.style} style • {plan.roofing} • {plan.interiorFinish} • {plan.size}m²
              </p>
            </CardHeader>
          </Card>

          {plan.aiPrompts.map((prompt, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Prompt Variation {index + 1}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(prompt)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  readOnly
                  className="min-h-[120px] font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>🎨 How to Use These Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">DALL-E 3</h4>
                  <p className="text-sm text-muted-foreground">
                    Paste directly into ChatGPT with DALL-E 3 or use OpenAI's image generator
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Midjourney</h4>
                  <p className="text-sm text-muted-foreground">
                    Add "/imagine" before the prompt in Discord
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Stable Diffusion</h4>
                  <p className="text-sm text-muted-foreground">
                    Use in any Stable Diffusion interface or website
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Experiment with different prompts for varied results</li>
                  <li>• Add specific details like "sunset lighting" or "lush garden"</li>
                  <li>• Try different camera angles: "drone view" or "interior shot"</li>
                  <li>• For best results, mention "Kenyan architectural style"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-6">
            <Link to="/results" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Plan
              </Button>
            </Link>
            <Link to="/journey" className="flex-1">
              <Button variant="hero" className="w-full">
                View Construction Journey
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Prompt;