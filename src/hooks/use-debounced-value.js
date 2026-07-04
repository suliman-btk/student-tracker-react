import { useState, useEffect } from "react";

/**
 * Returns `value` after it has stopped changing for `delay` ms.
 * Used to key queries on settled input instead of every keystroke.
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
