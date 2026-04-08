import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Idea } from '@contentflow/shared';
import { IdeaEditModal } from './IdeaEditModal.js';

interface IdeaCardProps {
  idea: Idea;
  workspaceName?: string | undefined;
}

function relativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = then - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  return rtf.format(diffDay, 'day');
}

const priorityClasses: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const statusClasses: Record<string, string> = {
  active: '',
  converted: 'border-green-200 bg-green-50/30',
  archived: 'opacity-60',
};

export function IdeaCard({ idea, workspaceName }: IdeaCardProps) {
  const { t } = useTranslation('ideas');
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setEditOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditOpen(true); }}
        className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer ${statusClasses[idea.status] ?? ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 leading-snug line-clamp-2">{idea.title}</h3>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${priorityClasses[idea.priority] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {t(`priority.${idea.priority}`)}
          </span>
        </div>

        {idea.note && (
          <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{idea.note}</p>
        )}

        {idea.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <span>{relativeTime(idea.createdAt)}</span>
          <div className="flex items-center gap-1.5">
            {idea.status !== 'active' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                idea.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {t(`status.${idea.status}`)}
              </span>
            )}
            {workspaceName && (
              <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{workspaceName}</span>
            )}
          </div>
        </div>
      </div>

      {editOpen && (
        <IdeaEditModal idea={idea} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}
