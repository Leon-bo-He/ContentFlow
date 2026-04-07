import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const items = [
  { path: '/', label: 'nav.dashboard', icon: '◻' },
  { path: '/ideas', label: 'nav.ideas', icon: '💡' },
  { path: '/publications', label: 'nav.publications', icon: '📤' },
  { path: '/settings', label: 'nav.settings', icon: '⚙' },
] as const;

export function MobileBottomNav() {
  const { t } = useTranslation('common');
  return (
    <div className="flex justify-around items-center h-16 bg-surface-raised">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs px-3 py-1 ${
              isActive ? 'text-indigo-600' : 'text-gray-500'
            }`
          }
        >
          <span className="text-xl">{item.icon}</span>
          <span>{t(item.label)}</span>
        </NavLink>
      ))}
    </div>
  );
}
