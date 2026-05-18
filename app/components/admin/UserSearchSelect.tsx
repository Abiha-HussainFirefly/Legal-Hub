"use client";

import { useEffect, useRef, useState } from "react";

interface User {
  id: string;
  displayName: string;
  username: string | null;
  email: string;
}

interface Props {
  name: string;
  placeholder?: string;
  users: User[];
}

export default function UserSearchSelect({
  name,
  placeholder = "Search users by name, username, or email",
  users,
}: Props) {
  const [query, setQuery]           = useState("");
  const [open, setOpen]             = useState(false);
  const [selected, setSelected]     = useState<User | null>(null);
  const containerRef                = useRef<HTMLDivElement>(null);

  const filtered = query.trim() === ""
    ? users.slice(0, 8)
    : users
        .filter((u) => {
          const q = query.toLowerCase();
          return (
            u.displayName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.username ?? "").toLowerCase().includes(q)
          );
        })
        .slice(0, 8);

  
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(user: User) {
    setSelected(user);
    setQuery(user.displayName);
    setOpen(false);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      
      <input type="hidden" name={name} value={selected?.id ?? ""} />

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="legal-field w-full pr-8"
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

    {/* Selected user pill 
{selected && (
  <p className="mt-1 text-xs text-slate-500">
    ID: <span className="font-mono text-[#4C2F5E]">{selected.id}</span>
  </p>
)}
 ── */}

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-[16px] border border-[#4C2F5E]/10 bg-white py-1 shadow-lg">
          {filtered.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onMouseDown={() => select(user)}
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-[#F4EFF8]"
              >
                <span className="text-sm font-semibold text-[#2F1D3B]">{user.displayName}</span>
                <span className="text-xs text-slate-500">
                  {user.username ? `@${user.username} · ` : ""}{user.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() !== "" && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-[16px] border border-[#4C2F5E]/10 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm text-slate-500">No users found for "{query}"</p>
        </div>
      )}
    </div>
  );
}