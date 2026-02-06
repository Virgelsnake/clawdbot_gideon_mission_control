'use client';

import { useState } from 'react';
import { useAgent } from '@/contexts/agent-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Cpu, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ModelSelector() {
  const { currentModel, modelList, setCurrentModel } = useAgent();
  const [switching, setSwitching] = useState(false);

  const handleModelSelect = async (model: string) => {
    if (model === currentModel || switching) return;

    setSwitching(true);
    try {
      await setCurrentModel(model);
      toast.success(`Switched to ${model}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Model switch failed';
      toast.error('Model switch failed', { description: msg });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2" disabled={switching}>
          {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
          <span className="max-w-[120px] truncate text-xs">
            {switching ? 'Switching…' : currentModel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {modelList.map((model) => (
          <DropdownMenuItem
            key={model}
            onClick={() => void handleModelSelect(model)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{model}</span>
            {model === currentModel && (
              <Check className="h-4 w-4 ml-2 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
