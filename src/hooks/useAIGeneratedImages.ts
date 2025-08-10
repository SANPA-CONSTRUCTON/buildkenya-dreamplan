import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAIGeneratedImages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImages = async (prompts: string[]): Promise<string[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-visuals', {
        body: { prompts },
      });

      if (functionError) throw functionError;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate images');

      return data.images as string[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate images';
      setError(message);
      console.error('AI Visual Generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generateImages, isLoading, error };
};
