import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { useAIPlanGeneration } from "@/hooks/useAIPlanGeneration";
import { toast } from "sonner";

const Index = () => {
  const [budget, setBudget] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [county, setCounty] = useState("");
  const navigate = useNavigate();
  const { generateAIPlan, isLoading, error } = useAIPlanGeneration();

  const exampleBudgets = [
    { amount: 500000, label: "Starter Home" },
    { amount: 1500000, label: "Family House" },
    { amount: 4000000, label: "Executive Villa" },
    { amount: 10000000, label: "Luxury Estate" }
  ];

  const kenyaCounties = useMemo(() => [
    "Nairobi", "Mombasa", "Kiambu", "Nakuru", "Kisumu", "Uasin Gishu", "Machakos", "Kajiado", "Kilifi", "Nyeri"
  ], []);

  const countries = ["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia"];

  const handleGenerate = async () => {
    const budgetAmount = parseInt(budget.replace(/,/g, ""));

    if (!budgetAmount || budgetAmount < 500000) {
      toast.error("Please enter a budget of at least KES 500,000");
      return;
    }

    try {
      toast.info("Generating your AI-powered house plan...");

      const location = country === 'Kenya' && county ? `${county}, ${country}` : country;
      const plan = await generateAIPlan(budgetAmount, location, "");

      if (plan) {
        // Store plan in localStorage for sharing between pages
        const withLocation = { ...plan, location } as any;
        localStorage.setItem("currentPlan", JSON.stringify(withLocation));

        const fallbackReason = (withLocation as any)?._fallbackReason;
        if (fallbackReason) {
          toast.info(`AI unavailable — using template: ${fallbackReason}`);
        }

        toast.success("Your AI-generated house plan is ready!");
        navigate("/results");
      } else {
        toast.error("Failed to generate plan. Please try again.");
      }
    } catch (error) {
      console.error('Plan generation error:', error);
      toast.error("Failed to generate plan. Please try again.");
    }
  };

  const formatBudget = (value: string) => {
    const number = value.replace(/[^\d]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <AppLayout 
      title="Plan Your Dream Home in Kenya"
      description="Enter your budget and get a detailed, randomized house plan with accurate Kenyan construction costs and AI visualization prompts."
    >
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Powered House Plans for Kenya
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Enter your budget (minimum KES 500,000) and our AI will design a personalized house plan – 
              including realistic costs, materials, and architectural recommendations tailored for Kenya.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Build Your AI-Designed Dream</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-lg">Your Budget (KES)</Label>
                  <Input
                    id="budget"
                    type="text"
                    placeholder="e.g., 2,500,000"
                    value={budget}
                    onChange={(e) => setBudget(formatBudget(e.target.value))}
                    className="text-lg h-12"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-lg">Country</Label>
                    <Select value={country} onValueChange={(v) => { setCountry(v); setCounty(""); }}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {country === 'Kenya' && (
                    <div className="space-y-2">
                      <Label className="text-lg">County (Kenya)</Label>
                      <Select value={county} onValueChange={setCounty}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select county" />
                        </SelectTrigger>
                        <SelectContent>
                          {kenyaCounties.map((k) => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full h-14 text-lg"
                >
                  {isLoading ? "🤖 AI Generating Your Plan..." : "🏠 Generate My AI Plan"}
                </Button>

                <div className="pt-6">
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Quick examples to try:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {exampleBudgets.map(({ amount, label }) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setBudget(amount.toLocaleString())}
                        className="flex flex-col h-auto p-3"
                      >
                        <span className="font-semibold">KES {amount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
