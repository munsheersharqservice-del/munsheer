import React, { useState } from 'react';
import { X, Plus, AlertCircle, Calculator } from 'lucide-react';
import { ColumnSchema } from '../types';
import { calculateProfitAndExpenses, formatCurrency } from '../data/villaDatabase';

interface AddRecordModalProps {
  isOpen: boolean;
  tableName: string;
  columns: ColumnSchema[];
  onClose: () => void;
  onAdd: (newRecord: Record<string, any>) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  tableName,
  columns,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validColumns = columns.filter(
    (col) => !col.key.startsWith('_') && col.key.trim() !== ''
  );

  // Check if this table has profit/expense fields
  const hasRent = validColumns.some((c) => c.key.toLowerCase().includes('rent'));
  const hasProfit = validColumns.some((c) => c.key.toLowerCase().includes('profit'));

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      // Auto calculate profit if rent, maintenance, electricity, or water are updated
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    const hasAtLeastOneField = Object.values(formData).some(
      (v) => v !== undefined && v !== null && String(v).trim() !== ''
    );

    if (!hasAtLeastOneField) {
      setError('Please fill in at least one field to add a record.');
      return;
    }

    onAdd(formData);
    setFormData({});
    onClose();
  };

  return (
    <div
      id="add-record-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="add-record-container"
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                New Record: {tableName}
              </h2>
              <p className="text-xs text-slate-400">
                Enter details to append a new row to this database table
              </p>
            </div>
          </div>
          <button
            id="close-add-record-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {validColumns.map((col) => {
              const val = formData[col.key] ?? '';

              return (
                <div key={col.key} className={col.type === 'string' && col.key.toLowerCase().includes('name') ? 'sm:col-span-2' : ''}>
                  <label
                    htmlFor={`input-${col.key}`}
                    className="block text-xs font-medium text-slate-300 mb-1 truncate"
                  >
                    {col.label}
                    <span className="text-[10px] text-slate-500 ml-1.5 font-normal">
                      ({col.type})
                    </span>
                  </label>

                  {col.type === 'boolean' ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        id={`input-${col.key}`}
                        type="checkbox"
                        checked={Boolean(formData[col.key])}
                        onChange={(e) => handleChange(col.key, e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs text-slate-400">Yes / True</span>
                    </div>
                  ) : col.type === 'date' ? (
                    <input
                      id={`input-${col.key}`}
                      type="date"
                      value={val}
                      onChange={(e) => handleChange(col.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  ) : col.type === 'number' || col.type === 'currency' ? (
                    <div className="relative">
                      {col.type === 'currency' && (
                        <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">QAR</span>
                      )}
                      <input
                        id={`input-${col.key}`}
                        type="text"
                        placeholder={col.sampleValue ? String(col.sampleValue) : '0'}
                        value={val}
                        onChange={(e) => handleChange(col.key, e.target.value)}
                        className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pr-3 text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500 ${
                          col.type === 'currency' ? 'pl-12' : 'px-3'
                        }`}
                      />
                    </div>
                  ) : (
                    <input
                      id={`input-${col.key}`}
                      type={col.type === 'email' ? 'email' : 'text'}
                      placeholder={col.sampleValue ? String(col.sampleValue) : ''}
                      value={val}
                      onChange={(e) => handleChange(col.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              id="cancel-add-record-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-record-btn"
              className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Insert Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
