"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedSearch } from "@/hooks";

interface SearchBarProps {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms (0 to disable) */
  debounceMs?: number;
  /** Whether to show the search icon */
  showIcon?: boolean;
  /** Whether to show clear button when value exists */
  clearable?: boolean;
  /** Additional class names */
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Callback when debounced value changes */
  onDebouncedChange?: (value: string) => void;
}

/**
 * Reusable SearchBar component with optional debouncing
 * 
 * @example
 * // Basic usage
 * <SearchBar 
 *   value={search} 
 *   onChange={setSearch} 
 *   placeholder="Search organizations..."
 * />
 * 
 * @example
 * // With debouncing
 * <SearchBar 
 *   value={search} 
 *   onChange={setSearch}
 *   debounceMs={300}
 *   onDebouncedChange={handleDebouncedSearch}
 * />
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 0,
  showIcon = true,
  clearable = true,
  className,
  disabled = false,
  size = "md",
  onDebouncedChange,
}: SearchBarProps) {
  // Use debounced value if delay is specified
  const debouncedValue = useDebouncedSearch(value, debounceMs);

  // Call debounced callback when debounced value changes
  React.useEffect(() => {
    if (onDebouncedChange && debounceMs > 0) {
      onDebouncedChange(debouncedValue);
    }
  }, [debouncedValue, onDebouncedChange, debounceMs]);

  const handleClear = () => {
    onChange("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const sizeClasses = {
    sm: "h-8 text-sm pl-8 pr-8",
    md: "h-10 text-base pl-10 pr-10",
    lg: "h-12 text-lg pl-12 pr-12",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconPositionClasses = {
    sm: "left-2",
    md: "left-3",
    lg: "left-4",
  };

  const clearPositionClasses = {
    sm: "right-2",
    md: "right-3",
    lg: "right-4",
  };

  return (
    <div className={cn("relative", className)}>
      {showIcon && (
        <Search
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
            iconSizeClasses[size],
            iconPositionClasses[size]
          )}
        />
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-input bg-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          sizeClasses[size],
          !showIcon && "pl-4",
          !(clearable && value) && "pr-4"
        )}
      />
      {clearable && value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            "transition-colors focus:outline-none",
            clearPositionClasses[size]
          )}
          aria-label="Clear search"
        >
          <X className={iconSizeClasses[size]} />
        </button>
      )}
    </div>
  );
}
