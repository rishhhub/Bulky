/**
 * Category tree helpers for hierarchical category data.
 * Categories are assumed to have { id, name, path?, breadcrumbs?, children? }.
 */

/**
 * Find the path string or breadcrumb array for a category by id (searches recursively).
 * @param {Array} categories - Tree of categories
 * @param {string|number} categoryId - Target category id (string or number)
 * @returns {string|Array|null} path string, breadcrumbs array, or null
 */
export function findCategoryPath(categories, categoryId) {
  if (!categories || categoryId == null) return null;
  const idStr = String(categoryId);
  for (const cat of categories) {
    if (cat.id != null && String(cat.id) === idStr) {
      return cat.breadcrumbs ?? (cat.path ? cat.path.split(' > ') : [cat.name]);
    }
    if (cat.children?.length) {
      const found = findCategoryPath(cat.children, categoryId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find category path as display string (e.g. "Parent > Child") by id.
 * @param {Array} categories - Tree of categories
 * @param {string|number} categoryId - Target category id
 * @returns {string|null}
 */
export function findCategoryPathDisplay(categories, categoryId) {
  const path = findCategoryPath(categories, categoryId);
  if (path == null) return null;
  return Array.isArray(path) ? path.join(' > ') : path;
}

/**
 * Find category by name in tree (returns first match).
 * @param {Array} categories - Tree of categories
 * @param {string} name - Category name
 * @returns {Object|null} category or null
 */
export function findCategoryByName(categories, name) {
  if (!categories || !name) return null;
  for (const cat of categories) {
    if (cat.name === name) return cat;
    if (cat.children?.length) {
      const found = findCategoryByName(cat.children, name);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get category id as string by name (for setting selectedCategory state).
 * @param {Array} categories - Tree of categories
 * @param {string} name - Category name
 * @returns {string|null}
 */
export function findCategoryIdByName(categories, name) {
  const cat = findCategoryByName(categories, name);
  return cat != null ? String(cat.id) : null;
}
