'use client';

import { cn } from '@/lib/utils';

interface FilterChipsProps {
  filters: {
    source: string;
    dateRange: string;
    importance: string;
  };
  onChange: (filters: { source: string; dateRange: string; importance: string }) => void;
}

const sourceOptions = [
  { value: 'all', label: 'All Sources' },
  { value: 'chat', label: 'Chat' },
  { value: 'email', label: 'Email' },
  { value: 'voice', label: 'Voice' },
  { value: 'document', label: 'Document' },
  { value: 'web', label: 'Web' },
];

const importanceOptions = [
  { value: 'all', label: 'All' },
  { value: '5', label: 'Critical' },
  { value: '4', label: 'High' },
  { value: '3', label: 'Medium' },
];

export function FilterChips({ filters, onChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Source Filter */}
      <div className="flex items-center gap-1">
        {sourceOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange({ ...filters, source: option.value })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filters.source === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Importance Filter */}
      <div className="flex items-center gap-1">
        {importanceOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange({ ...filters, importance: option.value })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filters.importance === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
