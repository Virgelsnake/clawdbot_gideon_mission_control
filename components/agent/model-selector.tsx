'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAgent } from '@/contexts/agent-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Check, Loader2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type DotStatus = 'active-ok' | 'active-error' | 'configured' | 'unavailable';

function StatusDot({ status, className }: { status: DotStatus; className?: string }) {
  const styles: Record<DotStatus, string> = {
    'active-ok': 'bg-green-500 shadow-green-500/40',
    'active-error': 'bg-red-500 shadow-red-500/40',
    configured: 'bg-yellow-500 shadow-yellow-500/40',
    unavailable: 'bg-gray-400/50',
  };

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full shadow-sm shrink-0 transition-colors duration-300',
        styles[status],
        className
      )}
    />
  );
}

function getProvider(modelId: string): string {
  const slash = modelId.indexOf('/');
  return slash > 0 ? modelId.slice(0, slash) : 'other';
}

export function ModelSelector() {
  const { currentModel, modelList, configuredModels, modelHealth, setCurrentModel, refreshHealth, connected } = useAgent();
  const [switching, setSwitching] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const configuredSet = useMemo(() => new Set(configuredModels), [configuredModels]);

  // Determine the active model's dot status
  const activeModelStatus: DotStatus = useMemo(() => {
    const health = modelHealth[currentModel];
    if (!connected) return 'active-error';
    if (health?.alive === false) return 'active-error';
    return 'active-ok';
  }, [currentModel, modelHealth, connected]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  // Split models into configured and unconfigured, apply search filter
  const { configuredFiltered, unconfiguredGrouped, totalFiltered } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const matches = modelList.filter((m) => !q || m.toLowerCase().includes(q));

    const conf = matches.filter((m) => configuredSet.has(m));
    const unconf = matches.filter((m) => !configuredSet.has(m));

    // Group unconfigured by provider
    const groups: Record<string, string[]> = {};
    for (const m of unconf) {
      const provider = getProvider(m);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(m);
    }
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));

    return { configuredFiltered: conf, unconfiguredGrouped: sorted, totalFiltered: matches.length };
  }, [modelList, search, configuredSet]);

  const handleModelSelect = async (model: string) => {
    if (model === currentModel || switching) return;
    if (!configuredSet.has(model)) return; // Can't select unconfigured models

    setOpen(false);
    setSearch('');
    setSwitching(true);
    try {
      await setCurrentModel(model);
      toast.success(`Switched to ${model}`);
      void refreshHealth();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Model switch failed';
      toast.error('Model switch failed', { description: msg });
    } finally {
      setSwitching(false);
    }
  };

  function getModelDotStatus(model: string): DotStatus {
    if (model === currentModel) return activeModelStatus;
    if (configuredSet.has(model)) return 'configured';
    return 'unavailable';
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-2 px-2.5 hover:bg-muted/80"
        disabled={switching}
        onClick={() => setOpen((v) => !v)}
      >
        <StatusDot status={activeModelStatus} />
        {switching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : null}
        <span className="max-w-[160px] truncate text-xs font-medium">
          {switching ? 'Switching…' : currentModel}
        </span>
        <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
            />
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {totalFiltered}
            </span>
          </div>

          {/* Model list */}
          <div className="max-h-[320px] overflow-y-auto overscroll-contain">
            {/* Configured models section */}
            {configuredFiltered.length > 0 && (
              <div>
                <div className="sticky top-0 bg-popover/95 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                  Configured
                </div>
                {configuredFiltered.map((model) => (
                  <ModelRow
                    key={model}
                    model={model}
                    dotStatus={getModelDotStatus(model)}
                    isSelected={model === currentModel}
                    isConfigured={true}
                    onClick={() => void handleModelSelect(model)}
                  />
                ))}
              </div>
            )}

            {/* Unconfigured models section */}
            {unconfiguredGrouped.length > 0 && (
              <>
                <div className="sticky top-0 bg-popover/95 backdrop-blur-sm px-3 py-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider border-b border-border/30 border-t border-border/20">
                  Not Configured
                </div>
                {unconfiguredGrouped.map(([provider, models]) => (
                  <div key={provider}>
                    <div className="px-3 py-0.5 text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wider">
                      {provider}
                    </div>
                    {models.map((model) => (
                      <ModelRow
                        key={model}
                        model={model}
                        dotStatus="unavailable"
                        isSelected={false}
                        isConfigured={false}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                ))}
              </>
            )}

            {totalFiltered === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No models found
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[9px] text-muted-foreground/60">
            <span className="flex items-center gap-1"><StatusDot status="active-ok" className="h-1.5 w-1.5" /> Active</span>
            <span className="flex items-center gap-1"><StatusDot status="active-error" className="h-1.5 w-1.5" /> Error</span>
            <span className="flex items-center gap-1"><StatusDot status="configured" className="h-1.5 w-1.5" /> Available</span>
            <span className="flex items-center gap-1"><X className="h-2.5 w-2.5 text-muted-foreground/40" /> Not configured</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelRow({
  model,
  dotStatus,
  isSelected,
  isConfigured,
  onClick,
}: {
  model: string;
  dotStatus: DotStatus;
  isSelected: boolean;
  isConfigured: boolean;
  onClick: () => void;
}) {
  // Show just the model name (after provider/)
  const shortName = model.includes('/') ? model.split('/').slice(1).join('/') : model;

  return (
    <button
      onClick={isConfigured ? onClick : undefined}
      disabled={!isConfigured}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors',
        isConfigured ? 'hover:bg-accent/50 cursor-pointer' : 'cursor-default opacity-45',
        isSelected && 'bg-accent/70'
      )}
    >
      {isConfigured ? (
        <StatusDot status={dotStatus} />
      ) : (
        <X className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      )}
      <span className={cn('truncate flex-1', !isConfigured && 'text-muted-foreground/50')}>{shortName}</span>
      {isSelected && (
        <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" />
      )}
    </button>
  );
}
