import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import ResumeDropzone from '../../components/student/ResumeDropzone';
import SkillGapRadar from '../../components/student/SkillGapRadar';
import MockInterviewChat from '../../components/student/MockInterviewChat';
import ReadinessCard from '../../components/student/ReadinessCard';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resume');

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={user?.role} />

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'resume' && <ResumeDropzone />}

          {activeTab === 'gap' && <SkillGapRadar />}

          {activeTab === 'interview' && <MockInterviewChat />}

          {activeTab === 'readiness' && <ReadinessCard />}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
