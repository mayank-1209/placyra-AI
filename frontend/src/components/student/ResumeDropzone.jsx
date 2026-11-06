import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Award } from 'lucide-react';
import { uploadResume, fetchMyResume, resetUploadStatus } from '../../store/slices/resumeSlice';

export const ResumeDropzone = ({ onResumeProcessed }) => {
  const dispatch = useDispatch();
  const { currentResume, uploadLoading, uploadSuccess, error } = useSelector((state) => state.resume);

  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    dispatch(fetchMyResume());
  }, [dispatch]);

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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setLocalError('Please select a PDF or image resume to upload.');
      return;
    }

    setLocalError(null);
    const formData = new FormData();
    formData.append('file', file);

    const result = await dispatch(uploadResume(formData));
    if (uploadResume.fulfilled.match(result)) {
      setFile(null);
    }
  };

  const displayError = localError || error;

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center mb-1">
          <UploadCloud className="w-5 h-5 mr-2 text-indigo-400" />
          Resume OCR & AI Skill Extraction Pipeline
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Upload your resume in PDF, PNG, or JPG format. PyMuPDF with Tesseract OCR extracts text, while our local parser identifies skills, projects, and CGPA. Managed with Redux Toolkit.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40 group">
            <FileText className="w-12 h-12 text-slate-500 group-hover:text-indigo-400 transition-colors mb-3" />
            <span className="text-sm font-medium text-slate-200">
              {file ? file.name : 'Click to select or drag and drop your resume (PDF/PNG)'}
            </span>
            <span className="text-xs text-slate-500 mt-1">Maximum file size: 15MB</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {displayError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {displayError}
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
              Resume parsed and OCR extracted successfully!
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadLoading || !file}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center transition-all"
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
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Active Resume Profile
              </span>
              <h3 className="text-lg font-bold text-white flex items-center mt-0.5">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                {currentResume.file_name}
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-center">
                <p className="text-xs text-indigo-300 font-medium">Readiness Score</p>
                <p className="text-xl font-extrabold text-indigo-400">
                  {currentResume.readiness_score} / 100
                </p>
              </div>
              {currentResume.parsed_data?.cgpa && (
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                  <p className="text-xs text-emerald-300 font-medium">Verified CGPA</p>
                  <p className="text-xl font-extrabold text-emerald-400">
                    {currentResume.parsed_data.cgpa}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Skills Tag Cloud */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center">
              <Award className="w-4 h-4 mr-2 text-indigo-400" />
              Extracted Technical Skills ({currentResume.parsed_data?.skills?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentResume.parsed_data?.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700/80 text-indigo-300 border border-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* OCR Raw Text Preview */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">
              Raw OCR Extraction Preview
            </h4>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {currentResume.raw_ocr_preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDropzone;
