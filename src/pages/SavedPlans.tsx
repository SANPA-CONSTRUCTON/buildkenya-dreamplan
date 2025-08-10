import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/AppLayout';
import { useHousePlans } from '@/hooks/useHousePlans';
import { 
  Eye, 
  Trash2, 
  Calendar,
  Home as HomeIcon,
  DollarSign,
  Bed
} from 'lucide-react';

export const SavedPlans = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const { getUserPlans, deletePlan, loading } = useHousePlans();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const userPlans = await getUserPlans();
    setPlans(userPlans);
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      await deletePlan(planId);
      await loadPlans(); // Reload plans
    }
  };

  return (
    <AppLayout
      title="Saved Plans"
      description="View and manage your saved house plans and track your construction progress."
    >
      <Helmet>
        <title>Saved Plans - BuildMyDream Kenya</title>
        <meta name="description" content="View and manage your saved house plans and track your construction progress." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">My Saved Plans</h1>
          <p className="text-xl text-muted-foreground">
            Manage your house plans and track construction progress
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <HomeIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved plans yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first house plan to get started with your dream home journey.
            </p>
            <Link to="/">
              <Button variant="hero">
                Create Your First Plan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const totalCost = Object.values(plan.cost_breakdown).reduce((sum: number, cost: number) => sum + cost, 0);
              
              return (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.house_type}</CardTitle>
                        <CardDescription className="mt-2">
                          Created {new Date(plan.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Link to={`/journey?planId=${plan.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{plan.style} Style</Badge>
                      <Badge variant="secondary">{plan.bedrooms} Bedrooms</Badge>
                      <Badge variant="secondary">{plan.size}m²</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Budget
                        </span>
                        <span className="font-semibold">KES {plan.budget.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <HomeIcon className="w-4 h-4" />
                          Total Cost
                        </span>
                        <span className="font-semibold">KES {totalCost.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Timeline
                        </span>
                        <span className="font-semibold">{plan.timeline}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Link to={`/journey?planId=${plan.id}`} className="block">
                        <Button variant="default" className="w-full">
                          View Construction Journey
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};