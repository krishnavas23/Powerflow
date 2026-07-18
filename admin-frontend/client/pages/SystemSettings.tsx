import { Save, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    platformName: "POWERFLOW",
    supportEmail: "support@powerflow.io",
    maintenanceMessage: "Platform undergoing maintenance",
    maintenanceMode: false,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
  });

  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Stripe Payment Gateway",
      key: "sk_live_••••••••••••••••",
      status: "Active",
      lastUsed: "2025-01-10",
    },
    {
      id: 2,
      name: "AWS S3 Storage",
      key: "AKIA••••••••••••••",
      status: "Active",
      lastUsed: "2025-01-10",
    },
    {
      id: 3,
      name: "SendGrid Email",
      key: "SG.••••••••••••••••",
      status: "Inactive",
      lastUsed: "2025-01-05",
    },
  ]);

  const handleSettingChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const BACKEND = (typeof window !== 'undefined' && (window as any).__POWERFLOW_API__)
    || (import.meta as any).env?.VITE_BACKEND_BASE_URL
    || 'http://localhost:4000';

  // Load current config
  useEffect(() => {
    const token = localStorage.getItem('powerflow.token') || '';
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/admin/system-config`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        const cfg = await res.json();
        if (!res.ok) throw new Error(cfg?.message || 'Failed to load');
        setSettings({
          platformName: cfg.general?.platformName ?? 'POWERFLOW',
          supportEmail: cfg.general?.supportEmail ?? '',
          maintenanceMessage: cfg.general?.maintenanceMessage ?? '',
          maintenanceMode: Boolean(cfg.general?.maintenanceMode),
          sessionTimeout: String(cfg.security?.sessionTimeout ?? 30),
          maxLoginAttempts: String(cfg.security?.maxLoginAttempts ?? 5),
        });
      } catch {}
    };
    load();
  }, []);

  const save = async () => {
    const token = localStorage.getItem('powerflow.token') || '';
    const payload = {
      general: {
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceMode: settings.maintenanceMode,
      },
      security: {
        sessionTimeout: Number(settings.sessionTimeout) || 0,
        maxLoginAttempts: Number(settings.maxLoginAttempts) || 0,
      },
    };
    try {
      await fetch(`${BACKEND}/api/admin/system-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    } catch {}
  };

  const maintenance = async (action: string) => {
    const token = localStorage.getItem('powerflow.token') || '';
    try {
      await fetch(`${BACKEND}/api/admin/system-config/maintenance/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  const SettingsSection = ({
    title,
    description,
    children,
  }: {
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm mb-6">{description}</p>
      {children}
    </div>
  );

  const SettingField = ({
    label,
    value,
    onChange,
    type = "text",
    description,
  }: {
    label: string;
    value: string | boolean;
    onChange: (value: any) => void;
    type?: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {type === "toggle" ? (
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            value ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              value ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/5 border-border"
        />
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            System Settings
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure general settings, notifications, security, and
            integrations
          </p>
        </div>
        <Button onClick={save} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 w-fit">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <SettingsSection
        title="General Settings"
        description="Configure platform name, support contact, and general information"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingField
            label="Platform Name"
            value={settings.platformName}
            onChange={(v) => handleSettingChange("platformName", v)}
            description="Display name of the platform"
          />
          <SettingField
            label="Support Email"
            value={settings.supportEmail}
            onChange={(v) => handleSettingChange("supportEmail", v)}
            type="email"
            description="Email for user support inquiries"
          />
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-foreground">
              Maintenance Message
            </label>
            <textarea
              value={settings.maintenanceMessage}
              onChange={(e) =>
                handleSettingChange("maintenanceMessage", e.target.value)
              }
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-border text-foreground placeholder-muted-foreground resize-none"
              rows={3}
              placeholder="Message displayed during maintenance"
            />
            <p className="text-xs text-muted-foreground">
              Shown to users when maintenance mode is enabled
            </p>
          </div>
          <SettingField
            label="Maintenance Mode"
            value={settings.maintenanceMode}
            onChange={(v) => handleSettingChange("maintenanceMode", v)}
            type="toggle"
            description="Enable to temporarily disable user access"
          />
        </div>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection
        title="Notification Settings"
        description="Configure how users receive notifications"
      >
        <div className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              Email Notifications
            </h4>
            <div className="space-y-3 ml-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  Transaction Confirmations
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  Low Balance Alerts
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Security Alerts</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              SMS Notifications
            </h4>
            <div className="space-y-3 ml-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  Large Transaction Alerts
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Daily Summary</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">Account Changes</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              Push Notifications
            </h4>
            <div className="space-y-3 ml-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  Transaction Alerts
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-foreground">
                  Promotional Updates
                </span>
              </label>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Security Settings */}
      <SettingsSection
        title="Security Settings"
        description="Configure authentication and security parameters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingField
            label="Session Timeout (minutes)"
            value={settings.sessionTimeout}
            onChange={(v) => handleSettingChange("sessionTimeout", v)}
            type="number"
            description="Inactivity time before automatic logout"
          />
          <SettingField
            label="Max Login Attempts"
            value={settings.maxLoginAttempts}
            onChange={(v) => handleSettingChange("maxLoginAttempts", v)}
            type="number"
            description="Failed attempts before account lockout"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Account Lockout Duration (minutes)
            </label>
            <Input
              type="number"
              defaultValue="30"
              className="bg-white/5 border-border"
            />
            <p className="text-xs text-muted-foreground">
              Duration account remains locked after max attempts
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Password Expiry (days)
            </label>
            <Input
              type="number"
              defaultValue="90"
              className="bg-white/5 border-border"
            />
            <p className="text-xs text-muted-foreground">
              Force password change interval
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer col-span-2">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-foreground">
              Require Two-Factor Authentication
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer col-span-2">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm text-foreground">
              Enable IP Whitelisting
            </span>
          </label>
        </div>
      </SettingsSection>

      {/* Integration Settings */}
      <SettingsSection
        title="Integration Settings"
        description="Manage API keys and third-party integrations"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold text-foreground">API Keys</h4>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Generate New Key
            </Button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 rounded-lg bg-white/5 border border-border hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="text-sm font-medium text-foreground">
                      {key.name}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last used: {key.lastUsed}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      key.status === "Active"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-gray-500/20 text-gray-300"
                    }`}
                  >
                    {key.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="flex-1 px-3 py-2 rounded bg-black/30 text-xs text-muted-foreground font-mono overflow-hidden overflow-ellipsis">
                    {key.key}
                  </code>
                  <button className="p-2 hover:bg-white/10 rounded transition-colors">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* System Maintenance */}
      <SettingsSection
        title="System Maintenance"
        description="Perform system maintenance and cleanup tasks"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={()=>maintenance('clear-cache')} className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </Button>
          <Button onClick={()=>maintenance('optimize-db')} className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Optimize Database
          </Button>
          <Button onClick={()=>maintenance('generate-backup')} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Generate Backups
          </Button>
          <Button onClick={()=>maintenance('system-health')} className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            System Health Check
          </Button>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={save} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
