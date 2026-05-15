'use client';

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type BadgeOption = {
  id: string;
  code: string;
  name: string;
  pointsAwarded: number;
  isActive: boolean;
};

function buildBadgeLabel(badge: BadgeOption) {
  return `${badge.name} (${badge.code}) - ${badge.pointsAwarded} pts`;
}

export default function BadgeSearchSelect({
  badges,
  name,
}: {
  badges: BadgeOption[];
  name: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const options = useMemo(
    () =>
      badges.map((badge) => ({
        ...badge,
        label: buildBadgeLabel(badge),
      })),
    [badges],
  );
  const [query, setQuery] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sorted = [...options].sort((left, right) => Number(right.isActive) - Number(left.isActive));

    if (!normalizedQuery) return sorted.slice(0, 8);

    return sorted
      .filter((badge) =>
        [badge.name, badge.code, `${badge.pointsAwarded}`, badge.label].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
      .slice(0, 8);
  }, [options, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function syncSelection(nextValue: string, input: HTMLInputElement) {
    const exactMatch = options.find((badge) => badge.label === nextValue);
    setSelectedBadgeId(exactMatch?.id ?? "");
    input.setCustomValidity(exactMatch ? "" : "Select a badge from the suggestions.");
  }

  function selectBadge(badge: (typeof options)[number]) {
    setQuery(badge.label);
    setSelectedBadgeId(badge.id);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className="space-y-3">
      <input type="hidden" name={name} value={selectedBadgeId} />

      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            syncSelection(nextValue, event.target);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(event) => syncSelection(event.target.value, event.target)}
          placeholder="Search badges by name, code, or points"
          className="legal-field pr-12"
          autoComplete="off"
          required
        />

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#8C7A9B] transition hover:text-[#4C2F5E]"
          aria-label="Toggle badge suggestions"
        >
          <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-[22px] border border-[#4C2F5E]/12 bg-white shadow-[0_20px_40px_rgba(47,29,59,0.12)]">
            <div className="border-b border-[#4C2F5E]/8 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">
              {query.trim() ? "Matching badges" : "Suggested badges"}
            </div>

            {filteredOptions.length ? (
              <div className="max-h-64 overflow-y-auto py-2">
                {filteredOptions.map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectBadge(badge)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#FBF9FD]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2F1D3B]">{badge.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {badge.code} / {badge.pointsAwarded} pts
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        badge.isActive ? "bg-[#E6F5EF] text-[#0E7A55]" : "bg-[#FCE8E6] text-[#A33A31]"
                      }`}
                    >
                      {badge.isActive ? "Active" : "Retired"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-4 py-4 text-sm text-slate-500">No badges match this search.</p>
            )}
          </div>
        ) : null}
      </div>

    </div>
  );
}
