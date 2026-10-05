import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  AlertCircle,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  ChevronUp,
} from 'lucide-react';

interface CardsQuickActionsProps {
  onAddExpense: () => void;
  onCheckOverdue: () => void;
  onToggleFilter: () => void;
  activeFilterState?: string;
  isOverdueActive?: boolean;
  overdueCount?: number;
}

export const CardsQuickActions: React.FC<CardsQuickActionsProps> = ({
  onAddExpense,
  onCheckOverdue,
  onToggleFilter,
  activeFilterState = 'ALL',
  isOverdueActive = false,
  overdueCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="cards-quick-actions-container" className="fixed bottom-6 right-6 z-40">
      {/* Expanded Menu */}
      {isOpen && (
        <div className="mb-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl shadow-black/80 space-y-2 min-w-[240px] animate-in fade-in slide-in-from-bottom-5 duration-150">
          <div className="flex items-center justify-between px-2.5 py-1 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Quick Actions Menu</span>
            <span className="text-emerald-400 font-mono">Shortcuts</span>
          </div>

          {/* 1. Add Expense */}
          <button
            id="qa-add-expense"
            onClick={() => {
              setIsOpen(false);
              onAddExpense();
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-emerald-950/70 hover:text-emerald-300 flex items-center gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white group-hover:text-emerald-300">Add Expense</div>
              <div className="text-[10px] text-slate-400">Log cost or maintenance bill</div>
            </div>
          </button>

          {/* 2. Check Overdue Payments */}
          <button
            id="qa-check-overdue"
            onClick={() => {
              setIsOpen(false);
              onCheckOverdue();
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer group ${
              isOverdueActive
                ? 'bg-rose-950/80 text-rose-200 border border-rose-800/80'
                : 'text-slate-200 hover:bg-rose-950/60 hover:text-rose-300'
            }`}
          >
            <div className="h-7 w-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform relative">
              <AlertCircle className="h-4 w-4" />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 text-[9px] text-white flex items-center justify-center font-bold">
                  {overdueCount}
                </span>
              )}
            </div>
            <div>
              <div className="font-bold text-white group-hover:text-rose-300 flex items-center gap-1.5">
                <span>Check Overdue Payments</span>
                {isOverdueActive && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-rose-900 text-rose-200">
                    Active
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {isOverdueActive ? 'Showing unpaid only' : 'Filter unpaid rooms & bills'}
              </div>
            </div>
          </button>

          {/* 3. Toggle Filter */}
          <button
            id="qa-toggle-filter"
            onClick={() => {
              onToggleFilter();
            }}
            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer group"
          >
            <div className="h-7 w-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white group-hover:text-sky-300 flex items-center gap-1.5">
                <span>Toggle Filter</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-sky-950 text-sky-300 font-mono">
                  {activeFilterState}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">Cycle All / Paid / Unpaid</div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        id="cards-floating-quick-actions-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-linear-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/80 hover:scale-105 ring-2 ring-emerald-400/30'
        }`}
        title="Floating Quick Actions"
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4" />
            <span>Close</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 animate-spin text-emerald-200" style={{ animationDuration: '6s' }} />
            <span className="tracking-wide">Quick Actions</span>
            {overdueCount > 0 && !isOverdueActive && (
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </>
        )}
      </button>
    </div>
  );
};
