"use client";

import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

const ROW_HEIGHT_PX = 44;
const VISIBLE_ROW_COUNT = 5;
const VIEWPORT_HEIGHT_PX = ROW_HEIGHT_PX * VISIBLE_ROW_COUNT;
const PADDING_ROW_COUNT = Math.floor(VISIBLE_ROW_COUNT / 2);
const SCROLL_SETTLE_MS = 80;
const PROGRAMMATIC_SCROLL_CLEAR_MS = 120;
const INITIAL_SCROLL_GUARD_MS = 300;

export type RestDurationWheelProps = {
  options: readonly number[];
  value: number;
  onValueChange: (seconds: number) => void;
  formatLabel: (seconds: number) => string;
};

export function RestDurationWheel({
  options,
  value,
  onValueChange,
  formatLabel,
}: RestDurationWheelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const programmaticScrollClearRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const hasInitializedScrollRef = useRef(false);
  const valueRef = useRef(value);
  const shouldReduceMotion = useReducedMotion();

  valueRef.current = value;

  const scrollToIndexInstant = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container) return;

      const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
      container.scrollTop = clampedIndex * ROW_HEIGHT_PX;
    },
    [options.length]
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = scrollRef.current;
      if (!container) return;

      const clampedIndex = Math.max(0, Math.min(index, options.length - 1));

      if (behavior === "auto" || shouldReduceMotion) {
        container.scrollTop = clampedIndex * ROW_HEIGHT_PX;
        return;
      }

      container.scrollTo({
        top: clampedIndex * ROW_HEIGHT_PX,
        behavior: "smooth",
      });
    },
    [options.length, shouldReduceMotion]
  );

  const scrollToValueInstant = useCallback(
    (seconds: number) => {
      const index = options.indexOf(seconds);
      if (index === -1) return;
      scrollToIndexInstant(index);
    },
    [options, scrollToIndexInstant]
  );

  const markProgrammaticScroll = useCallback((clearAfterMs = PROGRAMMATIC_SCROLL_CLEAR_MS) => {
    isProgrammaticScrollRef.current = true;

    if (programmaticScrollClearRef.current) {
      clearTimeout(programmaticScrollClearRef.current);
    }

    programmaticScrollClearRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, clearAfterMs);
  }, []);

  const scrollToIndexProgrammatic = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      markProgrammaticScroll();
      scrollToIndex(index, behavior);
    },
    [markProgrammaticScroll, scrollToIndex]
  );

  const setScrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      if (!node) return;

      const index = options.indexOf(valueRef.current);
      if (index === -1) return;

      markProgrammaticScroll(INITIAL_SCROLL_GUARD_MS);
      node.scrollTop = index * ROW_HEIGHT_PX;
      hasInitializedScrollRef.current = true;
    },
    [markProgrammaticScroll, options]
  );

  useLayoutEffect(() => {
    if (!scrollRef.current || hasInitializedScrollRef.current) return;

    markProgrammaticScroll(INITIAL_SCROLL_GUARD_MS);
    scrollToValueInstant(valueRef.current);
    hasInitializedScrollRef.current = true;
  }, [markProgrammaticScroll, scrollToValueInstant]);

  const syncSelectionFromScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || isProgrammaticScrollRef.current) return;

    const index = Math.round(container.scrollTop / ROW_HEIGHT_PX);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    const selected = options[clampedIndex]!;
    const targetTop = clampedIndex * ROW_HEIGHT_PX;

    if (Math.abs(container.scrollTop - targetTop) > 1) {
      markProgrammaticScroll();
      scrollToIndex(clampedIndex, shouldReduceMotion ? "auto" : "smooth");
    }

    if (selected !== valueRef.current) {
      onValueChange(selected);
    }
  }, [
    markProgrammaticScroll,
    onValueChange,
    options,
    scrollToIndex,
    shouldReduceMotion,
  ]);

  const handleScroll = useCallback(() => {
    if (!hasInitializedScrollRef.current) return;

    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }

    scrollEndTimeoutRef.current = setTimeout(() => {
      syncSelectionFromScroll();
    }, SCROLL_SETTLE_MS);
  }, [syncSelectionFromScroll]);

  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
      if (programmaticScrollClearRef.current) {
        clearTimeout(programmaticScrollClearRef.current);
      }
    };
  }, []);

  const selectIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const nextValue = options[index];
      if (nextValue === undefined) return;

      scrollToIndexProgrammatic(index, behavior);

      if (nextValue !== valueRef.current) {
        onValueChange(nextValue);
      }
    },
    [onValueChange, options, scrollToIndexProgrammatic]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = options.indexOf(valueRef.current);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          nextIndex = Math.min(options.length - 1, currentIndex + 1);
          break;
        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          event.preventDefault();
          nextIndex = options.length - 1;
          break;
        default:
          return;
      }

      selectIndex(nextIndex);
    },
    [options, selectIndex]
  );

  const handleOptionClick = useCallback(
    (seconds: number) => {
      const index = options.indexOf(seconds);
      if (index === -1) return;
      selectIndex(index);
    },
    [options, selectIndex]
  );

  return (
    <div className="relative" style={{ height: VIEWPORT_HEIGHT_PX }}>
      <div
        ref={setScrollContainerRef}
        aria-activedescendant={`rest-duration-option-${value}`}
        aria-label="Rest duration"
        className={cn(
          "relative z-0 h-full overflow-y-auto overscroll-y-contain",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        )}
        role="listbox"
        style={{
          scrollSnapType: "y mandatory",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)",
        }}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
      >
        {Array.from({ length: PADDING_ROW_COUNT }, (_, index) => (
          <div
            key={`pad-top-${index}`}
            aria-hidden
            style={{ height: ROW_HEIGHT_PX }}
          />
        ))}

        {options.map((seconds) => {
          const isSelected = seconds === value;

          return (
            <div
              key={seconds}
              id={`rest-duration-option-${seconds}`}
              aria-selected={isSelected}
              className={cn(
                "mx-2 flex cursor-pointer snap-center items-center justify-center rounded-lg text-sm tabular-nums transition-colors duration-150",
                isSelected
                  ? "bg-primary font-medium text-foreground"
                  : "text-foreground/45 hover:text-foreground/70"
              )}
              role="option"
              style={{ height: ROW_HEIGHT_PX, scrollSnapAlign: "center" }}
              onClick={() => handleOptionClick(seconds)}
            >
              {formatLabel(seconds)}
            </div>
          );
        })}

        {Array.from({ length: PADDING_ROW_COUNT }, (_, index) => (
          <div
            key={`pad-bottom-${index}`}
            aria-hidden
            style={{ height: ROW_HEIGHT_PX }}
          />
        ))}
      </div>
    </div>
  );
}
