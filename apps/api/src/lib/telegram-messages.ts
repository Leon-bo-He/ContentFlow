type Locale = string;

interface TelegramMessages {
  test: string;
  reminderTitle: string;
  reminderScheduled: string;
  reminderPlatform: string;
}

const messages: Record<string, TelegramMessages> = {
  'en-US': {
    test: '✅ <b>Orbit</b> — Telegram notifications are working!',
    reminderTitle: '🔔 <b>Orbit publish reminder</b>',
    reminderScheduled: '🕐 Scheduled',
    reminderPlatform: '📡 Platform',
  },
  'zh-CN': {
    test: '✅ <b>Orbit</b> — Telegram 通知已正常运行！',
    reminderTitle: '🔔 <b>Orbit 发布提醒</b>',
    reminderScheduled: '🕐 计划发布',
    reminderPlatform: '📡 平台',
  },
  'zh-TW': {
    test: '✅ <b>Orbit</b> — Telegram 通知已正常運作！',
    reminderTitle: '🔔 <b>Orbit 發布提醒</b>',
    reminderScheduled: '🕐 排程發佈',
    reminderPlatform: '📡 平台',
  },
  'ja-JP': {
    test: '✅ <b>Orbit</b> — Telegram 通知が正常に動作しています！',
    reminderTitle: '🔔 <b>Orbit 発行リマインダー</b>',
    reminderScheduled: '🕐 予定時刻',
    reminderPlatform: '📡 プラットフォーム',
  },
  'ko-KR': {
    test: '✅ <b>Orbit</b> — Telegram 알림이 정상적으로 작동 중입니다！',
    reminderTitle: '🔔 <b>Orbit 발행 알림</b>',
    reminderScheduled: '🕐 예약 시간',
    reminderPlatform: '📡 플랫폼',
  },
};

export function getTelegramMessages(locale: Locale): TelegramMessages {
  return messages[locale] ?? messages['en-US']!;
}
