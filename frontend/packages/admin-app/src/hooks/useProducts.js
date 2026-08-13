import { useState, useEffect, useCallback } from 'react';
import { productService, categoryService } from '@shared/services';
import { logger } from '@shared/utils';

export function useProducts(enabled = true) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productService.getAllForAdmin();
      setProducts(data || []);
    } catch (err) {
      logger.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    await Promise.all([loadProducts(), loadCategories(), loadAllCategoriesFlat()]);
    setLoading(false);
  }, [enabled, loadProducts, loadCategories, loadAllCategoriesFlat]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    loadProducts();
    loadCategories();
    loadAllCategoriesFlat().finally(() => setLoading(false));
  }, [enabled]);

  return {
    products,
    categories,
    allCategoriesFlat,
    loading,
    loadProducts,
    loadCategories,
    loadAllCategoriesFlat,
    refresh,
  };
}
