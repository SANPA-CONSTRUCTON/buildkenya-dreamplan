import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AIEnhancedData } from '@/lib/planGenerator';

export const useAIEnhancement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhancePlanWithAI = async (
    budget: number, 
    location?: string, 
    preferences?: string
  ): Promise<AIEnhancedData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'enhance-plan-with-ai',
        {
          body: { budget, location, preferences }
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to enhance plan with AI');
      }

      return data.enhancedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enhance plan';
      setError(errorMessage);
      console.error('AI Enhancement error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    enhancePlanWithAI,
    isLoading,
    error
  };
};