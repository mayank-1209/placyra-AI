import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Award, Lock } from 'lucide-react';
import { uploadResume, fetchMyResume, resetUploadStatus } from '../../store/slices/resumeSlice';
import { useAuthGate } from '../../features/auth/useAuthGate';

export const ResumeDropzone = ({ onResumeProcessed }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const { currentResume, uploadLoading, uploadSuccess, error } = useSelector((state) => state.resume);

  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyResume());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (currentResume && onResumeProcessed) {
      onResumeProcessed(currentResume);
    }
  }, [currentResume, onResumeProcessed]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLocalError(null);
      dispatch(resetUploadStatus());
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) {
      setLocalError('Please select a PDF or image resume to upload.');
      return;
    }

    requireAuth(async () => {
      setLocalError(null);
      const formData = new FormData();
      formData.append('file', file);

      const result = await dispatch(uploadResume(formData));
      if (uploadResume.fulfilled.match(result)) {
        setFile(null);
      }
    }, { action: 'resume_upload' });
  };

  const displayError = localError || error;

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-text flex items-center mb-1">
          <UploadCloud className="w-5 h-5 mr-2 text-accent" />
          Resume OCR & AI Skill Extraction Pipeline
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Upload your resume in PDF, PNG, or JPG format. PyMuPDF with Tesseract OCR extracts text, while our local parser identifies skills, projects, and CGPA.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <label className="border-2 border-dashed border-border-muted hover:border-accent rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-2 group">
            <FileText className="w-12 h-12 text-text-muted group-hover:text-accent transition-colors mb-3" />
            <span className="text-sm font-medium text-text">
              {file ? file.name : 'Click to select or drag and drop your resume (PDF/PNG)'}
            </span>
            <span className="text-xs text-text-muted mt-1">Maximum file size: 15MB</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {displayError && (
            <div className="p-3 bg-danger-subtle border border-danger/20 text-danger rounded-xl text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {displayError}
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-success-subtle border border-success/20 text-success rounded-xl text-sm flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
              Resume parsed and OCR extracted successfully!
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {!isAuthenticated && (
              <span className="text-xs text-text-muted flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1 text-accent" />
                Guest Mode: Uploading will prompt you to create a free account to save your score.
              </span>
            )}
            <button
              type="submit"
              disabled={uploadLoading || !file}
              className="w-full sm:w-auto ml-auto px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-contrast text-sm font-semibold rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center transition-all"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running OCR Extraction...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upload & Parse Resume
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Extracted Profile Details View */}
      {currentResume && (
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Active Resume Profile
              </span>
              <h3 className="text-lg font-bold text-text flex items-center mt-0.5">
                <FileText className="w-4 h-4 mr-2 text-text-muted" />
                {currentResume.file_name}
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-accent-subtle border border-accent/20 rounded-xl text-center">
                <p className="text-xs text-accent font-medium">Readiness Score</p>
                <p className="text-xl font-extrabold text-accent">
                  {currentResume.readiness_score} / 100
                </p>
              </div>
              {currentResume.parsed_data?.cgpa && (
                <div className="px-4 py-2 bg-success-subtle border border-success/20 rounded-xl text-center">
                  <p className="text-xs text-success font-medium">Verified CGPA</p>
                  <p className="text-xl font-extrabold text-success">
                    {currentResume.parsed_data.cgpa}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Skills Tag Cloud */}
          <div>
            <h4 className="text-sm font-semibold text-text mb-3 flex items-center">
              <Award className="w-4 h-4 mr-2 text-accent" />
              Extracted Technical Skills ({currentResume.parsed_data?.skills?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentResume.parsed_data?.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-surface-2 text-accent border border-border text-xs font-medium rounded-lg"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* OCR Raw Text Preview */}
          <div>
            <h4 className="text-sm font-semibold text-text mb-2">
              Raw OCR Extraction Preview
            </h4>
            <div className="p-4 bg-surface-2 border border-border rounded-xl text-xs font-mono text-text-muted max-h-48 overflow-y-auto whitespace-pre-wrap">
              {currentResume.raw_ocr_preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDropzone;
