'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { useChat } from '@/contexts/chat-context';
import { useAgent } from '@/contexts/agent-context';
import { logActivity } from '@/lib/supabase/activity-log';
import type { KanbanColumn, TaskPriority, AutonomyConfig } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tag, Users, LayoutGrid, MessageSquare, Plus, Trash2, Pencil, Check, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Preset colors for labels and team members ---
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#0ea5e9',
];

const COLUMNS: { id: KanbanColumn; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const PRIORITIES: { id: TaskPriority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

// --- Color Picker (inline) ---
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'h-6 w-6 rounded-full border-2 transition-all',
            value === c ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/40'
          )}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}

// --- Labels Section ---
function LabelsSection() {
  const { settings, addLabel, updateLabel, deleteLabel } = useSettings();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAdd = () => {
    const name = newName.trim().toLowerCase();
    if (!name) return;
    if (settings.labels.some(l => l.name === name)) {
      toast.error('Label already exists');
      return;
    }
    addLabel(name, newColor);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
    toast.success(`Label "${name}" added`);
  };

  const startEdit = (id: string) => {
    const label = settings.labels.find(l => l.id === id);
    if (!label) return;
    setEditingId(id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim().toLowerCase();
    if (!name) return;
    updateLabel(editingId, { name, color: editColor });
    setEditingId(null);
    toast.success('Label updated');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Manage labels used to categorise tasks on the board.
      </p>

      {/* Existing labels */}
      <div className="space-y-2">
        {settings.labels.map(label => (
          <div key={label.id} className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
            {editingId === label.id ? (
              <>
                <div
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: editColor }}
                />
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="h-7 text-xs flex-1"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={saveEdit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditingId(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <div
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-sm flex-1 capitalize">{label.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100" onClick={() => startEdit(label.id)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => { deleteLabel(label.id); toast.success('Label deleted'); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Add new label */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Add Label</Label>
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-full shrink-0 border border-border"
            style={{ backgroundColor: newColor }}
          />
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Label name..."
            className="h-8 text-sm flex-1"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="h-8 gap-1">
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
        <ColorPicker value={newColor} onChange={setNewColor} />
      </div>
    </div>
  );
}

// --- Team Members Section ---
function TeamMembersSection() {
  const { settings, addTeamMember, updateTeamMember, deleteTeamMember } = useSettings();
  const [newName, setNewName] = useState('');
  const [newInitials, setNewInitials] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInitials, setEditInitials] = useState('');
  const [editColor, setEditColor] = useState('');

  const autoInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.trim().substring(0, 2).toUpperCase();
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const initials = newInitials.trim() || autoInitials(name);
    addTeamMember(name, initials, newColor);
    setNewName('');
    setNewInitials('');
    setNewColor(PRESET_COLORS[5]);
    toast.success(`${name} added to team`);
  };

  const startEdit = (id: string) => {
    const member = settings.teamMembers.find(m => m.id === id);
    if (!member) return;
    setEditingId(id);
    setEditName(member.name);
    setEditInitials(member.initials);
    setEditColor(member.color);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    updateTeamMember(editingId, { name, initials: editInitials.trim() || autoInitials(name), color: editColor });
    setEditingId(null);
    toast.success('Member updated');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Team members available for task assignment.
      </p>

      {/* Existing members */}
      <div className="space-y-2">
        {settings.teamMembers.map(member => (
          <div key={member.id} className="flex items-center gap-2 rounded-md border border-border/50 px-3 py-2">
            {editingId === member.id ? (
              <>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: editColor }}
                >
                  {editInitials || autoInitials(editName)}
                </div>
                <div className="flex flex-1 gap-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="Name"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  />
                  <Input
                    value={editInitials}
                    onChange={e => setEditInitials(e.target.value.toUpperCase().slice(0, 2))}
                    className="h-7 text-xs w-14"
                    placeholder="AB"
                    maxLength={2}
                  />
                </div>
                <ColorPicker value={editColor} onChange={setEditColor} />
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={saveEdit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditingId(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <span className="text-sm flex-1">{member.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{member.initials}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100" onClick={() => startEdit(member.id)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => { deleteTeamMember(member.id); toast.success('Member removed'); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <Separator />

      {/* Add new member */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">Add Team Member</Label>
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name..."
            className="h-8 text-sm w-[65%]"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Input
            value={newInitials}
            onChange={e => setNewInitials(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="AB"
            className="h-8 text-sm w-14"
            maxLength={2}
          />
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
            style={{ backgroundColor: newColor }}
          >
            {newInitials || (newName ? autoInitials(newName) : '??')}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="h-7 gap-1 shrink-0">
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Board Section ---
function BoardSection() {
  const { settings, updateBoardDefaults } = useSettings();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Default values when creating new tasks.
      </p>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label className="text-xs font-medium">Default Column</Label>
          <Select
            value={settings.board.defaultColumn}
            onValueChange={v => updateBoardDefaults({ defaultColumn: v as KanbanColumn })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMNS.map(col => (
                <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-medium">Default Priority</Label>
          <Select
            value={settings.board.defaultPriority}
            onValueChange={v => updateBoardDefaults({ defaultPriority: v as TaskPriority })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// --- Chat Section ---
function ChatSection() {
  const { settings, updateChatSettings } = useSettings();
  const { clearMessages } = useChat();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configure chat display and behaviour.
      </p>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label className="text-xs font-medium">Display Name</Label>
          <Input
            value={settings.chat.displayName}
            onChange={e => updateChatSettings({ displayName: e.target.value })}
            placeholder="Your name in chat..."
            className="h-9 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">Shown next to your messages in the chat panel.</p>
        </div>

        <Separator />

        <div className="grid gap-2">
          <Label className="text-xs font-medium">Danger Zone</Label>
          <Button
            variant="outline"
            size="sm"
            className="w-fit text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              clearMessages();
              toast.success('Conversation cleared');
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Clear Chat History
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Autonomy Section ---
function AutonomySection() {
  const { autonomy, updateAutonomyConfig } = useAgent();

  const handleChange = async <K extends keyof AutonomyConfig>(key: K, value: AutonomyConfig[K]) => {
    const old = autonomy[key];
    if (old === value) return;
    await updateAutonomyConfig({ [key]: value });
    void logActivity({
      actor: 'steve',
      action: 'config_updated',
      entityType: 'agent_state',
      changes: { [key]: { old, new: value } },
      metadata: { field: key },
    });
    toast.success('Autonomy setting updated');
  };

  const formatHour = (h: number) => {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display} ${suffix}`;
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Control how Gideon autonomously picks up and works on tasks.
      </p>

      {/* Auto-pickup toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label className="text-xs font-medium">Auto-pickup</Label>
          <p className="text-[11px] text-muted-foreground">Allow Gideon to automatically pick up unassigned tasks.</p>
        </div>
        <Switch
          checked={autonomy.autoPickupEnabled}
          onCheckedChange={(checked) => handleChange('autoPickupEnabled', checked)}
        />
      </div>

      <Separator />

      {/* Max concurrent tasks */}
      <div className="grid gap-2">
        <Label className="text-xs font-medium">Max Concurrent Tasks</Label>
        <Select
          value={String(autonomy.maxConcurrentTasks)}
          onValueChange={(v) => handleChange('maxConcurrentTasks', Number(v))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map(n => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">Maximum tasks Gideon can work on simultaneously.</p>
      </div>

      {/* Nightly start hour */}
      <div className="grid gap-2">
        <Label className="text-xs font-medium">Nightly Cycle Start</Label>
        <Select
          value={String(autonomy.nightlyStartHour)}
          onValueChange={(v) => handleChange('nightlyStartHour', Number(v))}
        >
          <SelectTrigger className="h-9">
            <SelectValue>{formatHour(autonomy.nightlyStartHour)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={String(i)}>{formatHour(i)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">Hour when Gideon&apos;s nightly work cycle begins.</p>
      </div>

      {/* Re-pick window */}
      <div className="grid gap-2">
        <Label className="text-xs font-medium">Re-pick Window (minutes)</Label>
        <Select
          value={String(autonomy.repickWindowMinutes)}
          onValueChange={(v) => handleChange('repickWindowMinutes', Number(v))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[30, 60, 90, 120, 180, 240].map(n => (
              <SelectItem key={n} value={String(n)}>{n} min</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">If a task completes within this window, Gideon picks up another.</p>
      </div>

      {/* Due-date urgency window */}
      <div className="grid gap-2">
        <Label className="text-xs font-medium">Due-Date Urgency (hours)</Label>
        <Select
          value={String(autonomy.dueDateUrgencyHours)}
          onValueChange={(v) => handleChange('dueDateUrgencyHours', Number(v))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[12, 24, 36, 48, 72, 96].map(n => (
              <SelectItem key={n} value={String(n)}>{n}h</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">Tasks due within this window are prioritised over normal priority ordering.</p>
      </div>
    </div>
  );
}

// --- Settings Tabs Content (shared between mobile and desktop) ---
function SettingsTabsContent() {
  return (
    <Tabs defaultValue="labels" className="w-full">
      <TabsList className="w-full grid grid-cols-5">
        <TabsTrigger value="labels" className="gap-1.5 text-xs">
          <Tag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Labels</span>
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-1.5 text-xs">
          <Users className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Team</span>
        </TabsTrigger>
        <TabsTrigger value="board" className="gap-1.5 text-xs">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Board</span>
        </TabsTrigger>
        <TabsTrigger value="chat" className="gap-1.5 text-xs">
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Chat</span>
        </TabsTrigger>
        <TabsTrigger value="autonomy" className="gap-1.5 text-xs">
          <Bot className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Agent</span>
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 px-3">
        <TabsContent value="labels">
          <LabelsSection />
        </TabsContent>
        <TabsContent value="team">
          <TeamMembersSection />
        </TabsContent>
        <TabsContent value="board">
          <BoardSection />
        </TabsContent>
        <TabsContent value="chat">
          <ChatSection />
        </TabsContent>
        <TabsContent value="autonomy">
          <AutonomySection />
        </TabsContent>
      </div>
    </Tabs>
  );
}

// --- Mobile Settings Panel (full-screen, controlled by bottom nav) ---
export function MobileSettingsPanel() {
  return (
    <div className="fixed inset-0 top-12 bottom-14 z-40 bg-background flex flex-col overflow-y-auto">
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-semibold">Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure labels, team members, board defaults, and chat preferences.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <SettingsTabsContent />
      </div>
    </div>
  );
}

// --- Main Settings Panel (desktop Sheet) ---
export function SettingsPanel() {
  const { isOpen, closeSettings } = useSettings();

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && closeSettings()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto z-[200]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Settings</SheetTitle>
          <SheetDescription className="text-xs">
            Configure labels, team members, board defaults, and chat preferences.
          </SheetDescription>
        </SheetHeader>

        <SettingsTabsContent />
      </SheetContent>
    </Sheet>
  );
}
