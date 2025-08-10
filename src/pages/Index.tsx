import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { generateHousePlan } from "@/lib/planGenerator";
import { toast } from "sonner";

const Index = () => {
  const [budget, setBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const exampleBudgets = [
    { amount: 500000, label: "Starter Home" },
    { amount: 1500000, label: "Family House" },
    { amount: 4000000, label: "Executive Villa" },
    { amount: 10000000, label: "Luxury Estate" }
  ];

  const handleGenerate = async () => {
    const budgetAmount = parseInt(budget.replace(/,/g, ""));
    
    if (!budgetAmount || budgetAmount < 500000) {
      toast.error("Please enter a budget of at least KES 500,000");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const plan = generateHousePlan(budgetAmount);
      
      // Store plan in localStorage for sharing between pages
      localStorage.setItem("currentPlan", JSON.stringify(plan));
      
      toast.success("Your house plan is ready!");
      navigate("/results");
    } catch (error) {
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
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
              Plan Your Dream Home in Kenya
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Enter your budget (minimum KES 500,000) and we'll design a home plan for you – 
              including costs, requirements, and a ready-to-use AI visual prompt.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-card border-0 bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Build Your Dream</CardTitle>
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

                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-14 text-lg"
                >
                  {isGenerating ? "Generating Your Plan..." : "🏠 Generate My Plan"}
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
