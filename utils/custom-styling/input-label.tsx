export const commonInputClass = (hasError: boolean) => `
    legal-field w-full px-4 py-[13px] rounded-[14px] text-[15px] transition-all outline-none border-[1.5px]
    ${hasError ? "border-red-400 bg-[#fff7f5] focus:border-red-400 focus:ring-4 focus:ring-red-100" : "border-[#4C2F5E]/12 bg-white focus:border-[#4C2F5E]"}
  `

export const commonLabelClass = "mb-2 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#736683]"
