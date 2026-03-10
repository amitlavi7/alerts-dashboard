"use client";

import { useState } from "react";

interface CityFilterProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function CityFilter({ options, selected, onChange }: CityFilterProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = query.trim()
    ? options.filter(
        (opt) =>
          opt.toLowerCase().includes(query.toLowerCase()) &&
          !selected.includes(opt)
      )
    : [];

  const add = (city: string) => {
    if (!selected.includes(city)) onChange([...selected, city]);
    setQuery("");
  };

  const remove = (city: string) => {
    onChange(selected.filter((c) => c !== city));
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Locations
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search and add locations…"
        className="w-full max-w-md rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      {focused && matches.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-60 w-full max-w-md overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
          {matches.map((city) => (
            <button
              key={city}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                add(city);
              }}
              className="block w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {city}
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-3 py-1 text-sm dark:bg-zinc-700"
            >
              {city}
              <button
                type="button"
                onClick={() => remove(city)}
                className="rounded-full p-0.5 transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-600"
                aria-label={`Remove ${city}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
