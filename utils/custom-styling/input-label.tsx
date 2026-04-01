export const commonInputClass = (hasError: boolean) => `
    w-full px-3.5 py-[11px] rounded-[10px] text-[15px] transition-all outline-none border-[1.5px]
    ${hasError ? "border-red-500 bg-[#fff5f5]" : "border-gray-200 bg-[#fafafa] focus:border-[#9F63C4]"}
  `

export const commonLabelClass = "block text-[15px] font-semibold text-gray-700 mb-1.5"