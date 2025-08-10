import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlanningStep {
  id: string;
  name: string;
  description: string;
  estimatedCost: string;
  estimatedTime: string;
  tips: string[];
}

export interface PlanningProgress {
  id: string;
  planId: string;
  stepId: string;
  stepName: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

export const usePlanningProgress = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveProgress = async (planId: string, stepId: string, stepName: string, completed: boolean, notes?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const progressData = {
        user_id: user?.id || null,
        plan_id: planId,
        step_id: stepId,
        step_name: stepName,
        completed,
        notes,
        completed_at: completed ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('planning_progress')
        .upsert(progressData, {
          onConflict: 'plan_id,step_id'
        });

      if (error) throw error;

      toast({
        title: completed ? "Step Completed" : "Progress Saved",
        description: `${stepName} has been ${completed ? 'marked as complete' : 'updated'}!`,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgress = async (planId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('planning_progress')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast({
        title: "Error",
        description: "Failed to load progress. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    saveProgress,
    getProgress,
    loading,
  };
};