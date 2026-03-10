"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Returns ref, handlers, and active override for hiding Recharts tooltip on blur/click-outside.
 * Pass ref to chart wrapper, activeOverride to Tooltip's active prop.
 * @param excludeSelector - CSS selector for elements to exclude from "click outside" (e.g. tooltip in portal)
 */
export function useTooltipHideOnBlur(excludeSelector?: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (excludeSelector && (target as Element).closest?.(excludeSelector)) return;
      if (ref.current && !ref.current.contains(target)) {
        setForceHide(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [excludeSelector]);

  const handleMouseEnter = useCallback(() => {
    setForceHide(false);
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const relatedTarget = e.relatedTarget as Node | null;
      if (excludeSelector && relatedTarget instanceof Element && relatedTarget.closest(excludeSelector)) {
        return;
      }
      setForceHide(true);
    },
    [excludeSelector]
  );

  const activeOverride = forceHide ? false : undefined;

  return { ref, handleMouseEnter, handleBlur, activeOverride };
}
