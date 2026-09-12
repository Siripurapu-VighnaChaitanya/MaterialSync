import React from 'react';
import {
  Activity, ShieldCheck, Database, Search,
  GitMerge, FileText, Upload, Cpu, ChevronDown
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
  officer: '#4F8EF7',
  approver: '#00D68F',
  auditor: '#F7B731',
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
        background: 'rgba(5, 8, 16, 0.88)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
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
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setActiveTab('checker')}
        >
          <Logo3D />
          <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: '#F0F4FF' }}>
            MaterialSync
          </span>
        </div>

        {/* ── Nav Tabs ── */}
        <nav className="responsive-nav-tabs" style={{ display: 'flex', gap: '2px', flex: 1, justifyContent: 'center' }}>
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: isActive ? 'rgba(79,142,247,0.12)' : 'transparent',
                  color: isActive ? '#7AAEFF' : 'var(--text-muted)',
                  border: isActive ? '1px solid rgba(79,142,247,0.25)' : '1px solid transparent',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
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
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${ROLE_COLORS[activeRole]}40`,
                borderRadius: '10px',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: ROLE_COLORS[activeRole],
                transition: 'all 0.2s ease',
              }}
            >
              <Cpu size={13} />
              <span>{activeRoleObj.label}</span>
              <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: roleOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            {roleOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: '#0C1120',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  minWidth: '180px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
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
                      background: activeRole === r.id ? `${ROLE_COLORS[r.id]}15` : 'transparent',
                      color: activeRole === r.id ? ROLE_COLORS[r.id] : 'var(--text-secondary)',
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
                        backgroundColor: ROLE_COLORS[r.id],
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
              background: 'rgba(255,255,255,0.04)',
              padding: '7px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.07)',
              fontSize: '12px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isBackendOnline ? '#00D68F' : '#FF4757',
                boxShadow: isBackendOnline ? '0 0 8px #00D68F' : '0 0 8px #FF4757',
                animation: isBackendOnline ? 'glow-pulse 2.5s infinite' : 'none',
              }}
            />
            <span style={{ color: isBackendOnline ? '#00D68F' : '#FF4757', fontWeight: 700 }}>
              {isBackendOnline ? 'Live' : 'Offline'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {indexedMaterials.toLocaleString()} SKUs
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
