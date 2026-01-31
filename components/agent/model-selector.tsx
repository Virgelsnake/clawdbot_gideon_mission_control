'use client';

import { useAgent } from '@/contexts/agent-context';
import { useChat } from '@/contexts/chat-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Cpu, Check } from 'lucide-react';

export function ModelSelector() {
  const { currentModel, modelList, setCurrentModel } = useAgent();
  const { addMessage } = useChat();

  const handleModelSelect = (model: string) => {
    if (model === currentModel) return;
    
    // Update the model
    setCurrentModel(model);
    
    // Send system message to chat about model swap
    addMessage('assistant', `Switched to model: ${model}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
          <Cpu className="h-4 w-4" />
          <span className="max-w-[120px] truncate text-xs">
            {currentModel}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {modelList.map((model) => (
          <DropdownMenuItem
            key={model}
            onClick={() => handleModelSelect(model)}
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
