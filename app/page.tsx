import { KanbanBoard } from '@/components/kanban/kanban-board';
import { IdeasPanel } from '@/components/ideas/ideas-panel';

export default function Home() {
  return (
    <div className="flex h-full">
      <IdeasPanel />
      <div className="flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
