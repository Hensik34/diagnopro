/**
 * Computes a relevance score for a search query matching a target text.
 * Higher scores mean better/more relevant matches.
 * 
 * Scoring rules:
 * - 0: No match
 * - 100: Exact match (case-insensitive)
 * - 90: Starts with the query as a complete word/phrase (e.g., query "ra" matches "ra factor" or "RA Factor")
 * - 80: Starts with the query, but inside a word (e.g., query "ra" matches "rapid")
 * - 70: Query matches as a complete word/phrase somewhere inside the text (e.g., query "ra" matches "Rheumatoid RA Factor" or "Rheumatoid (RA)")
 * - 60: Query matches as a prefix of a word somewhere inside the text (e.g., query "ra" matches "Rheumatoid Arthritis")
 * - 50: Substring match anywhere in the text (e.g., query "ra" matches "Preparation")
 */
export function getSearchScore(target: string, query: string): number {
  if (!target || !query) return 0;
  
  const targetLower = target.toLowerCase().trim();
  const queryLower = query.toLowerCase().trim();
  
  if (!queryLower) return 0;
  
  const index = targetLower.indexOf(queryLower);
  if (index === -1) return 0;
  
  // 1. Exact match
  if (targetLower === queryLower) {
    return 100;
  }
  
  // 2. Starts with query
  if (index === 0) {
    // Check if it's a word boundary right after the query
    const charAfter = targetLower.charAt(queryLower.length);
    if (!charAfter || /[^a-z0-9]/.test(charAfter)) {
      return 90; // Word/phrase prefix match at start
    }
    return 80; // Substring prefix match at start
  }
  
  // 3. Match somewhere inside
  // Check if there is a word boundary before the query
  const charBefore = targetLower.charAt(index - 1);
  const isWordBoundaryBefore = /[^a-z0-9]/.test(charBefore);
  
  if (isWordBoundaryBefore) {
    const charAfter = targetLower.charAt(index + queryLower.length);
    const isWordBoundaryAfter = !charAfter || /[^a-z0-9]/.test(charAfter);
    
    if (isWordBoundaryAfter) {
      return 70; // Exact word match inside
    }
    return 60; // Word prefix match inside
  }
  
  return 50; // Generic substring match inside
}

export interface SearchFieldConfig<T> {
  field: (item: T) => string | undefined | null;
  weight: number; // weight multiplier for the score
}

export function smartSearchFilter<T>(
  items: T[],
  query: string,
  configs: SearchFieldConfig<T>[]
): T[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return items;

  return items
    .map(item => {
      let maxScore = 0;
      for (const config of configs) {
        const value = config.field(item);
        if (value) {
          const score = getSearchScore(value, trimmedQuery);
          const weightedScore = score * config.weight;
          if (weightedScore > maxScore) {
            maxScore = weightedScore;
          }
        }
      }
      return { item, score: maxScore };
    })
    .filter(wrapped => wrapped.score > 0)
    .sort((a, b) => {
      // Sort by score descending
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by length of the primary field to prefer shorter/more concise matches
      const primaryConfig = configs[0];
      if (primaryConfig) {
        const valA = primaryConfig.field(a.item) || '';
        const valB = primaryConfig.field(b.item) || '';
        if (valA.length !== valB.length) {
          return valA.length - valB.length;
        }
        return valA.localeCompare(valB);
      }
      return 0;
    })
    .map(wrapped => wrapped.item);
}
