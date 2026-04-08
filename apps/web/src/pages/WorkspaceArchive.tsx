import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Content } from '@contentflow/shared';
import { useWorkspaces } from '../api/workspaces.js';
import { useContents } from '../api/contents.js';
import { ContentDrawer } from '../components/kanban/ContentDrawer.js';
import { Skeleton } from '../components/ui/Skeleton.js';


function fmtDate(val: Date | string | null | undefined): string {
  if (!val) return '';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(d);
}

function getArchivedAt(content: Content): string {
  const entry = [...(content.stageHistory ?? [])].reverse().find((e) => e.stage === 'archived');
  return entry ? fmtDate(entry.timestamp) : '';
}

export default function WorkspaceArchive() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { t } = useTranslation('contents');
  const { t: tCommon } = useTranslation('common');

  const { data: workspaces } = useWorkspaces();
  const workspace = workspaces?.find((w) => w.id === workspaceId);

  const { data: contents = [], isLoading } = useContents(workspaceId ?? '');
  const archived = contents.filter((c) => c.stage === 'archived');

  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const liveSelected = selectedContent
    ? (contents.find((c) => c.id === selectedContent.id) ?? selectedContent)
    : null;

  const accentColor = workspace?.color ?? '#6366f1';

  if (!workspaceId) {
    return <div className="p-6 text-gray-500">{t('column.workspace_not_found')}</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-8 py-4 border-b border-gray-100 flex-shrink-0">
        {workspace && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
        )}
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">
          {workspace ? `${workspace.icon} ${workspace.name}` : ''} — {tCommon('nav.archive')}
        </h1>
        <span className="ml-1 text-sm text-gray-400 font-normal">{archived.length}</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 bg-white rounded-lg border border-gray-100">
                <Skeleton variant="text" className="flex-1 h-4" />
                <Skeleton variant="text" className="w-20 h-4" />
                <Skeleton variant="text" className="w-24 h-4" />
              </div>
            ))}
          </div>
        ) : archived.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <span className="text-4xl">🗄</span>
            <p className="text-sm">{t('column.empty')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_120px_140px_140px] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>{t('archive.col_title')}</span>
              <span>{t('archive.col_type')}</span>
              <span>{t('archive.col_published')}</span>
              <span>{t('archive.col_archived')}</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {archived.map((content) => {
                const archivedAt = getArchivedAt(content);
                const publishedAt = fmtDate(content.publishedAt);
                return (
                  <button
                    key={content.id}
                    onClick={() => setSelectedContent(content)}
                    className="w-full text-left hover:bg-gray-50 transition-colors group"
                  >
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-[1fr_120px_140px_140px] gap-4 px-4 py-3 items-center">
                      {/* Title + tags */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
                          {content.title}
                        </p>
                        {content.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {content.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                                {tag}
                              </span>
                            ))}
                            {content.tags.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{content.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Content type */}
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 w-fit">
                        {t(`content_types.${content.contentType}`)}
                      </span>
                      {/* Published */}
                      <span className={`text-xs ${publishedAt ? 'text-green-600' : 'text-gray-300'}`}>
                        {publishedAt || '—'}
                      </span>
                      {/* Archived */}
                      <span className="text-xs text-gray-400">{archivedAt || '—'}</span>
                    </div>

                    {/* Mobile row */}
                    <div className="md:hidden flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{content.title}</p>
                        <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 mt-1 inline-block">
                          {t(`content_types.${content.contentType}`)}
                        </span>
                      </div>
                      <div className="flex-shrink-0 text-right space-y-0.5">
                        {publishedAt && <p className="text-[10px] text-green-600">✓ {publishedAt}</p>}
                        {archivedAt && <p className="text-[10px] text-gray-400">🗄 {archivedAt}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {liveSelected && (
        <ContentDrawer
          content={liveSelected}
          workspaceId={workspaceId}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </div>
  );
}
