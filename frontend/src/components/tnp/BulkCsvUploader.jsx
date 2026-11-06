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
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <UploadCloud className="w-5 h-5 mr-2 text-indigo-400" />
              Bulk Question Uploader & Cosine Deduplicator
            </h2>
            <p className="text-sm text-slate-400">
              Upload hundreds of placement questions at once via CSV or JSON. Questions are automatically normalized, checked for similarity, and deduplicated.
            </p>
          </div>
          <button
            onClick={downloadSampleCsv}
            type="button"
            className="flex items-center px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 rounded-xl border border-slate-700 transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Sample CSV
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40 group">
            <FileText className="w-12 h-12 text-slate-500 group-hover:text-indigo-400 transition-colors mb-3" />
            <span className="text-sm font-medium text-slate-200">
              {file ? file.name : 'Select or drag & drop CSV / JSON file'}
            </span>
            <span className="text-xs text-slate-500 mt-1">Columns: question_text, company_name, role_title, round_type, difficulty, topic</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={bulkLoading || !file}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center transition-all"
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
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Layers className="w-5 h-5 mr-2 text-indigo-400" />
              Bulk Upload Deduplication Report
            </h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Batch Processed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
              <p className="text-xs text-slate-400 uppercase font-semibold">Total Rows Processed</p>
              <p className="text-2xl font-black text-white mt-1">{bulkUploadResult.total_processed}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <p className="text-xs text-emerald-300 uppercase font-semibold">New Questions Added</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{bulkUploadResult.added_questions}</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-xs text-amber-300 uppercase font-semibold">Duplicates Skipped</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{bulkUploadResult.duplicates_skipped}</p>
            </div>
          </div>

          {/* Duplicate Match Details */}
          {bulkUploadResult.duplicate_details?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                Deduplication Audit Trail (Cosine Similarity &gt; 82%)
              </h4>
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-2 max-h-48 overflow-y-auto">
                {bulkUploadResult.duplicate_details.map((detail, idx) => (
                  <p key={idx} className="text-slate-300 flex items-start">
                    <span className="text-amber-400 mr-2 font-bold">•</span>
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
