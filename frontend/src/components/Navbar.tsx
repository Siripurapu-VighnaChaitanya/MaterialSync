import React from 'react';
import { Layers, Activity, ShieldCheck, Database, Search, GitMerge, FileText, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean;
  indexedMaterials: number;
  onOpenDemoGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  indexedMaterials,
  onOpenDemoGuide,
}) => {
  const navItems = [
    { id: 'checker', label: 'Live Duplicate Check', icon: Search, badge: 'PRIMARY DEMO' },
    { id: 'clusters', label: 'Cluster Explorer', icon: GitMerge },
    { id: 'review', label: 'Officer Review Queue', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics & KPIs', icon: Activity },
    { id: 'unspsc', label: 'UNSPSC Taxonomy', icon: Database },
  ];

  return (
    <header style={{
      background: 'rgba(11, 15, 25, 0.92)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)'
    }}>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('checker')}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.4)'
          }}>
            <Layers size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>MatCode</span>
              <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>SIH26099</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>National CPSE Material Harmonization Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#60A5FA' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '9px',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#FBBF24',
                    fontWeight: 700,
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System State Badge & Demo Guide Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onOpenDemoGuide}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-bright)',
              color: '#F3F4F6',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FileText size={14} color="#F59E0B" />
            <span>Judge Demo Flow</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#111827',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isBackendOnline ? '#10B981' : '#EF4444',
              boxShadow: isBackendOnline ? '0 0 8px #10B981' : '0 0 8px #EF4444'
            }} />
            <span style={{ color: isBackendOnline ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {isBackendOnline ? 'API Online' : 'Connecting...'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>{indexedMaterials} Records</span>
          </div>
        </div>
      </div>
    </header>
  );
};
