import { useUiStore } from '../../store/ui.store.js';
import { useTranslation } from 'react-i18next';

export function WorkspaceSwitcher() {
  const { t } = useTranslation('common');
  const activeId = useUiStore((s) => s.activeWorkspaceId);

  return (
    <div className="px-3 py-2">
      <button
        className="w-full text-left text-sm text-gray-500 hover:text-gray-900 truncate"
        title={t('workspace.switcher_label')}
      >
        {activeId ?? t('workspace.no_workspace')}
      </button>
    </div>
  );
}
