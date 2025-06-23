import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRoles } from '../hooks/useUserRoles';
import Breadcrumbs, { useBreadcrumbs } from '../components/navigation/Breadcrumbs';
import { Save } from 'lucide-react';

const flagKeys = [
  'VITE_ENABLE_GAMIFICATION',
  'VITE_ENABLE_SOCIAL_MEDIA_SCHEDULING',
  'VITE_ENABLE_AI_CONTENT_GENERATION',
  'VITE_ENABLE_VENUE_BOOKING',
  'VITE_ENABLE_FAN_ENGAGEMENT'
] as const;

const SystemSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const { updateSecurity } = useUserRoles();
  const breadcrumbs = useBreadcrumbs();

  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxSessions, setMaxSessions] = useState(5);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (userProfile?.security_settings) {
      setSessionTimeout(userProfile.security_settings.sessionTimeout ?? 30);
      setMaxSessions(userProfile.security_settings.maxSessions ?? 5);
      setTwoFactorEnabled(userProfile.security_settings.twoFactorEnabled ?? false);
    }
  }, [userProfile?.security_settings]);

  const handleSave = async () => {
    if (!userProfile) return;
    await updateSecurity({
      id: userProfile.id,
      settings: { sessionTimeout, maxSessions, twoFactorEnabled }
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="font-playfair text-2xl font-bold tracking-tight text-white">System Settings</h1>
      <div className="space-y-6">
        {/* Feature Flags */}
        <div className="rounded-xl bg-gray-800/50 p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-6">Feature Flags</h3>
          <ul className="space-y-2">
            {flagKeys.map(key => (
              <li key={key} className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">{key}</span>
                <span className="text-white font-mono bg-gray-700/50 px-2 py-1 rounded-md">
                  {import.meta.env[key] || 'false'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Advanced Security Settings */}
        <div className="rounded-xl bg-gray-800/50 p-6 border border-gray-700/50 space-y-4">
          <h3 className="text-xl font-semibold text-white">Advanced Security</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min={5}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                value={sessionTimeout}
                onChange={e => setSessionTimeout(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Simultaneous Sessions
              </label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                value={maxSessions}
                onChange={e => setMaxSessions(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="twoFactor"
                type="checkbox"
                className="toggle toggle-primary"
                checked={twoFactorEnabled}
                onChange={e => setTwoFactorEnabled(e.target.checked)}
              />
              <label htmlFor="twoFactor" className="text-sm font-medium text-gray-300">
                Two-Factor Authentication Required
              </label>
            </div>
            <div className="pt-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

