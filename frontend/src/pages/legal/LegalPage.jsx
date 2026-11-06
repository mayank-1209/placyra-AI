import React from 'react';
import Navbar from '../../components/common/Navbar';
import { Shield, FileText, HelpCircle, Mail, BookOpen } from 'lucide-react';

export const LegalPage = ({ type = 'privacy' }) => {
  const contentMap = {
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      updated: 'November 2026',
      summary: 'How Placyra collects, processes, and protects your career and resume data with 100% privacy-first local processing.',
      body: `
        <h3>1. Data We Collect</h3>
        <p>Placyra collects institutional email addresses, academic branch/CGPA information, and resume files uploaded voluntarily for career preparation. All resume text extraction and embedding generation occurs through local isolated algorithms.</p>
        
        <h3>2. Local AI & Privacy Guarantee</h3>
        <p>Unlike third-party cloud services, Placyra uses local Ollama model instances and self-hosted vector databases. Your technical answers, mock interview transcripts, and resume content are never sold or used for public AI training.</p>
        
        <h3>3. Cookies and Advertising</h3>
        <p>We use standard functional cookies to preserve your theme preference and authentication session. When Google AdSense is enabled, third-party cookies may be served with user consent in accordance with regional privacy laws.</p>
      `,
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      updated: 'November 2026',
      summary: 'Terms governing candidate access, question contribution, and campus placement preparation tools.',
      body: `
        <h3>1. Permitted Use</h3>
        <p>Placyra is designed for university engineering students, alumni mentors, and Training & Placement (T&P) officers preparing for campus recruitments.</p>
        
        <h3>2. Accuracy of Placement Questions</h3>
        <p>Interview questions submitted by alumni are moderated by college placement administrators. However, corporate hiring roadmaps vary across hiring cycles.</p>
        
        <h3>3. Acceptable Conduct</h3>
        <p>Users must not upload disguised executables, malicious scripts, or copyrighted corporate assessment materials violating confidentiality agreements.</p>
      `,
    },
    'cookie-policy': {
      title: 'Cookie Policy',
      icon: HelpCircle,
      updated: 'November 2026',
      summary: 'Details regarding functional tokens, theme preferences, and advertising consent.',
      body: `
        <h3>1. What Are Cookies</h3>
        <p>Cookies and browser storage items (such as localStorage) allow Placyra to remember your active session and visual theme choices.</p>
        
        <h3>2. Essential Storage</h3>
        <p><strong>placyra_token</strong>: Stores JWT credentials required for authenticated actions.<br/>
        <strong>placyra-theme</strong>: Remembers your Light, Dark, or System visual theme preference.</p>
        
        <h3>3. AdSense Consent Management</h3>
        <p>Non-essential cookies for advertising are loaded strictly after candidate consent via our consent banner.</p>
      `,
    },
    about: {
      title: 'About Placyra',
      icon: BookOpen,
      updated: 'November 2026',
      summary: 'The autonomous AI career preparation platform built for campus placement drives.',
      body: `
        <h3>Our Mission</h3>
        <p>Placyra was built to democratize technical placement preparation. By providing automated PyMuPDF ATS scoring, multi-axis company skill gap analysis, and real-time AI mock interviews, every student can enter recruitment rounds with confidence.</p>
        
        <h3>Key Architecture</h3>
        <p>Built with FastAPI, React 18 with Vite, MySQL 8.0, Qdrant vector search, and Ollama local LLM execution.</p>
      `,
    },
    contact: {
      title: 'Contact & Support',
      icon: Mail,
      updated: 'November 2026',
      summary: 'Reach out to the Placyra development and campus integration team.',
      body: `
        <h3>Institutional Inquiries</h3>
        <p>For university placement cell integrations, email our team at <strong>support@placyra.local</strong>.</p>
        
        <h3>Technical Support & Feedback</h3>
        <p>Encountered a bug or have questions regarding your ATS score? Contact our administrators through the student dashboard.</p>
      `,
    },
  };

  const item = contentMap[type] || contentMap.privacy;
  const Icon = item.icon;

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="p-8 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-6 border-b border-border">
            <div className="p-3 bg-accent-subtle text-accent rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">{item.title}</h1>
              <p className="text-xs text-text-muted mt-0.5">Last updated: {item.updated}</p>
            </div>
          </div>

          <p className="text-sm text-text-muted leading-relaxed font-medium bg-surface-2 p-4 rounded-xl border border-border">
            {item.summary}
          </p>

          <div
            className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm text-text leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
