import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, Download, Layers } from 'lucide-react';
import { bulkUploadQuestions } from '../../store/slices/tnpSlice';

export const BulkCsvUploader = ({ onUploadSuccess }) => {
  const dispatch = useDispatch();
  const { bulkUploadResult, bulkLoading, error: tnpError } = useSelector((state) => state.tnp);

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV or JSON file to upload.');
      return;
    }

    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await dispatch(bulkUploadQuestions(formData));
    if (bulkUploadQuestions.fulfilled.match(result)) {
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } else {
      setError(result.payload || 'Failed to upload and process question batch.');
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'company_name,role_title,round_type,difficulty,topic,question_text,answer_guidelines\n' +
      'Google,Software Engineer,Technical Round 1,Hard,Data Structures,"Given an array, find the maximum subarray product in O(n) time.",Keep track of min and max products at each step.\n' +
      'Amazon,SDE-1,Technical Round 2,Medium,System Design,"Design a rate limiter for an API with sliding window log algorithm.",Discuss Redis sorted sets, memory overhead, and distributed clocks.\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'placyra_question_batch_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center">
              <UploadCloud className="w-5 h-5 mr-2 text-accent" />
              Bulk Question Uploader & Cosine Deduplicator
            </h2>
            <p className="text-sm text-text-muted">
              Upload hundreds of placement questions at once via CSV or JSON. Questions are automatically normalized, checked for similarity, and deduplicated.
            </p>
          </div>
          <button
            onClick={downloadSampleCsv}
            type="button"
            className="flex items-center px-3.5 py-1.5 bg-surface-2 hover:bg-surface-hover text-xs font-semibold text-accent rounded-xl border border-border transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Sample CSV
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <label className="border-2 border-dashed border-border-muted hover:border-accent rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-2 group">
            <FileText className="w-12 h-12 text-text-muted group-hover:text-accent transition-colors mb-3" />
            <span className="text-sm font-medium text-text">
              {file ? file.name : 'Select or drag & drop CSV / JSON file'}
            </span>
            <span className="text-xs text-text-muted mt-1">Columns: question_text, company_name, role_title, round_type, difficulty, topic</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3 bg-danger-subtle border border-danger/20 text-danger rounded-xl text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={bulkLoading || !file}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-contrast text-sm font-semibold rounded-xl shadow-lg shadow-accent/20 flex items-center transition-all"
            >
              {bulkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Cosine Deduplication...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upload & Deduplicate Questions
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Deduplication Statistics View */}
      {bulkUploadResult && (
        <div className="p-6 bg-surface border border-border rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h3 className="text-lg font-bold text-text flex items-center">
              <Layers className="w-5 h-5 mr-2 text-accent" />
              Bulk Upload Deduplication Report
            </h3>
            <span className="text-xs font-semibold text-success flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Batch Processed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-2 border border-border rounded-xl text-center">
              <p className="text-xs text-text-muted uppercase font-semibold">Total Rows Processed</p>
              <p className="text-2xl font-black text-text mt-1">{bulkUploadResult.total_processed}</p>
            </div>
            <div className="p-4 bg-success-subtle border border-success/20 rounded-xl text-center">
              <p className="text-xs text-success uppercase font-semibold">New Questions Added</p>
              <p className="text-2xl font-black text-success mt-1">{bulkUploadResult.added_questions}</p>
            </div>
            <div className="p-4 bg-warning-subtle border border-warning/20 rounded-xl text-center">
              <p className="text-xs text-warning uppercase font-semibold">Duplicates Skipped</p>
              <p className="text-2xl font-black text-warning mt-1">{bulkUploadResult.duplicates_skipped}</p>
            </div>
          </div>

          {/* Duplicate Match Details */}
          {bulkUploadResult.duplicate_details?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-warning mb-2">
                Deduplication Audit Trail (Cosine Similarity &gt; 82%)
              </h4>
              <div className="p-4 bg-surface-2 border border-border rounded-xl text-xs space-y-2 max-h-48 overflow-y-auto">
                {bulkUploadResult.duplicate_details.map((detail, idx) => (
                  <p key={idx} className="text-text-muted flex items-start">
                    <span className="text-warning mr-2 font-bold">•</span>
                    {detail}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkCsvUploader;
