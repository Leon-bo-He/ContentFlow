import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateIdea } from '../../api/ideas.js';
import { useWorkspaces } from '../../api/workspaces.js';
import type { Idea } from '@contentflow/shared';

interface IdeaEditModalProps {
  idea: Idea;
  onClose: () => void;
}

type Priority = 'low' | 'medium' | 'high';
type Status = 'active' | 'converted' | 'archived';

export function IdeaEditModal({ idea, onClose }: IdeaEditModalProps) {
  const { t } = useTranslation('ideas');
  const updateIdea = useUpdateIdea();
  const { data: workspaces } = useWorkspaces();

  const [title, setTitle] = useState(idea.title);
  const [note, setNote] = useState(idea.note ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(idea.tags);
  const [priority, setPriority] = useState<Priority>(idea.priority as Priority);
  const [status, setStatus] = useState<Status>(idea.status as Status);
  const [workspaceId, setWorkspaceId] = useState(idea.workspaceId ?? '');

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  function addTag(raw: string) {
    const trimmed = raw.trim().replace(/,+$/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await updateIdea.mutateAsync({
      id: idea.id,
      data: {
        title: title.trim(),
        note: note.trim() || null,
        tags,
        priority,
        status,
        workspaceId: workspaceId || null,
      },
    });
    onClose();
  }

  const priorityOptions: { value: Priority; label: string; classes: string; activeClasses: string }[] = [
    { value: 'low',    label: t('priority.low'),    classes: 'border-gray-300 text-gray-600',     activeClasses: 'bg-gray-600 text-white border-gray-600' },
    { value: 'medium', label: t('priority.medium'), classes: 'border-yellow-400 text-yellow-700', activeClasses: 'bg-yellow-500 text-white border-yellow-500' },
    { value: 'high',   label: t('priority.high'),   classes: 'border-red-400 text-red-700',       activeClasses: 'bg-red-500 text-white border-red-500' },
  ];

  const statusOptions: { value: Status; label: string; activeClasses: string }[] = [
    { value: 'active',    label: t('status.active'),    activeClasses: 'bg-indigo-600 text-white border-indigo-600' },
    { value: 'converted', label: t('status.converted'), activeClasses: 'bg-green-600 text-white border-green-600' },
    { value: 'archived',  label: t('status.archived'),  activeClasses: 'bg-gray-500 text-white border-gray-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-900">{t('edit_title')}</h2>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fields.title')}<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('fields.title_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.note')}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('fields.note_placeholder')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.tags')}</label>
              <div className="flex flex-wrap gap-1.5 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent min-h-[42px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-indigo-200 hover:text-white leading-none">×</button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={tags.length === 0 ? t('fields.tags_placeholder') : ''}
                  className="flex-1 min-w-[100px] text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.status')}</label>
              <div className="flex gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      status === opt.value
                        ? opt.activeClasses
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.priority')}</label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                      priority === opt.value ? opt.activeClasses : opt.classes
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workspace */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('fields.workspace')}</label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">{t('fields.no_workspace')}</option>
                {workspaces?.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.icon} {ws.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 border-t border-gray-100 flex-shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {t('action.cancel')}
            </button>
            <button
              type="submit"
              disabled={!title.trim() || updateIdea.isPending}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateIdea.isPending ? '…' : t('action.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
