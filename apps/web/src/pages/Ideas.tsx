import { useTranslation } from 'react-i18next';

export default function Ideas() {
  const { t } = useTranslation('common');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">{t('nav.ideas')}</h1>
      <p className="mt-2 text-gray-500">Coming soon — W3+</p>
    </div>
  );
}
