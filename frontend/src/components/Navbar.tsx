import React, { useState } from 'react';
import {
  Activity, ShieldCheck, Database, Search,
  GitMerge, Upload, Cpu, ChevronDown, Home
} from 'lucide-react';
import { Logo3D } from './3d/Logo3D';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterUserData } from '../services/firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean;
  indexedMaterials: number;
  onOpenDemoGuide: () => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
  masterUser?: MasterUserData | null;
  onRequireMasterAuth?: (onSuccessAction?: () => void, contextText?: string) => void;
  onSignOutMaster?: () => void;
}

const ROLES = [
  { id: 'officer', label: 'Procurement Officer' },
  { id: 'approver', label: 'Catalog Master' },
  { id: 'auditor', label: 'Auditor' },
];

const TAB_THEMES: Record<string, {
  color: string;
  badgeBg: string;
  border: string;
  glow: string;
  hoverBg: string;
}> = {
  home: {
    color: '#059669', // Emerald
    badgeBg: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.38)',
    glow: 'rgba(16, 185, 129, 0.22)',
    hoverBg: 'rgba(5, 150, 105, 0.06)',
  },
  checker: {
    color: '#0891B2', // Cyan
    badgeBg: 'rgba(8, 145, 178, 0.12)',
    border: 'rgba(8, 145, 178, 0.38)',
    glow: 'rgba(6, 182, 212, 0.22)',
    hoverBg: 'rgba(8, 145, 178, 0.06)',
  },
  bulk: {
    color: '#7C3AED', // Violet
    badgeBg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.38)',
    glow: 'rgba(139, 92, 246, 0.22)',
    hoverBg: 'rgba(124, 58, 237, 0.06)',
  },
  clusters: {
    color: '#D97706', // Amber
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.38)',
    glow: 'rgba(245, 158, 11, 0.22)',
    hoverBg: 'rgba(217, 119, 6, 0.06)',
  },
  review: {
    color: '#E11D48', // Rose
    badgeBg: 'rgba(225, 29, 72, 0.12)',
    border: 'rgba(225, 29, 72, 0.38)',
    glow: 'rgba(244, 63, 94, 0.22)',
    hoverBg: 'rgba(225, 29, 72, 0.06)',
  },
  analytics: {
    color: '#4F46E5', // Indigo
    badgeBg: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(79, 70, 229, 0.38)',
    glow: 'rgba(99, 102, 241, 0.22)',
    hoverBg: 'rgba(79, 70, 229, 0.06)',
  },
  unspsc: {
    color: '#0D9488', // Teal
    badgeBg: 'rgba(13, 148, 136, 0.12)',
    border: 'rgba(13, 148, 136, 0.38)',
    glow: 'rgba(20, 184, 166, 0.22)',
    hoverBg: 'rgba(13, 148, 136, 0.06)',
  },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  indexedMaterials,
  onOpenDemoGuide,
  activeRole,
  setActiveRole,
  masterUser,
  onRequireMasterAuth,
  onSignOutMaster,
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

  const visibleTabs = navItems.filter((t) => {
    if (t.id === 'review') {
      return activeRole === 'officer' || activeRole === 'approver';
    }
    return !t.roleOnly || t.roleOnly === activeRole;
  });

  const [roleOpen, setRoleOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const activeRoleObj = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <header
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* ── Top Radiant Accent Line ── */}
      <div 
        style={{
          height: '2.5px',
          width: '100%',
          background: 'linear-gradient(90deg, #059669 0%, #06B6D4 20%, #7C3AED 40%, #E11D48 60%, #D97706 80%, #059669 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 8s linear infinite',
        }} 
      />

      <div
        className="responsive-navbar-container"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '66px',
          gap: '8px',
        }}
      >
        {/* ── Brand with 3D Hologram Logo ── */}
        <div
          id="navbar-brand-logo"
          title="MaterialSync - Home"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer', 
            flexShrink: 0,
            padding: '3px 4px',
            borderRadius: '20px',
            transition: 'transform 0.2s ease',
          }}
          onClick={() => setActiveTab('home')}
        >
          <Logo3D />
          <span style={{ 
            fontSize: '19px', 
            fontWeight: 900, 
            letterSpacing: '-0.03em',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            <span style={{ color: '#0F172A' }}>Material</span>
            <span style={{ 
              background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 4px rgba(5, 150, 105, 0.25))'
            }}>
              Sync
            </span>
          </span>
        </div>

        {/* ── Nav Tabs with Smooth Sliding Spring Pill & Colorful Accents ── */}
        <nav 
          className="responsive-nav-tabs" 
          style={{ 
            display: 'flex', 
            gap: '2px', 
            flex: '0 1 auto', 
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {visibleTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredTab === item.id;
            const theme = TAB_THEMES[item.id] || TAB_THEMES.home;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  position: 'relative',
                  background: isHovered && !isActive ? theme.hoverBg : 'transparent',
                  color: isActive ? theme.color : (isHovered ? '#0F172A' : '#334155'),
                  border: 'none',
                  borderRadius: '18px',
                  padding: '6px 10px',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 900 : 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  zIndex: 1,
                  transition: 'color 0.2s ease, background 0.2s ease, transform 0.15s ease',
                  transform: isHovered && !isActive ? 'translateY(-1px)' : 'translateY(0)',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {/* Smooth Sliding Pill on Active Tab */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: theme.badgeBg,
                      border: `1.5px solid ${theme.border}`,
                      borderRadius: '18px',
                      boxShadow: `0 4px 14px ${theme.glow}`,
                      zIndex: -1,
                    }}
                  />
                )}

                <Icon 
                  size={14} 
                  color={isActive ? theme.color : (isHovered ? theme.color : '#64748B')}
                  style={{
                    transition: 'color 0.2s ease, transform 0.2s ease',
                    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
                <span>{item.label}</span>

                {/* Active Glowing Micro Indicator Dot */}
                {isActive && (
                  <span 
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: theme.color,
                      boxShadow: `0 0 6px ${theme.color}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right Controls (Role Switcher & Live Status) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

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
                border: '1.5px solid rgba(203, 213, 225, 0.9)',
                borderRadius: '18px',
                padding: '6px 11px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 800,
                color: '#0F172A',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(5, 150, 105, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Cpu size={11} color="#059669" />
              </div>
              <span>{activeRoleObj.label}</span>
              <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: roleOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            <AnimatePresence>
              {roleOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(203, 213, 225, 0.9)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    minWidth: '190px',
                    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
                    zIndex: 200,
                    padding: '5px',
                  }}
                >
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      id={`role-option-${r.id}`}
                      onClick={() => {
                        if (r.id === 'approver') {
                          if (!masterUser && onRequireMasterAuth) {
                            onRequireMasterAuth(() => setActiveRole('approver'), "Switching to Catalog Master Role");
                            setRoleOpen(false);
                            return;
                          }
                        }
                        setActiveRole(r.id);
                        setRoleOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        background: activeRole === r.id ? 'rgba(5, 150, 105, 0.1)' : 'transparent',
                        color: activeRole === r.id ? '#059669' : '#0F172A',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 800,
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
                          boxShadow: activeRole === r.id ? '0 0 8px #059669' : 'none',
                          flexShrink: 0,
                        }}
                      />
                      {r.label}
                    </button>
                  ))}

                  {/* Active Master Session Card & Sign Out */}
                  {masterUser && (
                    <div style={{
                      marginTop: '6px',
                      padding: '8px 10px',
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '10px',
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                        <ShieldCheck size={12} color="#16a34a" />
                        <span>{masterUser.displayName}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {masterUser.email}
                      </div>
                      <button
                        onClick={() => {
                          onSignOutMaster && onSignOutMaster();
                          setRoleOpen(false);
                        }}
                        style={{
                          width: '100%',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          padding: '5px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Sign Out Master
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Backend Status Live Beacon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: '#FFFFFF',
              padding: '6px 11px',
              borderRadius: '18px',
              border: '1.5px solid rgba(203, 213, 225, 0.9)',
              fontSize: '12px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isBackendOnline ? '#10B981' : '#EF4444',
                boxShadow: isBackendOnline ? '0 0 10px #10B981, 0 0 18px rgba(16, 185, 129, 0.4)' : '0 0 8px #EF4444',
                animation: isBackendOnline ? 'pulse-soft 2s ease-in-out infinite' : 'none',
              }}
            />
            <span style={{ color: isBackendOnline ? '#059669' : '#EF4444', fontWeight: 900 }}>
              {isBackendOnline ? 'Live' : 'Offline'}
            </span>
            <span style={{ color: 'rgba(203, 213, 225, 0.8)' }}>|</span>
            <span style={{ color: '#0F172A', fontWeight: 800 }}>
              {indexedMaterials.toLocaleString()} SKUs
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
