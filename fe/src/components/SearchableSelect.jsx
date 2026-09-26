import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Select Option', allowCustom = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.id === value || opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pro-input px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs text-slate-800 bg-white"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : value ? value : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden text-xs">
          <div className="p-2 border-b border-slate-100 flex items-center space-x-1.5 bg-slate-50">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
            <div
              onClick={() => handleSelect('')}
              className="px-3 py-2 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-500 font-medium italic"
            >
              -- None / Clear --
            </div>
            {filteredOptions.map((opt) => {
              const optVal = opt.id || opt.value;
              const isSelected = value === optVal;
              return (
                <div
                  key={optVal}
                  onClick={() => handleSelect(optVal)}
                  className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                    isSelected ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
              );
            })}

            {allowCustom && search.trim() && !filteredOptions.some((o) => o.label.toLowerCase() === search.toLowerCase()) && (
              <div
                onClick={() => handleSelect(search.trim())}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer font-semibold flex items-center gap-1"
              >
                <span>+ Add custom: "{search.trim()}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
