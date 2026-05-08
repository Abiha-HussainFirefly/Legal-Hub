'use client';

import { Search } from 'lucide-react';

export default function AdminSearchField({
  name = 'q',
  defaultValue,
  placeholder,
  wrapperClassName = '',
  inputClassName = '',
  listId,
  suggestions,
}: {
  name?: string;
  defaultValue?: string;
  placeholder: string;
  wrapperClassName?: string;
  inputClassName?: string;
  listId?: string;
  suggestions?: string[];
}) {
  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <Search className="pointer-events-none absolute left-[1.1rem] top-1/2 z-[1] h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-[#8C7A9B]" />
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        list={listId}
        style={{ paddingLeft: "3.35rem" }}
        className={`legal-field h-12 rounded-[18px] border-[#4C2F5E]/10 bg-[#FBF9FD] pr-4 text-sm leading-none text-[#2F1D3B] placeholder:text-[#9A90A4] focus:border-[#4C2F5E]/20 focus:bg-white ${inputClassName}`.trim()}
      />
      {listId && suggestions?.length ? (
        <datalist id={listId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </div>
  );
}
