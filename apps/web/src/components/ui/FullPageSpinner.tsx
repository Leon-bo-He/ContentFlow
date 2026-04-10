import OrbitLogo from './OrbitLogo.js';

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-6" />
      <OrbitLogo variant="icon" className="h-10 w-10" />
    </div>
  );
}
