import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Workspace } from '@contentflow/shared';
import { useWorkspaces, useUpdateWorkspace } from '../api/workspaces.js';
import { useAuthStore } from '../store/auth.store.js';
import { useUiStore, type Theme } from '../store/ui.store.js';
import { CreateWorkspaceModal } from '../components/workspaces/CreateWorkspaceModal.js';
import i18n, { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n/index.js';

type Section = 'general' | 'notifications' | 'workspaces' | 'account';

const PLATFORM_EMOJI: Record<string, string> = {
  douyin: '🎵', xiaohongshu: '📕', weixin: '📰', weixin_video: '📱',
  bilibili: '🎬', x: '🐦', youtube: '▶️', instagram: '📷',
};

const LOCALE_META: Record<SupportedLocale, { flag: string; label: string }> = {
  'zh-CN': { flag: '🇨🇳', label: '简体中文' },
  'zh-TW': { flag: '🇹🇼', label: '繁體中文' },
  'en-US': { flag: '🇺🇸', label: 'English' },
  'ja-JP': { flag: '🇯🇵', label: '日本語' },
  'ko-KR': { flag: '🇰🇷', label: '한국어' },
};

const EMOJI_OPTIONS = ['🎬', '📸', '✍️', '🎙', '📺', '🎮', '💄', '👗', '🍜', '✈️', '💪', '🐱'];

// ─── Shared row style ─────────────────────────────────────────────────────────

const ROW = 'flex items-center justify-between py-3 border-b border-gray-100';
const LABEL = 'text-sm font-medium text-gray-900';

// ─── Edit Workspace Modal ─────────────────────────────────────────────────────

function EditWorkspaceModal({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const { t } = useTranslation('workspaces');
  const updateWorkspace = useUpdateWorkspace();
  const [name, setName] = useState(workspace.name);
  const [icon, setIcon] = useState(workspace.icon);
  const [goalCount, setGoalCount] = useState(workspace.publishGoal?.count ?? 1);
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week' | 'month'>(workspace.publishGoal?.period ?? 'week');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await updateWorkspace.mutateAsync({
      id: workspace.id,
      data: { name: name.trim(), icon, publishGoal: { count: goalCount, period: goalPeriod } },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{t('edit_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('name')}</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">{t('icon_label')}</label>
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setIcon(e)}
                  className={`text-xl rounded-md py-1.5 transition-colors ${icon === e ? 'bg-indigo-50 ring-1 ring-indigo-400' : 'hover:bg-gray-100'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">{t('publish_goal')}</label>
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={365} value={goalCount}
                onChange={(e) => setGoalCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-200 text-center" />
              <select value={goalPeriod} onChange={(e) => setGoalPeriod(e.target.value as 'day' | 'week' | 'month')}
                className="text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="day">{t('publish_period.day')}</option>
                <option value="week">{t('publish_period.week')}</option>
                <option value="month">{t('publish_period.month')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
              {t('cancel')}
            </button>
            <button type="submit" disabled={updateWorkspace.isPending}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {updateWorkspace.isPending ? '…' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light',  label: 'Light'  },
  { value: 'dark',   label: 'Dark'   },
];

function GeneralPanel() {
  const { t: tc } = useTranslation('common');
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  function handleLocale(l: SupportedLocale) {
    setLocale(l);
    void i18n.changeLanguage(l);
  }

  return (
    <div>
      <div className={ROW}>
        <span className={LABEL}>{tc('action.language') || 'Language'}</span>
        <select
          value={locale}
          onChange={(e) => handleLocale(e.target.value as SupportedLocale)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>{LOCALE_META[l].flag} {LOCALE_META[l].label}</option>
          ))}
        </select>
      </div>

      <div className={ROW}>
        <span className={LABEL}>Timezone</span>
        <span className="text-sm text-gray-500">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
      </div>

      <div className={ROW}>
        <span className={LABEL}>Appearance</span>
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`px-3 py-1.5 transition-colors ${
                theme === opt.value
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const [enabled, setEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [leadTime, setLeadTime] = useState(15);

  async function handleToggle() {
    if (!enabled) {
      const perm = await Notification.requestPermission();
      setEnabled(perm === 'granted');
    } else {
      setEnabled(false);
    }
  }

  return (
    <div>
      <div className={ROW}>
        <div>
          <p className={LABEL}>Publish reminders</p>
          <p className="text-xs text-gray-500 mt-0.5">Get notified before a scheduled publication</p>
        </div>
        <button
          onClick={() => void handleToggle()}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      </div>

      {enabled && (
        <div className={ROW}>
          <span className={LABEL}>Reminder lead time</span>
          <select
            value={leadTime}
            onChange={(e) => setLeadTime(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          >
            {[5, 10, 15, 30, 60].map((m) => <option key={m} value={m}>{m} min before</option>)}
          </select>
        </div>
      )}

      {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
        <p className="text-xs text-red-500 pt-3">
          Notifications are blocked. Enable them in your browser settings.
        </p>
      )}
    </div>
  );
}

function WorkspacesPanel() {
  const { t } = useTranslation('workspaces');
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Workspace | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
        >
          + {t('new_workspace')}
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}

      {!isLoading && workspaces.length === 0 && (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-400 text-sm">{t('no_workspaces')}</p>
        </div>
      )}

      <div className="space-y-1.5">
        {workspaces.map((ws) => (
          <div key={ws.id}
            className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0"
              style={{ backgroundColor: ws.color + '18' }}>
              {ws.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{ws.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: ws.color }}>
                  {PLATFORM_EMOJI[ws.platform]} {ws.platform}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t(`content_types.${ws.contentType}`)}
                {ws.publishGoal ? ` · ${ws.publishGoal.count}/${t(`publish_period.${ws.publishGoal.period}`)}` : ''}
              </p>
            </div>
            <button onClick={() => setEditing(ws)}
              className="text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0">
              {t('edit')}
            </button>
          </div>
        ))}
      </div>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
      {editing && <EditWorkspaceModal workspace={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AccountPanel() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.name ? (user.name[0]?.toUpperCase() ?? 'U') : 'U';

  return (
    <div>
      <div className="flex items-center gap-4 py-4 border-b border-gray-100">
        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold flex-shrink-0">
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className={ROW}>
        <span className={LABEL}>Name</span>
        <span className="text-sm text-gray-500">{user?.name}</span>
      </div>
      <div className={ROW}>
        <span className={LABEL}>Email</span>
        <span className="text-sm text-gray-500">{user?.email}</span>
      </div>
      <div className={ROW}>
        <span className={LABEL}>Password</span>
        <button className="text-sm text-indigo-600 hover:text-indigo-700">Change password</button>
      </div>
      <div className="pt-5">
        <button className="text-sm text-red-500 hover:text-red-600">Delete account…</button>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'general',       label: 'General'       },
  { id: 'notifications', label: 'Notifications' },
  { id: 'workspaces',    label: 'Workspaces'    },
  { id: 'account',       label: 'Account'       },
];

const SECTION_TITLES: Record<Section, string> = {
  general: 'General', notifications: 'Notifications',
  workspaces: 'Workspaces', account: 'Account',
};

export default function Settings() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('general');

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') navigate(-1); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={() => navigate(-1)}
    >
      <div
        className="bg-white w-full max-w-2xl flex overflow-hidden rounded-xl border border-gray-200"
        style={{ height: 500, boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left nav */}
        <div className="w-44 flex-shrink-0 bg-gray-50 border-r border-gray-100 flex flex-col pt-4 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="mx-3 mb-3 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 text-xs transition-colors"
            aria-label="Close settings"
          >
            ✕
          </button>

          <nav className="flex-1 px-2 space-y-[1px]">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full text-left px-3 py-[6px] rounded-md text-[13px] transition-colors ${
                  section === item.id
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900">{SECTION_TITLES[section]}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {section === 'general'       && <GeneralPanel />}
            {section === 'notifications' && <NotificationsPanel />}
            {section === 'workspaces'    && <WorkspacesPanel />}
            {section === 'account'       && <AccountPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
