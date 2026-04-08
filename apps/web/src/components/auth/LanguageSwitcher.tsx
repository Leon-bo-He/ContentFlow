import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/index.js';
import { useUiStore } from '../../store/ui.store.js';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
};

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { locale, setLocale } = useUiStore();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as SupportedLocale;
    setLocale(next);
    void i18n.changeLanguage(next);
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 outline-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
      aria-label={t('action.language')}
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_LABELS[loc]}
        </option>
      ))}
    </select>
  );
}
