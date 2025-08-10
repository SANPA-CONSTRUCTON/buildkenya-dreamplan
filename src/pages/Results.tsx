import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { HousePlan, generateHousePlan } from "@/lib/planGenerator";
import { RefreshCw, ArrowRight, Home } from "lucide-react";
import { toast } from "sonner";

const Results = () => {
  const [plan, setPlan] = useState<HousePlan | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const navigate = useNavigate();

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

  return (
    <AppLayout 
      title={`${plan.houseType} - Budget KES ${plan.budget.toLocaleString()}`}
      description={`Detailed cost breakdown for a ${plan.houseType} in ${plan.style} style with ${plan.bedrooms} bedrooms.`}
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
            <Link to="/prompt">
              <Button variant="hero">
                Generate AI Prompt
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total Budget: KES {plan.budget.toLocaleString()} | 
                  Total Cost: KES {totalCost.toLocaleString()} | 
                  Remaining: KES {(plan.budget - totalCost).toLocaleString()}
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
            <Card>
              <CardHeader>
                <CardTitle>💡 Expert Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.notes.map((note, index) => (
                    <p key={index} className="text-sm bg-muted/50 p-3 rounded-lg">
                      {note}
                    </p>
                  ))}
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