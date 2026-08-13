import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '@shared/services';
import { logger } from '@shared/utils';

export function useCategories(enabled = true) {
  const [categories, setCategories] = useState([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.getAll(false, true);
      setCategories(data || []);
    } catch (err) {
      logger.error('Failed to load categories:', err);
      try {
        const data = await categoryService.getAll();
        setCategories(data || []);
      } catch (fallbackErr) {
        setCategories([]);
      }
    }
  }, []);

  const loadAllCategoriesFlat = useCallback(async () => {
    try {
      const data = await categoryService.getAll(true);
      setAllCategoriesFlat(data || []);
    } catch (err) {
      logger.error('Failed to load categories:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    await Promise.all([loadCategories(), loadAllCategoriesFlat()]);
    setLoading(false);
  }, [enabled, loadCategories, loadAllCategoriesFlat]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    loadCategories();
    loadAllCategoriesFlat().finally(() => setLoading(false));
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps -- load on mount when tab is active

  return {
    categories,
    allCategoriesFlat,
    loading,
    loadCategories,
    loadAllCategoriesFlat,
    refresh,
  };
}
