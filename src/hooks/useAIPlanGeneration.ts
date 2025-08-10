import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HousePlan } from '@/lib/planGenerator';

export const useAIPlanGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIPlan = async (
    budget: number, 
    location?: string, 
    preferences?: string
  ): Promise<HousePlan | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Generating AI plan for budget:', budget);
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-house-plan',
        {
          body: { budget, location, preferences }
        }
      );

      if (functionError) {
        console.error('Function error:', functionError);
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate AI plan');
      }

      console.log('AI plan generated successfully');
      return data.plan;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate plan';
      setError(errorMessage);
      console.error('AI Plan Generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateAIPlan,
    isLoading,
    error
  };
};