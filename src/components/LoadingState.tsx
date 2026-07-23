import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading your board...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0f] text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
