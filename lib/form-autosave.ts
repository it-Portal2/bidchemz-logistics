import { useState, useEffect, useCallback } from 'react';

interface AutosaveOptions {
  key: string;
  debounceMs?: number;
  onSave?: (data: any) => Promise<void>;
}

export function useAutosave<T extends Record<string, any>>(
  initialData: T,
  options: AutosaveOptions
) {
  const { key, debounceMs = 2000, onSave } = options;
  const [data, setData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setData(parsedData);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, [key]);

  useEffect(() => {
    if (!isDirty) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      
      try {
        localStorage.setItem(key, JSON.stringify(data));
        
        if (onSave) {
          await onSave(data);
        }
        
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, isDirty, key, debounceMs, onSave]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const clearSaved = useCallback(() => {
    localStorage.removeItem(key);
    setData(initialData);
    setIsDirty(false);
    setLastSaved(null);
  }, [key, initialData]);

  return {
    data,
    updateData,
    setData,
    isDirty,
    isSaving,
    lastSaved,
    clearSaved,
  };
}
