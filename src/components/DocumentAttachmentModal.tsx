import React, { useState } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Save,
  CheckCircle2,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { DocumentAttachment } from '../data/personalFinanceData';

interface DocumentAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment?: DocumentAttachment | null;
  title?: string;
  onSaveDriveUrl?: (newUrl: string) => void;
}

export const DocumentAttachmentModal: React.FC<DocumentAttachmentModalProps> = ({
  isOpen,
  onClose,
  attachment,
  title = 'Document & Receipt Viewer',
  onSaveDriveUrl,
}) => {
  const [driveUrlInput, setDriveUrlInput] = useState(attachment?.driveUrl || '');
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !attachment) return null;

  const isImage =
    attachment.type?.startsWith('image/') ||
    attachment.name?.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i) ||
    attachment.dataUrl?.startsWith('data:image/');

  const handleCopyLink = () => {
    const urlToCopy = driveUrlInput || attachment.driveUrl || '';
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveDriveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveDriveUrl) {
      onSaveDriveUrl(driveUrlInput);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id="document-attachment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        id="document-attachment-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {attachment.name} &bull; {formatFileSize(attachment.size)} &bull; {attachment.uploadedAt}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Document Preview Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden flex flex-col items-center justify-center min-h-[220px] max-h-[380px] p-2">
            {isImage && attachment.dataUrl ? (
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="max-h-[360px] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sky-400">
                  <FileText className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{attachment.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatFileSize(attachment.size)} &bull; Document File
                  </p>
                </div>
                {attachment.dataUrl && (
                  <a
                    href={attachment.dataUrl}
                    download={attachment.name}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Google Drive Integration Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Google Drive Backup & Link
                </h4>
              </div>
              {attachment.driveUrl ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Linked to Google Drive</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                  Not linked to Drive
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Paste your Google Drive shareable link or file URL here to maintain cloud sync for receipts and invoices.
            </p>

            <form onSubmit={handleSaveDriveLink} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrlInput}
                  onChange={(e) => setDriveUrlInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Drive Link</span>
                </button>
              </div>

              {saveSuccess && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Google Drive link saved successfully!</span>
                </p>
              )}
            </form>

            {attachment.driveUrl && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <a
                  href={attachment.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open in Google Drive</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{isCopied ? 'Link Copied!' : 'Copy Drive Link'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {attachment.uploadedAt ? `Attached on ${attachment.uploadedAt}` : 'Attached Document'}
          </div>
          <div className="flex items-center gap-2">
            {attachment.dataUrl && (
              <a
                href={attachment.dataUrl}
                download={attachment.name}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
