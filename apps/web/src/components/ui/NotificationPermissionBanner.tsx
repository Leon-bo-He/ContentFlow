import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePushNotifications } from '../../hooks/usePushNotifications.js';

const DISMISSED_KEY = 'contentflow-notif-banner-dismissed';

export function NotificationPermissionBanner() {
  const { t } = useTranslation('common');
  const { permission, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );

  if (typeof Notification === 'undefined') return null;
  if (permission !== 'default') return null;
  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }

  return (
    <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center gap-3 text-sm text-indigo-800">
      <span className="flex-1">{t('notifications.banner_text')}</span>
      <button
        onClick={() => void requestPermission()}
        className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
      >
        {t('action.enable')}
      </button>
      <button
        onClick={handleDismiss}
        className="text-indigo-400 hover:text-indigo-600 flex-shrink-0 text-base leading-none"
        aria-label={t('aria.dismiss')}
      >
        ✕
      </button>
    </div>
  );
}
