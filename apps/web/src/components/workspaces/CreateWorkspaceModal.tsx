import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Platform, ContentType } from '@contentflow/shared';
import { useCreateWorkspace } from '../../api/workspaces.js';
import { useUiStore } from '../../store/ui.store.js';

const EMOJI_OPTIONS = ['🎬', '📸', '✍️', '🎙', '📺', '🎮', '💄', '👗', '🍜', '✈️', '💪', '🐱'];

const COLOR_OPTIONS: { name: string; value: string }[] = [
  { name: 'indigo', value: '#6366f1' },
  { name: 'rose', value: '#f43f5e' },
  { name: 'amber', value: '#f59e0b' },
  { name: 'emerald', value: '#10b981' },
  { name: 'sky', value: '#0ea5e9' },
  { name: 'violet', value: '#8b5cf6' },
  { name: 'pink', value: '#ec4899' },
  { name: 'teal', value: '#14b8a6' },
];

const PLATFORM_OPTIONS: { value: Platform; label: string; emoji: string }[] = [
  { value: 'douyin', label: 'Douyin', emoji: '🎵' },
  { value: 'xiaohongshu', label: 'Xiaohongshu', emoji: '📕' },
  { value: 'weixin', label: 'WeChat OA', emoji: '📰' },
  { value: 'weixin_video', label: 'WeChat Video', emoji: '📱' },
  { value: 'bilibili', label: 'Bilibili', emoji: '🎬' },
  { value: 'x', label: 'X', emoji: '🐦' },
  { value: 'youtube', label: 'YouTube', emoji: '▶️' },
  { value: 'instagram', label: 'Instagram', emoji: '📷' },
];

const CONTENT_TYPE_OPTIONS: { value: ContentType; labelKey: string }[] = [
  { value: 'video_short', labelKey: 'content_types.video_short' },
  { value: 'video_long', labelKey: 'content_types.video_long' },
  { value: 'image_text', labelKey: 'content_types.image_text' },
  { value: 'article', labelKey: 'content_types.article' },
  { value: 'podcast', labelKey: 'content_types.podcast' },
  { value: 'live', labelKey: 'content_types.live' },
];

const TIMEZONE_OPTIONS = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
];

interface CreateWorkspaceModalProps {
  onClose: () => void;
}

export function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  const { t } = useTranslation('workspaces');
  const navigate = useNavigate();
  const createWorkspace = useCreateWorkspace();
  const setActiveWorkspace = useUiStore((s) => s.setActiveWorkspace);

  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(EMOJI_OPTIONS[0]!);
  const [color, setColor] = useState(COLOR_OPTIONS[0]!.value);

  // Step 2
  const [platform, setPlatform] = useState<Platform>('douyin');
  const [contentType, setContentType] = useState<ContentType>('video_short');

  // Step 3
  const [goalCount, setGoalCount] = useState<number>(1);
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [timezone, setTimezone] = useState('Asia/Shanghai');

  const [nameError, setNameError] = useState('');

  function handleNext() {
    if (step === 1) {
      if (!name.trim()) { setNameError(t('name_placeholder')); return; }
      setNameError('');
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await createWorkspace.mutateAsync({
      name: name.trim(),
      icon,
      color,
      platform,
      contentType,
      timezone,
      publishGoal: { count: goalCount, period: goalPeriod },
    });
    setActiveWorkspace(result.id);
    onClose();
    void navigate(`/workspaces/${result.id}/board`);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{t('create_title')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {step === 1 && t('step1_title')}
              {step === 2 && t('step2_title')}
              {step === 3 && t('step3_title')}
              &nbsp;({step}/3)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="px-6 py-5 space-y-5 min-h-72">
            {/* Step 1 — Basic info */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameError(''); }}
                    placeholder={t('name_placeholder')}
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
                          icon === emoji
                            ? 'bg-indigo-100 ring-2 ring-indigo-400'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('color_label')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Platform & Type */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('platform')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-colors ${
                          platform === p.value
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{p.emoji}</span>
                        <span className="text-center leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('content_type')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CONTENT_TYPE_OPTIONS.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setContentType(ct.value)}
                        className={`py-2 rounded-lg border text-sm transition-colors ${
                          contentType === ct.value
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t(ct.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 3 — Goals */}
            {step === 3 && (
              <>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('timezone')}</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { if (step === 1) onClose(); else setStep((s) => s - 1); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {step === 1 ? t('cancel') : t('prev')}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {t('next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={createWorkspace.isPending}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {createWorkspace.isPending ? '...' : t('submit')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
