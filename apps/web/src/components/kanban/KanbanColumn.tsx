import { useState } from 'react';
import type { Content, Stage } from '@orbit/shared';
import { KanbanCard } from './KanbanCard.js';
import { useTranslation } from 'react-i18next';

interface KanbanColumnProps {
  stage: Stage;
  contents: Content[];
  onCardClick: (content: Content) => void;
  onDrop: (contentId: string, newStage: Stage) => void;
  onDoubleClick?: (() => void) | undefined;
}

export function KanbanColumn({ stage, contents, onCardClick, onDrop, onDoubleClick }: KanbanColumnProps) {
  const { t } = useTranslation('contents');
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragStart(e: React.DragEvent, contentId: string) {
    e.dataTransfer.setData('contentId', contentId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column element itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const contentId = e.dataTransfer.getData('contentId');
    if (contentId) {
      onDrop(contentId, stage);
    }
  }

  const isArchived = stage === 'archived';

  return (
    <div className={`flex-shrink-0 w-64 flex flex-col h-full${isArchived ? ' opacity-60' : ''}`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <h3 className={`text-sm font-semibold ${isArchived ? 'text-gray-400' : 'text-gray-700'}`}>
          {isArchived && <span className="mr-1">🗄</span>}
          {t(`stages.${stage}`)}
          {stage === 'reviewed' && (
            <span className="ml-1.5 text-[10px] font-normal text-amber-500">{t('column.auto_archive_hint')}</span>
          )}
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {contents.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDoubleClick={onDoubleClick}
        className={`flex-1 min-h-32 overflow-y-auto rounded-lg p-2 space-y-2 transition-colors ${
          isDragOver
            ? 'bg-indigo-50 border-2 border-dashed border-indigo-300'
            : 'bg-gray-50 border-2 border-transparent'
        }`}
      >
        {contents.map((content) => (
          <KanbanCard
            key={content.id}
            content={content}
            onClick={onCardClick}
            onDragStart={handleDragStart}
          />
        ))}
        {contents.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-gray-400">
            {isDragOver ? t('column.drop_here') : t('column.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
