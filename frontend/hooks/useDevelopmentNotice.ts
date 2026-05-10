import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'facodi_development_notice_seen_v1';

export const useDevelopmentNotice = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY) === '1';
      if (!seen) {
        setIsOpen(true);
      }
    } catch {
      // no-op if storage is unavailable
    }
    setIsReady(true);
  }, []);

  const closeNotice = useCallback((persist = true) => {
    setIsOpen(false);
    if (!persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // no-op if storage is unavailable
    }
  }, []);

  const openNotice = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    isReady,
    closeNotice,
    openNotice,
  };
};
