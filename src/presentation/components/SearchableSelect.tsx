import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Seleccionar --',
  label,
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filtrado de opciones en tiempo real
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={`w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-lg sm:rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:border-slate-400'
        } ${
          error
            ? 'border-red-400 focus:ring-red-400/20'
            : isOpen
            ? 'border-[#003882] ring-2 ring-[#003882]/15'
            : 'border-slate-300'
        }`}
      >
        <div className="flex-1 truncate pr-2 text-left">
          {selectedOption ? (
            <span className="font-semibold text-slate-800">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-700 hover:bg-slate-100 rounded"
              title="Limpiar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#003882]' : ''
            }`}
          />
        </div>
      </div>

      {error && <p className="text-[11px] font-medium text-red-600 mt-0.5">{error}</p>}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Active Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar profesor o estudiante..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`px-3 py-2 text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-[#003882] font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>{option.label}</span>
                      {option.sublabel && (
                        <span className="text-[10px] text-slate-400">{option.sublabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#003882] shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
