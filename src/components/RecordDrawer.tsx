import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { ColumnSchema } from '../types';
import { calculateProfitAndExpenses, formatCurrency } from '../data/villaDatabase';

interface RecordDrawerProps {
  isOpen: boolean;
  record: Record<string, any> | null;
  columns: ColumnSchema[];
  currentIndex: number;
  totalRecords: number;
  onClose: () => void;
  onUpdateRecord: (updatedRecord: Record<string, any>) => void;
  onDeleteRecord: (recordId: string) => void;
  onNavigate: (newIndex: number) => void;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  isOpen,
  record,
  columns,
  currentIndex,
  totalRecords,
  onClose,
  onUpdateRecord,
  onDeleteRecord,
  onNavigate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (record) {
      setEditValues({ ...record });
      setIsEditing(false);
      setIsSaved(false);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const validColumns = columns.filter(
    (col) => !col.key.startsWith('_') && col.key.trim() !== ''
  );

  const handleFieldChange = (key: string, val: any) => {
    setEditValues((prev) => {
      const updated = {
        ...prev,
        [key]: val,
      };

      const hasProfit = validColumns.some((c) => c.key.toLowerCase().includes('profit'));
      if (hasProfit) {
        const rentKey = validColumns.find((c) => c.key.toLowerCase().includes('rent'))?.key;
        const maintKey = validColumns.find((c) => c.key.toLowerCase().includes('maint'))?.key;
        const elecKey = validColumns.find((c) => c.key.toLowerCase().includes('elec'))?.key;
        const waterKey = validColumns.find((c) => c.key.toLowerCase().includes('water'))?.key;
        const expKey = validColumns.find((c) => c.key.toLowerCase().includes('expense'))?.key;
        const profitKey = validColumns.find((c) => c.key.toLowerCase().includes('profit'))?.key;

        const rent = rentKey ? updated[rentKey] : 0;
        const maint = maintKey ? updated[maintKey] : 0;
        const elec = elecKey ? updated[elecKey] : 0;
        const water = waterKey ? updated[waterKey] : 0;

        const { totalExpenses, totalProfit } = calculateProfitAndExpenses(rent, maint, elec, water);

        if (expKey) {
          updated[expKey] = formatCurrency(totalExpenses);
        }
        if (profitKey) {
          updated[profitKey] = formatCurrency(totalProfit);
        }
      }

      return updated;
    });
  };

  const handleSave = () => {
    onUpdateRecord(editValues);
    setIsEditing(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = () => {
    onDeleteRecord(record._rowId);
    onClose();
  };

  return (
    <div
      id="record-drawer-backdrop"
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end"
    >
      <div
        id="record-drawer-container"
        className="w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col text-slate-100 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">Record Inspector</h3>
            <span className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              {currentIndex + 1} of {totalRecords}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Prev / Next navigation */}
            <button
              id="prev-record-btn"
              disabled={currentIndex <= 0}
              onClick={() => onNavigate(currentIndex - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              title="Previous record"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              id="next-record-btn"
              disabled={currentIndex >= totalRecords - 1}
              onClick={() => onNavigate(currentIndex + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
              title="Next record"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              id="close-drawer-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Fields */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {validColumns.map((col) => {
            const rawVal = isEditing ? editValues[col.key] : record[col.key];

            return (
              <div
                key={col.key}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{col.label}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-500">
                    {col.type}
                  </span>
                </div>

                {isEditing ? (
                  col.type === 'boolean' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(editValues[col.key])}
                        onChange={(e) => handleFieldChange(col.key, e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-500 h-4 w-4"
                      />
                      <span className="text-xs text-slate-300">True / Enabled</span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editValues[col.key] ?? ''}
                      onChange={(e) => handleFieldChange(col.key, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-hidden focus:border-blue-500"
                    />
                  )
                ) : (
                  <div className="text-sm text-slate-100 break-words font-normal">
                    {rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' ? (
                      String(rawVal)
                    ) : (
                      <span className="text-slate-600 italic">Empty</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            id="delete-record-btn"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}

            {isEditing ? (
              <>
                <button
                  id="cancel-edit-btn"
                  onClick={() => {
                    setEditValues({ ...record });
                    setIsEditing(false);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-edit-btn"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <button
                id="enter-edit-mode-btn"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Record</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
