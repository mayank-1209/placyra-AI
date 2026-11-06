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
  const isStudent = role === 'student';

  const studentTabs = [
    { id: 'resume', label: 'Resume & OCR', icon: <FileText className="w-5 h-5 mr-3" /> },
    { id: 'gap', label: 'Company Skill Gap', icon: <Target className="w-5 h-5 mr-3" /> },
    { id: 'interview', label: 'AI Mock Interview', icon: <MessageSquare className="w-5 h-5 mr-3" /> },
    { id: 'readiness', label: 'Readiness Analytics', icon: <BarChart3 className="w-5 h-5 mr-3" /> },
  ];

  const tnpTabs = [
    { id: 'companies', label: 'Companies & JDs', icon: <Building2 className="w-5 h-5 mr-3" /> },
    { id: 'add-question', label: 'Upload Question', icon: <PlusCircle className="w-5 h-5 mr-3" /> },
    { id: 'bulk-upload', label: 'Bulk CSV / Dedup', icon: <UploadCloud className="w-5 h-5 mr-3" /> },
    { id: 'moderation', label: 'Moderation Queue', icon: <CheckSquare className="w-5 h-5 mr-3" /> },
    { id: 'batch-analytics', label: 'Batch Analytics', icon: <TrendingUp className="w-5 h-5 mr-3" /> },
  ];

  const alumniTabs = [
    { id: 'add-question', label: 'Submit Question', icon: <PlusCircle className="w-5 h-5 mr-3" /> },
    { id: 'bulk-upload', label: 'Bulk Question Upload', icon: <UploadCloud className="w-5 h-5 mr-3" /> },
    { id: 'companies', label: 'Browse Companies', icon: <Building2 className="w-5 h-5 mr-3" /> },
  ];

  let tabs = studentTabs;
  if (role === 'tnp_admin') {
    tabs = tnpTabs;
  } else if (role === 'alumni') {
    tabs = alumniTabs;
  }

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 shrink-0 hidden md:block">
      <div className="space-y-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
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
