import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { SecuritySettings } from '../../contexts/AuthContext';
import { TwoFactorSetup } from './TwoFactorSetup';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Eye,
  Trash2,
  Key,
  Lock,
  Unlock,
  Activity,
  Settings,
  Bell,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  Wifi,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SecurityDashboardProps {
  onClose?: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onClose }) => {
  const {
    userProfile,
    auditLogs,
    devices,
    sessions,
    securityAlerts,
    getAuditLogs,
    getDevices,
    getActiveSessions,
    getSecurityAlerts,
    trustDevice,
    removeDevice,
    revokeSession,
    revokeAllSessions,
    resolveAlert,
    changePassword,
    updateProfile
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'devices' | 'alerts' | 'audit' | 'settings'>('overview');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [auditFilter, setAuditFilter] = useState<'all' | 'login' | 'security' | 'changes'>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'unresolved' | 'critical'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const defaultSettings: SecuritySettings = {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxSessions: 5,
    ipWhitelist: [] as string[],
    allowRememberMe: true,
    passwordExpiryDays: 90,
    loginAttemptLimit: 5
  };

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSettings);
  const [ipWhitelistInput, setIpWhitelistInput] = useState('');

  useEffect(() => {
    const settings = userProfile?.security_settings || defaultSettings;
    setSecuritySettings({ ...defaultSettings, ...settings });
    setIpWhitelistInput((settings.ipWhitelist || []).join(', '));
  }, [userProfile]);

  const handleSettingsChange = (
    field: keyof SecuritySettings,
    value: string | number | boolean
  ) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const updated = {
      ...securitySettings,
      ipWhitelist: ipWhitelistInput
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean)
    };
    try {
      await updateProfile({ security_settings: updated });
      toast.success('Security settings updated');
    } catch (error) {
      console.error('Failed to update security settings:', error);
      toast.error('Failed to save security settings');
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        getAuditLogs(),
        getDevices(),
        getActiveSessions(),
        getSecurityAlerts()
      ]);
    } catch (error) {
      console.error('Failed to load security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default: return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-red-400 bg-red-500/10';
      case 'medium': return 'text-amber-400 bg-amber-500/10';
      default: return 'text-green-400 bg-green-500/10';
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'login') return ['login', 'logout', 'failed_login'].includes(log.action);
    if (auditFilter === 'security') return ['2fa_enabled', '2fa_disabled', 'password_change'].includes(log.action);
    if (auditFilter === 'changes') return ['profile_update', 'permission_change'].includes(log.action);
    return true;
  });

  const filteredAlerts = securityAlerts.filter(alert => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'unresolved') return !alert.resolved;
    if (alertFilter === 'critical') return alert.severity === 'critical' || alert.severity === 'error';
    return true;
  });

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Security Score</h3>
            <p className="text-gray-400">Your account security rating</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">85%</div>
            <div className="text-sm text-gray-400">Good</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Two-Factor Authentication</span>
            {userProfile?.two_factor_auth?.isEnabled ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Strong Password</span>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Recent Activity Review</span>
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{sessions.filter(s => s.isActive).length}</div>
              <div className="text-sm text-gray-400">Active Sessions</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Monitor className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{devices.filter(d => d.isTrusted).length}</div>
              <div className="text-sm text-gray-400">Trusted Devices</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">{securityAlerts.filter(a => !a.resolved).length}</div>
              <div className="text-sm text-gray-400">Security Alerts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recent Security Alerts</h3>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {securityAlerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
              {getAlertIcon(alert.severity)}
              <div className="flex-1">
                <div className="text-white text-sm">{alert.message}</div>
                <div className="text-gray-400 text-xs">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
              {!alert.resolved && (
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}

          {securityAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No security alerts</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!userProfile?.two_factor_auth?.isEnabled && (
            <button
              onClick={() => setShowTwoFactorSetup(true)}
              className="flex items-center gap-3 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-white">Enable Two-Factor Auth</span>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('sessions')}
            className="flex items-center gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Activity className="h-5 w-5 text-gray-400" />
            <span className="text-white">Review Sessions</span>
          </button>
          
          <button
            onClick={() => setActiveTab('devices')}
            className="flex items-center gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Monitor className="h-5 w-5 text-gray-400" />
            <span className="text-white">Manage Devices</span>
          </button>
          
          <button
            onClick={() => setActiveTab('audit')}
            className="flex items-center gap-3 p-3 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye className="h-5 w-5 text-gray-400" />
            <span className="text-white">View Audit Log</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Sessions Tab
  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Active Sessions</h3>
          <p className="text-gray-400">Monitor and manage your active login sessions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadSecurityData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={revokeAllSessions}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Revoke All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Wifi className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium">
                    Session {session.id === '1' ? '(Current)' : ''}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Started: {new Date(session.startTime).toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Last activity: {new Date(session.lastActivity).toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">IP: {session.ipAddress}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs ${session.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {session.isActive ? 'Active' : 'Inactive'}
                </div>
                {session.id !== '1' && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-sm"
                  >
                    <Trash2 className="h-3 w-3" />
                    Revoke
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active sessions</p>
          </div>
        )}
      </div>
    </div>
  );

  // Devices Tab
  const renderDevices = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Trusted Devices</h3>
          <p className="text-gray-400">Manage devices that have accessed your account</p>
        </div>
        <button
          onClick={loadSecurityData}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  {getDeviceIcon(device.deviceType)}
                </div>
                <div>
                  <div className="text-white font-medium flex items-center gap-2">
                    {device.deviceName}
                    {device.isCurrentDevice && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Current</span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">{device.browser} on {device.os}</div>
                  <div className="text-gray-400 text-sm">
                    Last used: {new Date(device.lastUsed).toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">IP: {device.ipAddress}</div>
                  {device.location && (
                    <div className="text-gray-400 text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {device.location.city}, {device.location.country}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs ${device.isTrusted ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {device.isTrusted ? 'Trusted' : 'Untrusted'}
                </div>
                
                <div className="flex gap-2">
                  {!device.isTrusted && (
                    <button
                      onClick={() => trustDevice(device.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors text-sm"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Trust
                    </button>
                  )}
                  
                  {!device.isCurrentDevice && (
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-sm"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No devices found</p>
          </div>
        )}
      </div>
    </div>
  );

  // Security Alerts Tab
  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Security Alerts</h3>
          <p className="text-gray-400">Review and manage security notifications</p>
        </div>
        <div className="flex gap-3">
          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Alerts</option>
            <option value="unresolved">Unresolved</option>
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={loadSecurityData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}
                <div>
                  <div className="text-white font-medium">{alert.message}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs mt-2 ${getRiskColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs ${alert.resolved ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {alert.resolved ? 'Resolved' : 'Unresolved'}
                </div>
                
                {!alert.resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors text-sm"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No security alerts</p>
          </div>
        )}
      </div>
    </div>
  );

  // Audit Log Tab
  const renderAuditLog = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Audit Log</h3>
          <p className="text-gray-400">Complete history of account activity</p>
        </div>
        <div className="flex gap-3">
          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activity</option>
            <option value="login">Login Events</option>
            <option value="security">Security Changes</option>
            <option value="changes">Profile Changes</option>
          </select>
          <button
            onClick={loadSecurityData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              const csvContent = filteredAuditLogs.map(log => 
                `"${log.timestamp}","${log.action}","${log.details}","${log.ipAddress}","${log.riskLevel}"`
              ).join('\n');
              const blob = new Blob([`Timestamp,Action,Details,IP Address,Risk Level\n${csvContent}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAuditLogs.map((log) => (
          <div key={log.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <Activity className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <div className="text-white font-medium capitalize">{log.action.replace('_', ' ')}</div>
                  <div className="text-gray-300 text-sm mt-1">{log.details}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {log.ipAddress}
                    </span>
                    {log.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {log.location.city}, {log.location.country}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`px-2 py-1 rounded text-xs ${getRiskColor(log.riskLevel)}`}>
                {log.riskLevel.toUpperCase()}
              </div>
            </div>
          </div>
        ))}

        {filteredAuditLogs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Require Two-Factor Authentication</label>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={securitySettings.twoFactorEnabled}
            onChange={e => handleSettingsChange('twoFactorEnabled', e.target.checked)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Password Expiry (days)</label>
          <input
            type="number"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            value={securitySettings.passwordExpiryDays}
            onChange={e => handleSettingsChange('passwordExpiryDays', Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Max Login Attempts</label>
          <input
            type="number"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            value={securitySettings.loginAttemptLimit}
            onChange={e => handleSettingsChange('loginAttemptLimit', Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Session Timeout (minutes)</label>
          <input
            type="number"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            value={securitySettings.sessionTimeout}
            onChange={e => handleSettingsChange('sessionTimeout', Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={securitySettings.allowRememberMe}
            onChange={e => handleSettingsChange('allowRememberMe', e.target.checked)}
          />
          <label className="text-white">Allow "Remember Me"</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">IP Whitelist</label>
          <input
            type="text"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
            value={ipWhitelistInput}
            onChange={e => setIpWhitelistInput(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Save Settings
        </button>
      </div>
    </form>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Security Dashboard</h2>
              <p className="text-gray-400">Monitor and manage your account security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'sessions', label: 'Sessions', icon: Activity },
            { id: 'devices', label: 'Devices', icon: Monitor },
            { id: 'alerts', label: 'Alerts', icon: Bell },
            { id: 'audit', label: 'Audit Log', icon: Eye },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading security data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'sessions' && renderSessions()}
              {activeTab === 'devices' && renderDevices()}
              {activeTab === 'alerts' && renderAlerts()}
              {activeTab === 'audit' && renderAuditLog()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>

      {/* Two-Factor Setup Modal */}
      {showTwoFactorSetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShowTwoFactorSetup(false);
            loadSecurityData();
          }}
          onCancel={() => setShowTwoFactorSetup(false)}
        />
      )}
    </div>
  );
}; 