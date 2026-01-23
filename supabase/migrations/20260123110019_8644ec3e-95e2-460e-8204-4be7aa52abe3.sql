-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMP WITH TIME ZONE;

-- Create analysis history table
CREATE TABLE public.analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('symptom-checker', 'health-reports', 'food-scanner', 'fitness-agent')),
  title TEXT NOT NULL,
  summary TEXT,
  result_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analysis_history
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for analysis_history
CREATE POLICY "Users can view their own analysis history"
ON public.analysis_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis history"
ON public.analysis_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis history"
ON public.analysis_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX idx_analysis_history_created_at ON public.analysis_history(created_at DESC);