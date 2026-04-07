import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.js';
import { useUiStore } from '../../store/ui.store.js';

const navItems = [
  { path: '/', label: 'nav.dashboard', icon: '◻' },
  { path: '/ideas', label: 'nav.ideas', icon: '💡' },
  { path: '/publications', label: 'nav.publications', icon: '📤' },
  { path: '/settings', label: 'nav.settings', icon: '⚙' },
] as const;

export function Sidebar() {
  const { t } = useTranslation('common');
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <div className="h-full flex flex-col bg-surface-raised border-r border-gray-200">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 flex-shrink-0">
        {!collapsed && <span className="font-semibold text-indigo-600">ContentFlow</span>}
        <button
          onClick={toggle}
          className="ml-auto text-gray-400 hover:text-gray-600"
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Workspace switcher */}
      {!collapsed && <WorkspaceSwitcher />}

      {/* Nav items */}
      <nav className="flex-1 py-2 space-y-0.5 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <span>{item.icon}</span>
            {!collapsed && <span>{t(item.label)}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
