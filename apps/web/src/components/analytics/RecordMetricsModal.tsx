import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContents } from '../../api/contents.js';
import { usePublications } from '../../api/publications.js';
import { useCreateMetrics } from '../../api/analytics.js';
import type { Content } from '@contentflow/shared';
import type { Publication } from '@contentflow/shared';

interface RecordMetricsModalProps {
  workspaceId: string;
  onClose: () => void;
}

interface MetricsFormState {
  publicationId: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  followersGained: string;
}

function PublicationSelector({
  workspaceId,
  value,
  onChange,
}: {
  workspaceId: string;
  value: string;
  onChange: (pubId: string) => void;
}) {
  const { t } = useTranslation('analytics');
  const [selectedContentId, setSelectedContentId] = useState('');
  const { data: contents = [] } = useContents(workspaceId);
  const publishedContents = contents.filter((c: Content) => c.stage === 'published');

  const { data: publications = [] } = usePublications(selectedContentId);
  const publishedPubs = publications.filter((p: Publication) => p.status === 'published');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('record.content_label')}
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          value={selectedContentId}
          onChange={(e) => {
            setSelectedContentId(e.target.value);
            onChange('');
          }}
        >
          <option value="">{t('record.content_placeholder')}</option>
          {publishedContents.map((c: Content) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {selectedContentId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('record.publication_label')}
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{t('record.publication_placeholder')}</option>
            {publishedPubs.map((p: Publication) => (
              <option key={p.id} value={p.id}>
                {p.platform}
                {p.platformTitle ? ` — ${p.platformTitle}` : ''}
              </option>
            ))}
          </select>
          {publishedPubs.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">{t('record.no_publications')}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function RecordMetricsModal({ workspaceId, onClose }: RecordMetricsModalProps) {
  const { t } = useTranslation('analytics');
  const createMetrics = useCreateMetrics();

  const [form, setForm] = useState<MetricsFormState>({
    publicationId: '',
    views: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    followersGained: '',
  });

  function setField(field: keyof MetricsFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toInt(s: string): number | undefined {
    const n = parseInt(s, 10);
    return isNaN(n) ? undefined : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.publicationId) return;

    const payload: import('../../api/analytics.js').CreateMetricsInput = {
      publicationId: form.publicationId,
    };
    const v = toInt(form.views);
    const l = toInt(form.likes);
    const c = toInt(form.comments);
    const s = toInt(form.shares);
    const sv = toInt(form.saves);
    const fg = toInt(form.followersGained);
    if (v !== undefined) payload.views = v;
    if (l !== undefined) payload.likes = l;
    if (c !== undefined) payload.comments = c;
    if (s !== undefined) payload.shares = s;
    if (sv !== undefined) payload.saves = sv;
    if (fg !== undefined) payload.followersGained = fg;

    await createMetrics.mutateAsync(payload);
    onClose();
  }

  const numberFields: Array<{ key: keyof MetricsFormState; labelKey: string }> = [
    { key: 'views', labelKey: 'metrics.views' },
    { key: 'likes', labelKey: 'metrics.likes' },
    { key: 'comments', labelKey: 'metrics.comments' },
    { key: 'shares', labelKey: 'metrics.shares' },
    { key: 'saves', labelKey: 'metrics.saves' },
    { key: 'followersGained', labelKey: 'metrics.followers_gained' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('record.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('record.cancel')}
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <PublicationSelector
            workspaceId={workspaceId}
            value={form.publicationId}
            onChange={(id) => setField('publicationId', id)}
          />

          <div className="grid grid-cols-2 gap-3">
            {numberFields.map(({ key, labelKey }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t(labelKey)}
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {createMetrics.isError && (
            <p className="text-sm text-red-600">
              {t('record.error', { message: createMetrics.error?.message ?? '' })}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('record.cancel')}
            </button>
            <button
              type="submit"
              disabled={!form.publicationId || createMetrics.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMetrics.isPending ? t('record.saving') : t('record.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
