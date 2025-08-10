import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HousePlan } from '@/lib/planGenerator';

export const useAIPromptVariations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePromptVariations = async (plan: HousePlan): Promise<string[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-prompt-variations', {
        body: {
          houseType: plan.houseType,
          style: plan.style,
          roofing: plan.roofing,
          interiorFinish: plan.interiorFinish,
          bedrooms: plan.bedrooms,
          size: plan.size,
          plotSize: plan.plotSize,
          location: 'Kenya'
        }
      });
      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate prompt variations');
      return data.prompts as string[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate prompt variations';
      setError(message);
      console.error('Prompt variations error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generatePromptVariations, isLoading, error };
};
