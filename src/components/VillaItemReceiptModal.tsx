import React, { useState } from 'react';
import {
  X,
  Plus,
  Paperclip,
  HardDrive,
  CheckCircle2,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  Search,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { MonthKey, MONTH_KEYS, VillaExpenseItem, formatCurrency } from '../data/villaDatabase';
import { DocumentAttachment } from '../data/personalFinanceData';
import { DocumentAttachmentModal } from './DocumentAttachmentModal';

interface VillaItemReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: MonthKey;
  items: VillaExpenseItem[];
  onAddItem: (item: VillaExpenseItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateDriveUrl: (id: string, newDriveUrl: string) => void;
}

export const VillaItemReceiptModal: React.FC<VillaItemReceiptModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  items,
  onAddItem,
  onDeleteItem,
  onUpdateDriveUrl,
}) => {
  // Form fields
  const [itemName, setItemName] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [month, setMonth] = useState<MonthKey>(selectedMonth);
  const [category, setCategory] = useState<VillaExpenseItem['category']>('Maintenance');
  const [notes, setNotes] = useState('');

  // Attachment fields
  const [attachment, setAttachment] = useState<DocumentAttachment | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMonthFilter, setViewMonthFilter] = useState<MonthKey | 'ALL'>(selectedMonth);

  // Document Viewer Modal State
  const [previewAttachment, setPreviewAttachment] = useState<{
    attachment: DocumentAttachment;
    itemId?: string;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachment({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        driveUrl: driveUrlInput.trim() || undefined,
        uploadedAt: new Date().toLocaleDateString('en-GB'),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return;
    }

    const finalAttachment: DocumentAttachment | undefined =
      attachment || driveUrlInput.trim()
        ? {
            name: attachment?.name || `${itemName.trim()} Receipt`,
            size: attachment?.size,
            type: attachment?.type || 'application/pdf',
            dataUrl: attachment?.dataUrl,
            driveUrl: driveUrlInput.trim() || attachment?.driveUrl,
            uploadedAt: new Date().toLocaleDateString('en-GB'),
          }
        : undefined;

    const newItem: VillaExpenseItem = {
      id: `villa-item-${Date.now()}`,
      month,
      date: new Date().toISOString().split('T')[0],
      itemName: itemName.trim(),
      reason: reason.trim() || 'General upkeep & villa operation',
      amount: numAmount,
      category,
      notes: notes.trim() || undefined,
      attachment: finalAttachment,
    };

    onAddItem(newItem);

    // Reset Form
    setItemName('');
    setReason('');
    setAmount('');
    setNotes('');
    setAttachment(null);
    setDriveUrlInput('');
  };

  const filteredItems = items.filter((item) => {
    if (viewMonthFilter !== 'ALL' && item.month !== viewMonthFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.itemName.toLowerCase().includes(q);
      const matchReason = item.reason.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchName || matchReason || matchCat;
    }
    return true;
  });

  const totalFilteredAmount = filteredItems.reduce((acc, i) => acc + i.amount, 0);

  return (
    <>
      <div
        id="villa-items-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150"
      >
        <div
          id="villa-items-modal-container"
          className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Paperclip className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Villa Items, Expenses & Receipts</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                    Save in Google Drive
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Track villa items, reason for expense, file attachments, and cloud Google Drive receipts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Top Form: Add New Item with Reason & Attachment */}
            <form
              onSubmit={handleSave}
              className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Add New Villa Item & Receipt</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  All fields saved with persistent storage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Item Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Item Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AC Repair Compressor Room 3, Plumbing Valves, Landlord Rent"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* 2. Amount in QAR */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Amount (QAR) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500 font-mono">
                      QAR
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-3 py-2 text-xs text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. Month */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Applicable Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value as MonthKey)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {MONTH_KEYS.map((m) => (
                      <option key={m} value={m}>
                        {m} 2026
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason for Item */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Reason / Purpose <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urgent motor burnt out reported by tenant, annual landlord rent cheque voucher"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Maintenance">Maintenance & Repairs</option>
                    <option value="AC Service">AC Service & Compressors</option>
                    <option value="Plumbing">Plumbing & Water Tanks</option>
                    <option value="Electrical">Electrical & Lighting</option>
                    <option value="Landlord Rent">Landlord Rent Settlement</option>
                    <option value="Utility">Kahramaa Utilities</option>
                    <option value="Other">Other Villa Expense</option>
                  </select>
                </div>
              </div>

              {/* Document Attachment & Google Drive Box */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Attach Document / Receipt (Save in Google Drive)
                    </span>
                  </div>
                  {attachment && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>File ready: {attachment.name}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Button */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Option A: Upload Receipt File (Image / PDF)
                    </label>
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer transition-colors">
                      <Upload className="h-4 w-4 text-sky-400" />
                      <span className="truncate">
                        {attachment ? attachment.name : 'Select receipt or photo...'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Google Drive Link Option */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                      <HardDrive className="h-3 w-3 text-emerald-400" />
                      <span>Option B: Google Drive Share Link</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/file/d/..."
                      value={driveUrlInput}
                      onChange={(e) => setDriveUrlInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Villa Item & Receipt</span>
                </button>
              </div>
            </form>

            {/* List of Saved Villa Items */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">
                    Logged Villa Items ({filteredItems.length})
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Total: QAR {formatCurrency(totalFilteredAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Month Filter */}
                  <select
                    value={viewMonthFilter}
                    onChange={(e) => setViewMonthFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Months</option>
                    {MONTH_KEYS.map((m) => (
                      <option key={m} value={m}>
                        {m} 2026
                      </option>
                    ))}
                  </select>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search items, reasons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 w-44"
                    />
                  </div>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                  <FileText className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">
                    No items logged for this filter.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Add maintenance parts, landlord cheques, or repairs above with document attachments.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredItems.map((item) => {
                    const hasAttachment = Boolean(item.attachment?.dataUrl || item.attachment?.driveUrl);
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                                  {item.month} 2026
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  {item.category}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1.5">
                                {item.itemName}
                              </h4>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-base font-black text-emerald-400 font-mono">
                                QAR {formatCurrency(item.amount)}
                              </div>
                              <span className="text-[10px] text-slate-500">{item.date}</span>
                            </div>
                          </div>

                          {/* Reason */}
                          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-850 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Reason / Purpose:
                            </span>
                            <p className="text-slate-200">{item.reason}</p>
                          </div>
                        </div>

                        {/* Footer: Attachment & Delete */}
                        <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                          {hasAttachment && item.attachment ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewAttachment({
                                  attachment: item.attachment!,
                                  itemId: item.id,
                                  title: `${item.itemName} Receipt`,
                                })
                              }
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[150px]">
                                {item.attachment.driveUrl ? 'Google Drive Receipt' : item.attachment.name}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              No attachment
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onDeleteItem(item.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Saved locally with Google Drive linking capabilities
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {previewAttachment && (
        <DocumentAttachmentModal
          isOpen={Boolean(previewAttachment)}
          onClose={() => setPreviewAttachment(null)}
          attachment={previewAttachment.attachment}
          title={previewAttachment.title}
          onSaveDriveUrl={(newUrl) => {
            if (previewAttachment.itemId) {
              onUpdateDriveUrl(previewAttachment.itemId, newUrl);
            }
          }}
        />
      )}
    </>
  );
};
