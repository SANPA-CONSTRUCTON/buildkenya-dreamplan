import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HousePlan } from '@/lib/planGenerator';

export const useHousePlans = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const savePlan = async (plan: HousePlan) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('house_plans')
        .insert({
          user_id: user?.id || null,
          budget: plan.budget,
          house_type: plan.houseType,
          style: plan.style,
          size: plan.size,
          plot_size: plan.plotSize,
          bedrooms: plan.bedrooms,
          roofing: plan.roofing,
          interior_finish: plan.interiorFinish,
          cost_breakdown: plan.costBreakdown,
          timeline: plan.timeline,
          notes: plan.notes,
          ai_prompts: plan.aiPrompts,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Plan Saved",
        description: "Your house plan has been saved successfully!",
      });

      return data;
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Failed to save plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserPlans = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('house_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load plans. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('house_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Plan Deleted",
        description: "Your house plan has been deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    savePlan,
    getUserPlans,
    deletePlan,
    loading,
  };
};