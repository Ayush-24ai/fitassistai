import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalysisHistoryItem {
  id: string;
  feature_type: 'symptom-checker' | 'health-reports' | 'food-scanner' | 'fitness-agent';
  title: string;
  summary: string | null;
  result_data: Record<string, unknown> | null;
  created_at: string;
}

export function useAnalysisHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading analysis history:', error);
      } else {
        setHistory((data as AnalysisHistoryItem[]) || []);
      }
      setLoading(false);
    };

    loadHistory();
  }, [user?.id]);

  // Save new analysis to history
  const saveAnalysis = useCallback(async (
    featureType: AnalysisHistoryItem['feature_type'],
    title: string,
    summary?: string,
    resultData?: Record<string, unknown>
  ) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('analysis_history')
      .insert([{
        user_id: user.id,
        feature_type: featureType,
        title,
        summary: summary || null,
        result_data: (resultData as never) || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis:', error);
      return null;
    }

    // Update local state
    setHistory(prev => [data as AnalysisHistoryItem, ...prev]);
    return data;
  }, [user?.id]);

  // Delete analysis from history
  const deleteAnalysis = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('analysis_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting analysis:', error);
      return false;
    }

    setHistory(prev => prev.filter(item => item.id !== id));
    return true;
  }, []);

  // Get stats
  const getStats = useCallback(() => {
    const stats = {
      total: history.length,
      byFeature: {
        'symptom-checker': 0,
        'health-reports': 0,
        'food-scanner': 0,
        'fitness-agent': 0,
      } as Record<string, number>,
    };

    history.forEach(item => {
      if (stats.byFeature[item.feature_type] !== undefined) {
        stats.byFeature[item.feature_type]++;
      }
    });

    return stats;
  }, [history]);

  return {
    history,
    loading,
    saveAnalysis,
    deleteAnalysis,
    getStats,
  };
}
