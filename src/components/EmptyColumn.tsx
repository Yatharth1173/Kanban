import { Inbox } from 'lucide-react';

export function EmptyColumn({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/30 px-4 py-10 text-center">
      <Inbox className="mb-2 h-5 w-5 text-zinc-600" />
      <p className="text-xs text-zinc-500">No tasks in {title}</p>
      <p className="mt-0.5 text-[11px] text-zinc-600">Drag a task here or create one</p>
    </div>
  );
}
