import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { usePlanningProgress } from "@/hooks/usePlanningProgress";
import { CheckCircle, Clock, DollarSign, FileText, AlertTriangle } from "lucide-react";

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  costRange: string;
  timeEstimate: string;
  tips: string[];
  requirements: string[];
  completed: boolean;
}

const Journey = () => {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const { saveProgress, getProgress, loading } = usePlanningProgress();
  const [steps, setSteps] = useState<JourneyStep[]>([
    {
      id: "land",
      title: "Land Acquisition & Title Deed",
      description: "Secure your plot and ensure proper legal documentation",
      costRange: "KES 500K - 5M+",
      timeEstimate: "2-6 weeks",
      tips: [
        "Verify the title deed is genuine at the Ministry of Lands",
        "Check for any encumbrances or disputes",
        "Ensure the land is in a planned area with infrastructure"
      ],
      requirements: [
        "Valid ID",
        "Proof of income",
        "Legal representation",
        "Site visit"
      ],
      completed: false
    },
    {
      id: "design",
      title: "Architectural Design & Approvals",
      description: "Create detailed house plans and get county approval",
      costRange: "KES 100K - 500K",
      timeEstimate: "3-8 weeks",
      tips: [
        "Work with a registered architect",
        "Ensure compliance with local building codes",
        "Consider future expansion needs"
      ],
      requirements: [
        "Registered architect",
        "Site survey",
        "Soil test results",
        "County submission"
      ],
      completed: false
    },
    {
      id: "permits",
      title: "Construction Permits",
      description: "Obtain all necessary construction and planning permits",
      costRange: "KES 50K - 200K",
      timeEstimate: "2-4 weeks",
      tips: [
        "Apply early as processing takes time",
        "Ensure all documents are complete",
        "Work with county planning department"
      ],
      requirements: [
        "Approved building plans",
        "EIA certificate (if required)",
        "Development permission",
        "Construction permit"
      ],
      completed: false
    },
    {
      id: "contractor",
      title: "Contractor & Labour Hiring",
      description: "Select qualified contractors and skilled workers",
      costRange: "20-30% of budget",
      timeEstimate: "1-2 weeks",
      tips: [
        "Get at least 3 quotes from different contractors",
        "Check NCA registration and past projects",
        "Have clear contracts with payment schedules"
      ],
      requirements: [
        "NCA registered contractor",
        "Valid insurance",
        "Portfolio review",
        "Reference checks"
      ],
      completed: false
    },
    {
      id: "foundation",
      title: "Foundation & Main Structure",
      description: "Excavation, foundation laying, and structural framework",
      costRange: "40-50% of budget",
      timeEstimate: "6-12 weeks",
      tips: [
        "Ensure proper soil compaction",
        "Use quality cement and reinforcement",
        "Regular engineering supervision required"
      ],
      requirements: [
        "Structural engineer",
        "Quality materials",
        "Proper curing time",
        "Regular inspections"
      ],
      completed: false
    },
    {
      id: "roofing",
      title: "Roofing & Exterior",
      description: "Install roofing system and complete exterior walls",
      costRange: "15-25% of budget",
      timeEstimate: "3-6 weeks",
      tips: [
        "Choose roofing materials suitable for Kenya's climate",
        "Ensure proper drainage and guttering",
        "Quality waterproofing is essential"
      ],
      requirements: [
        "Weather protection",
        "Proper insulation",
        "Drainage system",
        "Exterior finishes"
      ],
      completed: false
    },
    {
      id: "interior",
      title: "Interior Finishes",
      description: "Flooring, painting, fixtures, and interior fittings",
      costRange: "20-30% of budget",
      timeEstimate: "4-8 weeks",
      tips: [
        "Plan electrical and plumbing before finishes",
        "Choose durable materials for high-traffic areas",
        "Consider maintenance requirements"
      ],
      requirements: [
        "Electrical completion",
        "Plumbing completion",
        "Quality finishes",
        "Proper ventilation"
      ],
      completed: false
    },
    {
      id: "inspection",
      title: "Final Inspections",
      description: "County inspections and compliance certification",
      costRange: "KES 20K - 50K",
      timeEstimate: "1-2 weeks",
      tips: [
        "Schedule inspections early",
        "Address any compliance issues promptly",
        "Keep all documentation organized"
      ],
      requirements: [
        "Completion certificate",
        "Occupancy permit",
        "Utility connections",
        "Safety compliance"
      ],
      completed: false
    },
    {
      id: "movein",
      title: "Move-in Ready",
      description: "Final touches, landscaping, and handover",
      costRange: "5-10% of budget",
      timeEstimate: "1-2 weeks",
      tips: [
        "Do a final walkthrough with contractor",
        "Secure warranty documents",
        "Plan landscaping and security features"
      ],
      requirements: [
        "Final cleanup",
        "Landscaping",
        "Security installation",
        "Utility activation"
      ],
      completed: false
    }
  ]);

  useEffect(() => {
    if (planId) {
      loadProgress();
    }
  }, [planId]);

  const loadProgress = async () => {
    if (!planId) return;
    
    const progressData = await getProgress(planId);
    const completedStepsMap: { [key: string]: boolean } = {};
    
    progressData.forEach((progress) => {
      completedStepsMap[progress.step_id] = progress.completed;
    });
    
    setSteps(prev => prev.map(step => ({
      ...step,
      completed: completedStepsMap[step.id] || false
    })));
  };

  const toggleStep = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const newCompletedState = !step.completed;
    
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, completed: newCompletedState } : s
    ));

    if (planId) {
      await saveProgress(planId, stepId, step.title, newCompletedState);
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <AppLayout 
      title="Construction Journey"
      description="Step-by-step guide to building your dream home in Kenya with timelines, costs, and expert tips."
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Your Construction Journey</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Follow this step-by-step guide to build your dream home in Kenya
          </p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Progress Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Progress value={progressPercentage} className="flex-1" />
                <Badge variant="secondary">
                  {completedSteps}/{steps.length} Complete
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Track your progress through each construction phase
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card key={step.id} className={`transition-all ${step.completed ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <Checkbox
                      checked={step.completed}
                      onCheckedChange={() => toggleStep(step.id)}
                      className="ml-2"
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className={`text-xl ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">{step.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{step.costRange}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{step.timeEstimate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      Requirements
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Expert Tips
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {step.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🚀 Ready to Start?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This journey typically takes 6-18 months depending on your house size and complexity. 
              Remember to budget an extra 10-15% for unexpected costs and delays.
            </p>
            <div className="flex gap-4">
              <Button variant="hero" className="flex-1">
                Get Professional Consultation
              </Button>
              <Button variant="outline" className="flex-1">
                Download Journey Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Journey;