import React from 'react';
import {
  Activity, ShieldCheck, Database, Search,
  GitMerge, FileText, Upload, Cpu, ChevronDown, Home
} from 'lucide-react';
import { Logo3D } from './3d/Logo3D';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean;
  indexedMaterials: number;
  onOpenDemoGuide: () => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
}

const ROLES = [
  { id: 'officer', label: 'Procurement Officer' },
  { id: 'approver', label: 'Catalog Master' },
  { id: 'auditor', label: 'Auditor' },
];

const ROLE_COLORS: Record<string, string> = {
  officer: '#22C55E',
  approver: '#FACC15',
  auditor: '#A3E635',
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  indexedMaterials,
  onOpenDemoGuide,
  activeRole,
  setActiveRole,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'checker', label: 'Command Center', icon: Search },
    { id: 'bulk', label: 'Bulk Ingest', icon: Upload },
    { id: 'clusters', label: 'Cluster Network', icon: GitMerge },
    { id: 'review', label: 'Review Queue', icon: ShieldCheck, roleOnly: 'officer' },
    { id: 'analytics', label: 'Executive ROI', icon: Activity },
    { id: 'unspsc', label: 'UNSPSC Taxonomy', icon: Database },
  ];

  const visibleTabs = navItems.filter(
    (t) => !t.roleOnly || t.roleOnly === activeRole
  );

  const [roleOpen, setRoleOpen] = React.useState(false);
  const activeRoleObj = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <header
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div
        className="responsive-navbar-container"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
          gap: '16px',
        }}
      >
        {/* ── Brand ── */}
        <div
          id="navbar-brand-logo"
          title="MaterialSync - Home"
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setActiveTab('home')}
        >
          <Logo3D />
          <span style={{ 
            fontSize: '20px', 
            fontWeight: 900, 
            letterSpacing: '-0.03em', 
            background: 'linear-gradient(90deg, #D97706, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            MaterialSync
          </span>
        </div>

        {/* ── Nav Tabs ── */}
        <nav className="responsive-nav-tabs" style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'center' }}>
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: isActive ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
                  color: isActive ? '#059669' : '#64748B',
                  border: isActive ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid transparent',
                  borderRadius: '20px',
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  transition: 'all 0.18s ease',
                }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Right Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

          {/* Role Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              id="role-switcher-btn"
              onClick={() => setRoleOpen(!roleOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '20px',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0F172A',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              <Cpu size={13} color="#059669" />
              <span>{activeRoleObj.label}</span>
              <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: roleOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {roleOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: '#FFFFFF',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  minWidth: '180px',
                  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
                  zIndex: 200,
                }}
              >
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    id={`role-option-${r.id}`}
                    onClick={() => { setActiveRole(r.id); setRoleOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '11px 16px',
                      background: activeRole === r.id ? 'rgba(5, 150, 105, 0.1)' : 'transparent',
                      color: activeRole === r.id ? '#059669' : '#334155',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: activeRole === r.id ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#059669',
                        flexShrink: 0,
                      }}
                    />
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Backend Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: '#FFFFFF',
              padding: '7px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              fontSize: '12px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isBackendOnline ? '#10B981' : '#EF4444',
                boxShadow: isBackendOnline ? '0 0 8px #10B981' : '0 0 8px #EF4444',
                animation: isBackendOnline ? 'glow-pulse 2.5s infinite' : 'none',
              }}
            />
            <span style={{ color: isBackendOnline ? '#059669' : '#EF4444', fontWeight: 700 }}>
              {isBackendOnline ? 'Live' : 'Offline'}
            </span>
            <span style={{ color: 'rgba(203, 213, 225, 0.8)' }}>|</span>
            <span style={{ color: '#475569', fontWeight: 600 }}>
              {indexedMaterials.toLocaleString()} SKUs
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
