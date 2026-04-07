import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Workspace } from '@contentflow/shared';
import { useWorkspaces, useUpdateWorkspace } from '../api/workspaces.js';
import { CreateWorkspaceModal } from '../components/workspaces/CreateWorkspaceModal.js';

const PLATFORM_EMOJI: Record<string, string> = {
  douyin: '🎵',
  xiaohongshu: '📕',
  weixin: '📰',
  weixin_video: '📱',
  bilibili: '🎬',
  x: '🐦',
  youtube: '▶️',
  instagram: '📷',
};

interface EditWorkspaceModalProps {
  workspace: Workspace;
  onClose: () => void;
}

function EditWorkspaceModal({ workspace, onClose }: EditWorkspaceModalProps) {
  const { t } = useTranslation('workspaces');
  const updateWorkspace = useUpdateWorkspace();

  const [name, setName] = useState(workspace.name);
  const [icon, setIcon] = useState(workspace.icon);
  const [goalCount, setGoalCount] = useState(workspace.publishGoal?.count ?? 1);
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week' | 'month'>(
    workspace.publishGoal?.period ?? 'week'
  );
  const [nameError, setNameError] = useState('');

  const EMOJI_OPTIONS = ['🎬', '📸', '✍️', '🎙', '📺', '🎮', '💄', '👗', '🍜', '✈️', '💪', '🐱'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError(t('name_placeholder')); return; }
    await updateWorkspace.mutateAsync({
      id: workspace.id,
      data: {
        name: name.trim(),
        icon,
        publishGoal: { count: goalCount, period: goalPeriod },
      },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{t('edit_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('icon_label')}</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl rounded-lg py-2 transition-colors ${
                    icon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('publish_goal')}</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('publish_goal_placeholder')}</span>
              <input
                type="number"
                min={1}
                max={365}
                value={goalCount}
                onChange={(e) => setGoalCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-200 text-center"
              />
              <select
                value={goalPeriod}
                onChange={(e) => setGoalPeriod(e.target.value as 'day' | 'week' | 'month')}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="day">{t('publish_period.day')}</option>
                <option value="week">{t('publish_period.week')}</option>
                <option value="month">{t('publish_period.month')}</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={updateWorkspace.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateWorkspace.isPending ? '...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation('workspaces');
  const { t: tc } = useTranslation('common');
  const { data: workspaces = [], isLoading } = useWorkspaces();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{tc('nav.settings')}</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <span>+</span>
          <span>{t('new_workspace')}</span>
        </button>
      </div>

      {isLoading && (
        <div className="text-gray-400 text-sm">Loading…</div>
      )}

      {!isLoading && workspaces.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 font-medium">{t('no_workspaces')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('no_workspaces_desc')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t('new_workspace')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            {/* Color accent */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: ws.color + '22', border: `2px solid ${ws.color}44` }}
            >
              {ws.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{ws.name}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: ws.color }}
                >
                  {ws.platform}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">
                  {PLATFORM_EMOJI[ws.platform]} {t(`content_types.${ws.contentType}`)}
                </span>
                {ws.publishGoal && (
                  <span className="text-xs text-gray-400">
                    · {ws.publishGoal.count}/{t(`publish_period.${ws.publishGoal.period}`)}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditingWorkspace(ws)}
              className="text-sm text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {t('edit')}
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />
      )}

      {editingWorkspace && (
        <EditWorkspaceModal
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
        />
      )}
    </div>
  );
}
