"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Returns ref, handlers, and active override for hiding Recharts tooltip on blur/click-outside.
 * Pass ref to chart wrapper, activeOverride to Tooltip's active prop.
 */
export function useTooltipHideOnBlur() {
  const ref = useRef<HTMLDivElement>(null);
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setForceHide(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setForceHide(false);
  }, []);

  const handleBlur = useCallback(() => {
    setForceHide(true);
  }, []);

  const activeOverride = forceHide ? false : undefined;

  return { ref, handleMouseEnter, handleBlur, activeOverride };
}
