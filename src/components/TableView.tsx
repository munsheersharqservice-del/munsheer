import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Eye,
  SlidersHorizontal,
  Mail,
  Calendar,
  Hash,
  DollarSign,
  Type,
  Tag,
  CheckSquare,
  Square,
  Edit2,
  Check,
  X,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { SheetTable, ColumnSchema, ColumnType } from '../types';
import { VillaFinancialSummary } from './VillaFinancialSummary';

interface TableViewProps {
  tables: SheetTable[];
  activeTableIndex: number;
  onSelectTable: (index: number) => void;
  onOpenAddModal: () => void;
  onOpenRecordDrawer: (record: Record<string, any>, index: number) => void;
  onUpdateCell: (rowId: string, columnKey: string, newValue: any) => void;
  onDeleteRows: (rowIds: string[]) => void;
  onOpenMakeNewExcel?: () => void;
  onSwitchToVillaView?: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tables,
  activeTableIndex,
  onSelectTable,
  onOpenAddModal,
  onOpenRecordDrawer,
  onUpdateCell,
  onDeleteRows,
  onOpenMakeNewExcel,
  onSwitchToVillaView,
}) => {
  const currentTable = tables[activeTableIndex] || tables[0];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('ALL');
  const [filterValue, setFilterValue] = useState<string>('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showColumnToggles, setShowColumnToggles] = useState(false);

  // Pagination - set to 50 so all 12 rooms and calculation rows are visible without being cut off
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    colKey: string;
    val: string;
  } | null>(null);

  const columns = useMemo(() => {
    if (!currentTable) return [];
    return currentTable.columns.filter((c) => !c.key.startsWith('_'));
  }, [currentTable]);

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumns.has(col.key));
  }, [columns, hiddenColumns]);

  // Filtering & Sorting
  const processedRows = useMemo(() => {
    if (!currentTable) return [];
    let rows = [...currentTable.rows];

    // Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row) => {
        return columns.some((col) => {
          const val = row[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      });
    }

    // Column specific filter
    if (filterColumn !== 'ALL' && filterValue.trim()) {
      const fVal = filterValue.toLowerCase();
      rows = rows.filter((row) => {
        const val = row[filterColumn];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(fVal);
      });
    }

    // Sorting
    if (sortKey) {
      rows.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined || valA === '') return 1;
        if (valB === null || valB === undefined || valB === '') return -1;

        // Numeric or currency sort
        const cleanA = String(valA).replace(/[\$,QARqarQRqrر\.ق]/g, '');
        const cleanB = String(valB).replace(/[\$,QARqarQRqrر\.ق]/g, '');
        const numA = Number(cleanA);
        const numB = Number(cleanB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortOrder === 'asc' ? comp : -comp;
      });
    }

    return rows;
  }, [currentTable, searchQuery, filterColumn, filterValue, sortKey, sortOrder, columns]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(columnKey);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedRowIds.size === paginatedRows.length && paginatedRows.length > 0) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(paginatedRows.map((r) => r._rowId)));
    }
  };

  const toggleSelectRow = (rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleInlineSave = () => {
    if (editingCell) {
      onUpdateCell(editingCell.rowId, editingCell.colKey, editingCell.val);
      setEditingCell(null);
    }
  };

  const renderColumnIcon = (type: ColumnType) => {
    switch (type) {
      case 'number':
        return <Hash className="h-3 w-3 text-slate-400" />;
      case 'currency':
        return <DollarSign className="h-3 w-3 text-emerald-400" />;
      case 'date':
        return <Calendar className="h-3 w-3 text-blue-400" />;
      case 'status':
        return <Tag className="h-3 w-3 text-amber-400" />;
      case 'email':
        return <Mail className="h-3 w-3 text-purple-400" />;
      default:
        return <Type className="h-3 w-3 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (val: string) => {
    const lower = val.toLowerCase();
    if (
      lower.includes('paid') ||
      lower.includes('completed') ||
      lower.includes('in stock') ||
      lower.includes('active') ||
      lower.includes('won') ||
      lower.includes('verified')
    ) {
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
    }
    if (
      lower.includes('pending') ||
      lower.includes('partial') ||
      lower.includes('scheduled') ||
      lower.includes('in progress') ||
      lower.includes('proposal') ||
      lower.includes('negotiation') ||
      lower.includes('low') ||
      lower.includes('remote')
    ) {
      return 'bg-amber-950/60 text-amber-300 border-amber-800/80';
    }
    if (
      lower.includes('overdue') ||
      lower.includes('urgent') ||
      lower.includes('out of stock') ||
      lower.includes('lost') ||
      lower.includes('inactive') ||
      lower.includes('backordered') ||
      lower.includes('failed')
    ) {
      return 'bg-rose-950/60 text-rose-300 border-rose-800/80';
    }
    return 'bg-blue-950/60 text-blue-300 border-blue-800/80';
  };

  const isFinancialTable = useMemo(() => {
    if (!currentTable) return false;
    const text = currentTable.rawHeaders.join(' ').toLowerCase();
    return text.includes('rent') || text.includes('profit') || text.includes('maintenance') || text.includes('electric');
  }, [currentTable]);

  return (
    <div id="table-view-container" className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-100">
      {/* Real-Time Two-Way Live Sync Active Indicator Bar */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-sky-950/70 border-b border-emerald-800/40 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>2-WAY LIVE UPDATE ACTIVE</span>
          </div>

          <p className="text-xs text-slate-300 hidden md:block">
            Editing any cell in this Excel page syncs immediately to <span className="text-emerald-300 font-semibold">Villa Manager & Cloud Firestore</span>. Edits in Villa Manager reflect here in real time.
          </p>
        </div>

        {onSwitchToVillaView && (
          <button
            onClick={onSwitchToVillaView}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-850 hover:bg-slate-800 text-emerald-300 border border-emerald-600/40 hover:border-emerald-500 transition-colors shadow-sm cursor-pointer ml-auto"
            title="Switch to Villa Manager to view room cards & monthly dashboard"
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Open Villa 12 Rooms View</span>
          </button>
        )}
      </div>

      {/* Multi-sheet / Multi-table Tab Bar */}
      {tables.length > 1 && (
        <div id="sheet-tabs-bar" className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
          {tables.map((t, idx) => (
            <button
              key={t.id || idx}
              id={`sheet-tab-${idx}`}
              onClick={() => {
                onSelectTable(idx);
                setPage(1);
                setSelectedRowIds(new Set());
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
                activeTableIndex === idx
                  ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              <span>{t.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                {t.rows.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Villa Rent, Maintenance, Utilities & Profit KPI Summary */}
      {isFinancialTable && currentTable && (
        <VillaFinancialSummary table={currentTable} />
      )}

      {/* Top Controls Toolbar */}
      <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
        {/* Search & Filter Group */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Global Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              id="table-global-search"
              type="text"
              placeholder={`Search ${currentTable?.rows.length || 0} records...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Column-Specific Filter */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                id="filter-column-select"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Columns</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            {filterColumn !== 'ALL' && (
              <input
                id="filter-value-input"
                type="text"
                placeholder={`Filter ${filterColumn}...`}
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 w-36"
              />
            )}
          </div>
        </div>

        {/* Action Buttons: Add Record, Column Visibility, Bulk Actions */}
        <div className="flex items-center gap-2">
          {/* Bulk Delete if rows selected */}
          {selectedRowIds.size > 0 && (
            <button
              id="bulk-delete-btn"
              onClick={() => {
                onDeleteRows(Array.from(selectedRowIds));
                setSelectedRowIds(new Set());
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete ({selectedRowIds.size})</span>
            </button>
          )}

          {/* Column Visibility Toggle */}
          <div className="relative">
            <button
              id="columns-visibility-btn"
              onClick={() => setShowColumnToggles(!showColumnToggles)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium cursor-pointer"
              title="Show / hide columns"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Columns</span>
            </button>

            {showColumnToggles && (
              <div
                id="columns-visibility-menu"
                className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 z-40 space-y-1 max-h-60 overflow-y-auto"
              >
                <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                  Toggle Columns
                </div>
                {columns.map((col) => {
                  const isVisible = !hiddenColumns.has(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleColumnVisibility(col.key)}
                      className="w-full text-left px-2 py-1 text-xs rounded hover:bg-slate-800 flex items-center justify-between text-slate-300 cursor-pointer"
                    >
                      <span className="truncate">{col.label}</span>
                      <span className={`text-[10px] ${isVisible ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {isVisible ? 'Visible' : 'Hidden'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Make New Excel Sheet (Live Data) Button */}
          {onOpenMakeNewExcel && (
            <button
              id="table-make-new-excel-btn"
              onClick={onOpenMakeNewExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Generate a new Excel sheet populated with live data"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Make New Excel</span>
            </button>
          )}

          {/* Add Record Button */}
          <button
            id="open-add-record-btn"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[350px]">
        <table id="database-data-table" className="w-full text-left border-collapse text-xs sm:text-sm">
          {/* Table Header */}
          <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-20 border-b border-slate-800">
            <tr>
              {/* Checkbox select all */}
              <th className="w-10 px-3 py-2.5 text-center">
                <button
                  id="select-all-rows-checkbox"
                  onClick={handleSelectAll}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {selectedRowIds.size > 0 && selectedRowIds.size === paginatedRows.length ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>

              {/* Dynamic Columns */}
              {visibleColumns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    id={`col-header-${col.key}`}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-2.5 font-medium whitespace-nowrap select-none hover:text-slate-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5">
                      {renderColumnIcon(col.type)}
                      <span>{col.label}</span>
                      <span className="text-slate-600 group-hover:text-slate-400">
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Action column */}
              <th className="w-24 px-4 py-2.5 text-right font-medium text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-850">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No matching records found in this table.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const isSelected = selectedRowIds.has(row._rowId);

                return (
                  <tr
                    key={row._rowId || idx}
                    id={`row-${row._rowId}`}
                    className={`transition-colors group hover:bg-slate-900/50 ${
                      isSelected ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="w-10 px-3 py-2 text-center">
                      <button
                        onClick={() => toggleSelectRow(row._rowId)}
                        className="text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Dynamic Data Cells */}
                    {visibleColumns.map((col) => {
                      const cellVal = row[col.key];
                      const isEditingThis =
                        editingCell?.rowId === row._rowId && editingCell?.colKey === col.key;
                      const isComputedCol =
                        col.key.toLowerCase().includes('total paid') ||
                        col.key.toLowerCase().includes('balance due') ||
                        col.key.toLowerCase().includes('payment status') ||
                        col.key.toLowerCase().includes('profit');

                      const handleStartEdit = () => {
                        if (!isComputedCol) {
                          setEditingCell({
                            rowId: row._rowId,
                            colKey: col.key,
                            val: cellVal !== undefined && cellVal !== null ? String(cellVal) : '',
                          });
                        }
                      };

                      return (
                        <td
                          key={col.key}
                          onClick={handleStartEdit}
                          onDoubleClick={handleStartEdit}
                          className={`px-4 py-2.5 text-slate-300 whitespace-nowrap max-w-xs truncate ${
                            !isComputedCol ? 'cursor-pointer hover:bg-slate-800/60 hover:text-white' : ''
                          }`}
                          title={!isComputedCol ? 'Click to edit live' : 'Auto-calculated'}
                        >
                          {isEditingThis ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                type="text"
                                value={editingCell.val}
                                onChange={(e) =>
                                  setEditingCell({
                                    ...editingCell,
                                    val: e.target.value,
                                  })
                                }
                                onBlur={handleInlineSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleInlineSave();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="bg-slate-900 border border-emerald-500 rounded px-2 py-0.5 text-xs text-white focus:outline-hidden w-full font-mono"
                              />
                              <button
                                onMouseDown={(e) => { e.preventDefault(); handleInlineSave(); }}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); setEditingCell(null); }}
                                className="p-1 text-slate-500 hover:text-slate-300"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : col.key.toLowerCase().includes('profit') ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 shadow-xs">
                              <TrendingUp className="h-3 w-3 text-emerald-400" />
                              <span>
                                {cellVal !== undefined && cellVal !== null && cellVal !== ''
                                  ? String(cellVal).startsWith('QAR')
                                    ? cellVal
                                    : String(cellVal).startsWith('$')
                                    ? `QAR ${String(cellVal).slice(1).trim()}`
                                    : `QAR ${cellVal}`
                                  : 'QAR 0'}
                              </span>
                            </span>
                          ) : col.key.toLowerCase().includes('rent') ? (
                            <span className="font-mono text-emerald-400 font-semibold">
                              {cellVal !== undefined && cellVal !== null && cellVal !== ''
                                ? String(cellVal).startsWith('QAR')
                                  ? cellVal
                                  : String(cellVal).startsWith('$')
                                  ? `QAR ${String(cellVal).slice(1).trim()}`
                                  : `QAR ${cellVal}`
                                : '-'}
                            </span>
                          ) : col.key.toLowerCase().includes('maint') ? (
                            <span className="font-mono text-amber-400 font-medium">
                              {cellVal !== undefined && cellVal !== null && cellVal !== ''
                                ? String(cellVal).startsWith('QAR')
                                  ? cellVal
                                  : String(cellVal).startsWith('$')
                                  ? `QAR ${String(cellVal).slice(1).trim()}`
                                  : `QAR ${cellVal}`
                                : '-'}
                            </span>
                          ) : col.key.toLowerCase().includes('elec') ? (
                            <span className="font-mono text-yellow-400 font-medium">
                              {cellVal !== undefined && cellVal !== null && cellVal !== ''
                                ? String(cellVal).startsWith('QAR')
                                  ? cellVal
                                  : String(cellVal).startsWith('$')
                                  ? `QAR ${String(cellVal).slice(1).trim()}`
                                  : `QAR ${cellVal}`
                                : '-'}
                            </span>
                          ) : col.key.toLowerCase().includes('water') ? (
                            <span className="font-mono text-cyan-400 font-medium">
                              {cellVal !== undefined && cellVal !== null && cellVal !== ''
                                ? String(cellVal).startsWith('QAR')
                                  ? cellVal
                                  : String(cellVal).startsWith('$')
                                  ? `QAR ${String(cellVal).slice(1).trim()}`
                                  : `QAR ${cellVal}`
                                : '-'}
                            </span>
                          ) : col.type === 'status' ? (
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
                                String(cellVal ?? '')
                              )}`}
                            >
                              {cellVal || '-'}
                            </span>
                          ) : col.type === 'currency' ? (
                            <span className="font-mono text-emerald-400 font-medium">
                              {cellVal !== undefined && cellVal !== null && cellVal !== ''
                                ? String(cellVal).startsWith('QAR')
                                  ? cellVal
                                  : String(cellVal).startsWith('$')
                                  ? `QAR ${String(cellVal).slice(1).trim()}`
                                  : `QAR ${cellVal}`
                                : '-'}
                            </span>
                          ) : col.type === 'email' ? (
                            <a
                              href={`mailto:${cellVal}`}
                              className="text-blue-400 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{cellVal}</span>
                            </a>
                          ) : col.type === 'number' ? (
                            <span className="font-mono text-slate-200">{cellVal ?? '-'}</span>
                          ) : (
                            <span className="truncate">{cellVal !== undefined && cellVal !== null && cellVal !== '' ? String(cellVal) : '-'}</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Actions */}
                    <td className="w-24 px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        {/* View in Inspector Drawer */}
                        <button
                          id={`view-drawer-btn-${idx}`}
                          onClick={() => onOpenRecordDrawer(row, idx)}
                          className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="View / Edit record details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Inline edit trigger */}
                        <button
                          onClick={() => {
                            const firstCol = visibleColumns[0]?.key;
                            if (firstCol) {
                              setEditingCell({
                                rowId: row._rowId,
                                colKey: firstCol,
                                val: String(row[firstCol] ?? ''),
                              });
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Quick edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete single row */}
                        <button
                          onClick={() => {
                            onDeleteRows([row._rowId]);
                          }}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        id="table-pagination-footer"
        className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"
      >
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <strong className="text-slate-200">
              {processedRows.length === 0 ? 0 : (page - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-200">
              {Math.min(page * pageSize, processedRows.length)}
            </strong>{' '}
            of <strong className="text-slate-200">{processedRows.length}</strong> records
          </span>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <span>Per page:</span>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            id="pagination-prev-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            Previous
          </button>
          <span className="px-2 font-mono text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            id="pagination-next-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
