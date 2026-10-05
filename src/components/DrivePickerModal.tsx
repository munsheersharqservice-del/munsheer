import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DriveFileItem } from '../types';
import { listGoogleDriveFiles } from '../services/googleSheets';

interface DrivePickerModalProps {
  isOpen: boolean;
  accessToken: string | null;
  onClose: () => void;
  onSelectFile: (file: DriveFileItem) => void;
}

export const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  accessToken,
  onClose,
  onSelectFile,
}) => {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const fetchFiles = async (query?: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const items = await listGoogleDriveFiles(accessToken, query);
      setFiles(items);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
      setError(err.message || 'Failed to list spreadsheets from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchFiles(searchQuery);
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(searchQuery);
  };

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const handleConfirm = () => {
    if (selectedFile) {
      onSelectFile(selectedFile);
      onClose();
    }
  };

  return (
    <div
      id="drive-picker-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="drive-picker-container"
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Select from Google Drive
              </h2>
              <p className="text-xs text-slate-400">
                Pick a Google Sheet or Excel (.xlsx) file to connect as your interactive database
              </p>
            </div>
          </div>
          <button
            id="close-drive-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Refresh Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="drive-search-input"
              type="text"
              placeholder="Search spreadsheets or .xlsx in Google Drive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </form>
          <button
            id="drive-refresh-btn"
            onClick={() => fetchFiles(searchQuery)}
            disabled={loading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[280px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mb-2" />
              <p className="text-sm">Accessing Google Drive files...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg flex items-start gap-3 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-medium">Failed to load files from Drive</p>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && files.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No spreadsheets found in Drive</p>
              <p className="text-xs text-slate-500 mt-1">
                Make sure you have uploaded .xlsx files or created Google Sheets in your Google account.
              </p>
            </div>
          )}

          {!loading &&
            files.map((file) => {
              const isSelected = selectedFileId === file.id;
              const isGoogleSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';
              const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

              return (
                <div
                  key={file.id}
                  id={`drive-file-${file.id}`}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 text-white'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isGoogleSheet
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isExcel
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isGoogleSheet ? (
                        <FileSpreadsheet className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span className="capitalize">
                          {isGoogleSheet ? 'Google Sheets' : isExcel ? 'Excel Spreadsheet' : 'CSV File'}
                        </span>
                        {file.modifiedTime && (
                          <>
                            <span>&bull;</span>
                            <span>
                              Modified {new Date(file.modifiedTime).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"
                        title="View original in Google Drive"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Select a spreadsheet to proceed'}
          </span>
          <div className="flex gap-2">
            <button
              id="cancel-drive-select-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-drive-select-btn"
              onClick={handleConfirm}
              disabled={!selectedFile}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Connect Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
