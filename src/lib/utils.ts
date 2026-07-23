import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import type { TaskPriority } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export type DueDateUrgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'normal' | null;

export function getDueDateUrgency(dueDate: string | null): DueDateUrgency {
  if (!dueDate) return null;
  const date = parseISO(dueDate);
  const now = new Date();
  if (isPast(date) && !isToday(date)) return 'overdue';
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  const daysUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 3) return 'soon';
  return 'normal';
}

export function formatDueDate(dueDate: string): string {
  return new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function priorityWeight(priority: TaskPriority): number {
  return { high: 0, normal: 1, low: 2 }[priority];
}
