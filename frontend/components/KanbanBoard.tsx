"use client";

import { useEffect, useMemo, useState } from "react";
import { closestCorners, DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "../services/api";

type ActionItem = { id: number; client_id: number; title: string; owner?: string; status: string; priority?: string; due_date?: string | null };
type Column = { id: string; label: string; dot: string };

function validActionItem(item: unknown): item is ActionItem {
  return Boolean(item && typeof item === "object" && "id" in item && "title" in item && "status" in item);
}

const COLUMNS: Column[] = [
  { id: "Open", label: "Open", dot: "bg-sky-400" },
  { id: "In Progress", label: "In Progress", dot: "bg-indigo-500" },
  { id: "Blocked", label: "Blocked", dot: "bg-rose-500" },
  { id: "Testing", label: "Testing", dot: "bg-violet-500" },
  { id: "Completed", label: "Completed", dot: "bg-emerald-500" },
];

function statusForColumn(status: string) {
  const normalized = (status || "").trim().toLowerCase();
  if (["done", "completed", "closed"].includes(normalized)) return "Completed";
  if (["to do", "todo", "open"].includes(normalized)) return "Open";
  if (normalized === "in-progress") return "In Progress";
  return COLUMNS.some(column => column.id.toLowerCase() === normalized) ? COLUMNS.find(column => column.id.toLowerCase() === normalized)!.id : "Open";
}

function priorityClass(priority?: string) {
  return priority?.toLowerCase() === "critical" ? "priority-critical" : priority?.toLowerCase() === "high" ? "priority-high" : priority?.toLowerCase() === "low" ? "priority-low" : "priority-medium";
}

function SortableCard({ item }: { item: ActionItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} className={`kanban-card kanban-card-modern ${isDragging ? "kanban-card-dragging" : ""}`}>
    <div className="flex items-start justify-between gap-2"><p className="font-medium leading-5 text-slate-800">{item.title}</p>{item.priority && <span className={`priority-dot ${priorityClass(item.priority)}`}>{item.priority}</span>}</div>
    <p className="mt-2 text-xs text-slate-500">{item.owner || "Unassigned"}{item.due_date ? ` · Due ${item.due_date}` : ""}</p>
  </article>;
}

function KanbanColumn({ column, items }: { column: Column; items: ActionItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return <section ref={setNodeRef} className={`kanban-column-modern ${isOver ? "kanban-column-over" : ""}`}>
    <header className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />{column.label}</h3><span className="soft-pill">{items.length}</span></header>
    <div className="kanban-column-scroll"><SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>{items.map(item => <SortableCard key={item.id} item={item} />)}</SortableContext>{!items.length && <div className="kanban-empty">Drop items here</div>}</div>
  </section>;
}

export default function KanbanBoard({ initialItems, onStatusChange }: { initialItems: ActionItem[]; onStatusChange: (id: number, status: string) => Promise<boolean> }) {
  const [items, setItems] = useState(() => (Array.isArray(initialItems) ? initialItems.filter(validActionItem) : []));
  const [activeId, setActiveId] = useState<number | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => setItems(Array.isArray(initialItems) ? initialItems.filter(validActionItem) : []), [initialItems]);
  useEffect(() => {
    apiFetch("/clients").then(response => response.ok ? response.json() : []).then(payload => {
      const availableClients = Array.isArray(payload) ? payload : [];
      setClients(availableClients);
      if (availableClients.length && !clientFilter) setClientFilter(String(availableClients[0].id));
    }).catch(() => undefined);
  }, []);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }));
  const filteredItems = useMemo(() => items.filter(validActionItem).filter(item => !clientFilter || String(item.client_id) === clientFilter), [items, clientFilter]);
  const columns = useMemo(() => COLUMNS.map(column => ({ ...column, items: filteredItems.filter(item => statusForColumn(item.status) === column.id) })), [filteredItems]);
  const findColumn = (id: string | number) => { const column = COLUMNS.find(item => item.id === id); if (column) return column.id; return columns.find(item => item.items.some(action => action.id === Number(id)))?.id; };
  const activeItem = activeId === null ? null : items.find(item => validActionItem(item) && item.id === activeId) || null;
  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(Number(active.id));
  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null); if (!over) return;
    const id = Number(active.id); const source = findColumn(id); const target = findColumn(over.id); if (!source || !target) return;
    const previous = items;
    if (source === target) {
      const sourceItems = items.filter(validActionItem).filter(item => statusForColumn(item.status) === source);
      const oldIndex = sourceItems.findIndex(item => item.id === id);
      const newIndex = sourceItems.findIndex(item => item.id === Number(over.id));
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(sourceItems, oldIndex, newIndex);
        let cursor = 0;
        setItems(current => current.map(item => statusForColumn(item.status) === source ? reordered[cursor++] : item));
      }
      return;
    }
    setItems(current => current.map(item => item.id === id ? { ...item, status: target } : item));
    if (!(await onStatusChange(id, target))) setItems(previous);
  };
  return <><div className="kanban-toolbar"><label>Client<select value={clientFilter} onChange={event => setClientFilter(event.target.value)}><option value="">All clients</option>{clients.map(client => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><span className="text-xs text-slate-500">{filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}</span></div><div className="kanban-scroll-shell"><DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}><div className="kanban-board-modern">{columns.map(column => <KanbanColumn key={column.id} column={column} items={column.items} />)}</div><DragOverlay>{activeItem ? <div className="kanban-card kanban-card-modern kanban-drag-overlay"><p className="font-medium text-slate-800">{activeItem.title}</p><p className="mt-2 text-xs text-slate-500">{activeItem.owner || "Unassigned"}</p></div> : null}</DragOverlay></DndContext></div></>;
}
