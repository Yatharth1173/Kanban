import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBoardShare } from './hooks/useBoardShare';
import { useTasks } from './hooks/useTasks';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useLabels } from './hooks/useLabels';
import { Header } from './components/Header';
import { BoardStats } from './components/BoardStats';
import { SearchFilter } from './components/SearchFilter';
import { Board } from './components/Board';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskDetailPanel } from './components/TaskDetailPanel';
import { TeamPanel } from './components/TeamPanel';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import type { BoardFilters, Task } from './types';

const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  priority: 'all',
  assigneeId: 'all',
  labelId: 'all',
};

export default function App() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const {
    boardUserId,
    shareUrl,
    isSharedView,
    resolving: shareResolving,
    shareError,
    copied,
    copyShareLink,
  } = useBoardShare(user?.id);
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    setAssignees,
    setLabels,
    refresh,
  } = useTasks(boardUserId, user?.id);
  const { members, addMember, removeMember } = useTeamMembers(boardUserId);
  const { labels } = useLabels(boardUserId);

  const [showCreate, setShowCreate] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);

  if (authLoading || shareResolving || tasksLoading) {
    return <LoadingState />;
  }

  if (authError) {
    return <ErrorState message={authError} onRetry={() => window.location.reload()} />;
  }

  if (shareError) {
    return <ErrorState message={shareError} onRetry={() => { window.location.href = '/'; }} />;
  }

  if (tasksError) {
    return <ErrorState message={tasksError} onRetry={refresh} />;
  }

  if (!user) {
    return <ErrorState message="Unable to establish a guest session." />;
  }

  const selected = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-violet-600/6 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <Header
          onCreateTask={() => setShowCreate(true)}
          onToggleTeam={() => setShowTeam((v) => !v)}
          showTeam={showTeam}
          isSharedView={isSharedView}
          shareUrl={shareUrl}
          copied={copied}
          onCopyShareLink={() => { void copyShareLink(); }}
        />

        <div className="mt-6 space-y-4">
          <BoardStats tasks={tasks} />
          <SearchFilter
            filters={filters}
            onChange={setFilters}
            members={members}
            labels={labels}
          />
        </div>

        <div className="mt-6">
          <Board
            tasks={tasks}
            filters={filters}
            onMoveTask={moveTask}
            onTaskClick={setSelectedTask}
          />
        </div>
      </div>

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createTask}
        members={members}
        labels={labels}
      />

      <TaskDetailPanel
        task={selected}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onSetAssignees={setAssignees}
        onSetLabels={setLabels}
        members={members}
        labels={labels}
        userId={user.id}
      />

      <TeamPanel
        open={showTeam}
        onClose={() => setShowTeam(false)}
        members={members}
        onAdd={addMember}
        onRemove={removeMember}
      />
    </div>
  );
}
