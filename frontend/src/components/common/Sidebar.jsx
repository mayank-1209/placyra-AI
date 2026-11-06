import React from 'react';
import {
  FileText,
  Target,
  MessageSquare,
  BarChart3,
  Building2,
  PlusCircle,
  UploadCloud,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, role }) => {
  const isStudent = role === 'student' || !role;

  const studentTabs = [
    { id: 'resume', label: 'Resume & OCR', icon: <FileText className="w-4 h-4 mr-3" /> },
    { id: 'gap', label: 'Company Skill Gap', icon: <Target className="w-4 h-4 mr-3" /> },
    { id: 'interview', label: 'AI Mock Interview', icon: <MessageSquare className="w-4 h-4 mr-3" /> },
    { id: 'readiness', label: 'Readiness Analytics', icon: <BarChart3 className="w-4 h-4 mr-3" /> },
  ];

  const tnpTabs = [
    { id: 'companies', label: 'Companies & JDs', icon: <Building2 className="w-4 h-4 mr-3" /> },
    { id: 'add-question', label: 'Upload Question', icon: <PlusCircle className="w-4 h-4 mr-3" /> },
    { id: 'bulk-upload', label: 'Bulk CSV / Dedup', icon: <UploadCloud className="w-4 h-4 mr-3" /> },
    { id: 'moderation', label: 'Moderation Queue', icon: <CheckSquare className="w-4 h-4 mr-3" /> },
    { id: 'batch-analytics', label: 'Batch Analytics', icon: <TrendingUp className="w-4 h-4 mr-3" /> },
  ];

  const alumniTabs = [
    { id: 'add-question', label: 'Submit Question', icon: <PlusCircle className="w-4 h-4 mr-3" /> },
    { id: 'bulk-upload', label: 'Bulk Question Upload', icon: <UploadCloud className="w-4 h-4 mr-3" /> },
    { id: 'companies', label: 'Browse Companies', icon: <Building2 className="w-4 h-4 mr-3" /> },
  ];

  let tabs = studentTabs;
  if (role === 'tnp_admin' || role === 'admin' || role === 'super_admin') {
    tabs = tnpTabs;
  } else if (role === 'alumni') {
    tabs = alumniTabs;
  }

  return (
    <aside className="w-64 bg-surface/50 border-r border-border p-4 shrink-0 hidden md:block">
      <div className="space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                isActive
                  ? 'bg-accent text-accent-contrast shadow-sm'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
