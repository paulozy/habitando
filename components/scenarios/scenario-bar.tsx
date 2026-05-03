"use client";

import * as React from "react";
import { Copy, Plus, X } from "lucide-react";
import {
  SCENARIO_LIMIT,
  useScenariosStore,
} from "@/lib/storage/use-scenarios-store";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function ScenarioBar({
  onAdd,
  onSwitch,
}: {
  onAdd: () => void;
  onSwitch: (id: string) => void;
}) {
  const scenarios = useScenariosStore((s) => s.scenarios);
  const activeId = useScenariosStore((s) => s.activeId);
  const duplicate = useScenariosStore((s) => s.duplicate);
  const remove = useScenariosStore((s) => s.remove);
  const rename = useScenariosStore((s) => s.rename);

  return (
    <div className="bg-paper-alt border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 flex items-center gap-2 overflow-x-auto">
        {scenarios.map((s) => (
          <ScenarioTab
            key={s.id}
            label={s.label}
            color={s.color}
            active={s.id === activeId}
            canRemove={scenarios.length > 1}
            onClick={() => onSwitch(s.id)}
            onRename={(label) => rename(s.id, label)}
            onDuplicate={() => {
              if (scenarios.length < SCENARIO_LIMIT) duplicate(s.id);
            }}
            onRemove={() => remove(s.id)}
          />
        ))}
        {scenarios.length < SCENARIO_LIMIT && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onAdd}
            className="text-ink-soft hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Cenário</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function ScenarioTab({
  label,
  color,
  active,
  canRemove,
  onClick,
  onRename,
  onDuplicate,
  onRemove,
}: {
  label: string;
  color: string;
  active: boolean;
  canRemove: boolean;
  onClick: () => void;
  onRename: (label: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(label);
  React.useEffect(() => setDraft(label), [label]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft !== label) onRename(draft.trim());
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-md border pl-2 pr-1 py-1 transition-colors min-w-0",
        active
          ? "bg-card border-border shadow-sm"
          : "bg-transparent border-transparent hover:bg-card/60",
      )}
    >
      <span
        aria-hidden
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      {editing ? (
        <input
          autoFocus
          className="bg-transparent text-sm font-medium text-ink outline-none min-w-[120px] max-w-[200px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(label);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={onClick}
          onDoubleClick={() => setEditing(true)}
          className={cn(
            "text-sm font-medium truncate max-w-[180px] whitespace-nowrap",
            active ? "text-ink" : "text-ink-soft",
          )}
          title="Clique para abrir · duplo-clique para renomear"
        >
          {label}
        </button>
      )}
      <button
        type="button"
        onClick={onDuplicate}
        title="Duplicar"
        className="rounded p-1 text-ink-muted hover:text-ink hover:bg-paper-alt"
      >
        <Copy className="h-3 w-3" />
      </button>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remover"
          className="rounded p-1 text-ink-muted hover:text-red hover:bg-red-soft"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
