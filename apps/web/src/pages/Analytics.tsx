import { useTranslation } from 'react-i18next';

export default function Analytics() {
  const { t } = useTranslation('common');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">{t('nav.analytics')}</h1>
      <p className="mt-2 text-gray-500">Coming soon — W3+</p>
    </div>
  );
}
