import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { HousePlan, generateHousePlan } from "@/lib/planGenerator";
import { useHousePlans } from "@/hooks/useHousePlans";
import { useAIEnhancement } from "@/hooks/useAIEnhancement";
import { RefreshCw, ArrowRight, Home, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useAIGeneratedImages } from "@/hooks/useAIGeneratedImages";

const Results = () => {
  const [plan, setPlan] = useState<HousePlan | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const navigate = useNavigate();
  const { savePlan, loading: saveLoading } = useHousePlans();
  const { enhancePlanWithAI, isLoading: aiLoading, error: aiError } = useAIEnhancement();
  const { generateImages, isLoading: imagesLoading, error: imagesError } = useAIGeneratedImages();
  const [images, setImages] = useState<string[]>([]);

  // Optional add-ons (user-selectable upgrades)
  const addonOptions = [
    { id: 'solar', label: 'Solar Power Package', desc: '3–5kW system with inverter & batteries', type: 'percent', value: 0.06 },
    { id: 'water', label: '5,000L Water Tank & Plumbing', desc: 'Storage tank with guttering & pump', type: 'fixed', value: 120_000 },
    { id: 'fence', label: 'Perimeter Fence & Gate', desc: 'Chain-link/masonry mix with steel gate', type: 'fixed', value: 180_000 },
    { id: 'garage', label: 'Single Car Garage', desc: 'Attached or detached standard garage', type: 'percent', value: 0.04 },
    { id: 'backup', label: 'Backup Generator', desc: '3–5kVA standby generator', type: 'percent', value: 0.02 },
    { id: 'finishes', label: 'Premium Interior Finishes', desc: 'Upgraded floors, cabinetry, fixtures', type: 'percent', value: 0.05 },
  ] as const;

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const toggleAddon = (id: string, checked: boolean) => {
    setSelectedAddons((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((x) => x !== id);
    });
  };

  const addonCost = (id: string) => {
    const opt = addonOptions.find((o) => o.id === id);
    if (!opt) return 0;
    if (opt.type === 'fixed') return opt.value;
    return Math.round(plan ? plan.budget * opt.value : 0);
  };

  const additionalCost = selectedAddons.reduce((sum, id) => sum + addonCost(id), 0);

  useEffect(() => {
    const storedPlan = localStorage.getItem("currentPlan");
    if (storedPlan) {
      setPlan(JSON.parse(storedPlan));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleRegenerate = async () => {
    if (!plan) return;
    
    setIsRegenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPlan = generateHousePlan(plan.budget);
      setPlan(newPlan);
      localStorage.setItem("currentPlan", JSON.stringify(newPlan));
      
      toast.success("New plan generated with fresh ideas!");
    } catch (error) {
      toast.error("Failed to regenerate plan. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (plan) {
      const savedPlan = await savePlan(plan);
      if (savedPlan) {
        toast.success("Plan saved! You can now track your progress in the Journey section.");
      }
    }
  };

  const handleEnhanceWithAI = async () => {
    if (!plan) return;
    
    try {
      const enhancedData = await enhancePlanWithAI(plan.budget, "Kenya", "");
      if (enhancedData) {
        const enhancedPlan = { ...plan, aiEnhanced: enhancedData };
        setPlan(enhancedPlan);
        localStorage.setItem('currentPlan', JSON.stringify(enhancedPlan));
        
        toast.success("Plan enhanced with AI insights!");
      }
    } catch (error) {
      toast.error("Could not enhance the plan with AI. Please try again.");
    }
  };

  const handleGenerateVisuals = async () => {
    if (!plan) return;
    const prompts = (plan as any).aiPrompts?.length
      ? (plan as any).aiPrompts.slice(0, 3)
      : [
          `Exterior of a ${plan.bedrooms}-bedroom ${plan.style} house in Kenya, realistic materials, natural lighting, landscaping, detailed textures` ,
          `Interior living room of a ${plan.bedrooms}-bedroom Kenyan home, modern yet practical finishes, natural light, furniture layout`,
          `Aerial view of plot with ${plan.size}m² house on ${plan.plotSize}m² plot, driveway and garden layout`
        ];
    const result = await generateImages(prompts);
    if (result) {
      setImages(result);
      toast.success('AI visuals generated!');
    } else {
      toast.error('Failed to generate visuals');
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

  const totalCost = Object.values(plan.costBreakdown).reduce((sum, cost) => sum + cost, 0);
  const fallbackReason = (plan as any)?._fallbackReason as string | undefined;

  return (
    <AppLayout 
      title={`${plan.houseType} - Budget KES ${plan.budget.toLocaleString()}`}
      description={`Detailed cost breakdown for a ${plan.houseType} in ${plan.style} style with ${plan.bedrooms} bedrooms${plan.location ? ` in ${plan.location}` : ''}.`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{plan.houseType}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{plan.style} Style</Badge>
              <Badge variant="secondary">{plan.bedrooms} Bedrooms</Badge>
              <Badge variant="secondary">{plan.size}m² House</Badge>
              <Badge variant="secondary">{plan.plotSize}m² Plot</Badge>
              {plan.location && <Badge variant="secondary">{plan.location}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Reroll Design'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSavePlan}
              disabled={saveLoading}
            >
              <Save className={`w-4 h-4 mr-2`} />
              {saveLoading ? 'Saving...' : 'Save Plan'}
            </Button>
            <Button 
              onClick={handleEnhanceWithAI} 
              variant="outline" 
              disabled={aiLoading}
            >
              <Sparkles className={`w-4 h-4 mr-2 ${aiLoading ? 'animate-pulse' : ''}`} />
              {aiLoading ? 'Enhancing...' : 'AI Enhance'}
            </Button>
            <Link to="/prompt">
              <Button variant="hero">
                Generate AI Prompt
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {fallbackReason && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>AI service unavailable — using template</AlertTitle>
            <AlertDescription>
              {fallbackReason}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total Budget: KES {plan.budget.toLocaleString()} | {" "}
                  Base Cost: KES {totalCost.toLocaleString()} | {" "}
                  Add-ons: KES {additionalCost.toLocaleString()} | {" "}
                  Grand Total: KES {(totalCost + additionalCost).toLocaleString()} | {" "}
                  Remaining vs Budget: KES {(plan.budget - (totalCost + additionalCost)).toLocaleString()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(plan.costBreakdown).map(([category, cost]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="capitalize font-medium">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-semibold">KES {cost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">House Specifications</h4>
                    <ul className="space-y-1 text-sm">
                      <li>Size: {plan.size} square meters</li>
                      <li>Bedrooms: {plan.bedrooms}</li>
                      <li>Roofing: {plan.roofing}</li>
                      <li>Interior: {plan.interiorFinish}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Plot Information</h4>
                    <ul className="space-y-1 text-sm">
                      <li>Plot Size: {plan.plotSize} square meters</li>
                      <li>Estimated Timeline: {plan.timeline}</li>
                      <li>Style: {plan.style}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {plan.aiEnhanced && (
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI-Enhanced Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Architectural Recommendations</h4>
                    <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                      {plan.aiEnhanced.recommendations}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Cost Optimization</h4>
                    <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                      {plan.aiEnhanced.costOptimization}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Materials & Climate</h4>
                    <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                      {plan.aiEnhanced.materials}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>AI Visuals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {imagesError && (
                  <Alert variant="destructive">
                    <AlertTitle>Image generation failed</AlertTitle>
                    <AlertDescription>{imagesError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleGenerateVisuals} disabled={imagesLoading} variant="default">
                    {imagesLoading ? 'Generating...' : (images.length ? 'Regenerate Visuals' : 'Generate Visuals')}
                  </Button>
                  <Link to="/prompt">
                    <Button variant="outline">
                      Open Prompt Builder
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((src, idx) => (
                      <figure key={idx} className="rounded-lg overflow-hidden border">
                        <img src={src} alt={`AI visual ${idx + 1} of ${plan.houseType}`} loading="lazy" className="w-full h-auto" />
                      </figure>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optional Add-ons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {addonOptions.map((opt) => {
                    const checked = selectedAddons.includes(opt.id);
                    const cost = addonCost(opt.id);
                    return (
                      <label key={opt.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleAddon(opt.id, Boolean(v))}
                          aria-label={opt.label}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-sm text-muted-foreground">KES {cost.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Estimated Add-ons Total</span>
                  <span className="font-semibold">KES {additionalCost.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/prompt" className="block">
                  <Button variant="default" className="w-full justify-between">
                    Generate AI Visuals
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/journey" className="block">
                  <Button variant="outline" className="w-full justify-between">
                    View Construction Journey
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Separator />
                <Link to="/" className="block">
                  <Button variant="ghost" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Try Different Budget
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Results;