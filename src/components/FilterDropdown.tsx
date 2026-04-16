import { useState } from 'react';

interface FilterDropdownProps {
  selectedCountry: string;
  selectedSpecialization: string;
  allCountries: string[];
  allSpecializations: string[];
  onApply: (country: string, specialization: string) => void;
  onClose: () => void;
}

export function FilterDropdown({
  selectedCountry,
  selectedSpecialization,
  allCountries,
  allSpecializations,
  onApply,
  onClose,
}: FilterDropdownProps) {
  const [tempCountry, setTempCountry] = useState(selectedCountry);
  const [tempSpecialization, setTempSpecialization] = useState(selectedSpecialization);

  return (
    <>
      <div
        className="fixed inset-0 z-[1999]"
        onClick={onClose}
      />
      <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[2000]" role="dialog" aria-label="Filter universities">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm text-slate-800">Filters</h3>
          {(tempCountry || tempSpecialization || selectedCountry || selectedSpecialization) && (
            <button
              onClick={() => {
                setTempCountry('');
                setTempSpecialization('');
                onApply('', '');
                onClose();
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
            <select
              value={tempCountry}
              onChange={(e) => setTempCountry(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Countries</option>
              {allCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specialization</label>
            <select
              value={tempSpecialization}
              onChange={(e) => setTempSpecialization(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Specializations</option>
              {allSpecializations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={() => {
              onApply(tempCountry, tempSpecialization);
              onClose();
            }}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
