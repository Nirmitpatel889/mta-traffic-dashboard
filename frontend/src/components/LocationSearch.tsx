import { useState, useEffect, useRef } from 'react';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  placeholder: string;
  onSelect: (result: { lat: number; lng: number; label: string }) => void;
  initialValue?: string;
  hideIcon?: boolean;
}

export default function LocationSearch({ placeholder, onSelect, initialValue = '', hideIcon = false }: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&viewbox=-74.25909,40.917577,-73.700272,40.477399&bounded=1`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Failed to fetch locations', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (r: LocationResult) => {
    setQuery(r.display_name.split(',')[0]);
    setShowDropdown(false);
    onSelect({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      label: r.display_name.split(',')[0],
    });
  };

  return (
    <div className="relative w-full text-black" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          className={`w-full bg-white border border-[#dadce0] rounded-lg px-3 ${hideIcon ? '' : 'pl-9'} py-2.5 text-[15px] outline-none focus:border-blue-500 focus:shadow-[0_0_0_1px_#3b82f6] transition-all text-black`}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
        />
        {!hideIcon && (
          <svg className="absolute left-3 top-3 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        )}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.1)] max-h-48 overflow-y-auto">
          {results.map((r, idx) => (
            <button
              key={idx}
              className="w-full text-left px-3 py-2.5 text-sm text-black border-b border-gray-100 last:border-0 hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => handleSelect(r)}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
