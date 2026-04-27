'use client';

import Image from 'next/image';
import Link from 'next/link';

interface AuthShellProps {
  portalLabel?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:p-3.5 lg:gap-3.5 h-[100dvh] w-full bg-white box-border overflow-hidden">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[62%] h-full p-[58px_46px] rounded-[24px] relative flex-col items-center justify-center overflow-hidden text-white shrink-0">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(76,47,94,0.91)_0%,rgba(130,81,160,0.97)_65%,rgba(159,99,196,1)_100%)] z-10" />

        <div className="relative z-30 text-center w-full max-w-lg mx-auto">
          <div className="mb-[38px]">
            <Link href="/">
              <Image
                src="/logo-legal-hub.png"
                alt="Legal Hub"
                width={220}
                height={65}
                className="mx-auto brightness-0 invert transition hover:opacity-80"
              />
            </Link>
          </div>
          <h1 className="text-[32px] font-bold mb-4 leading-tight text-white">
            {title}
          </h1>
          <p className="text-lg leading-relaxed mb-10 text-center text-white/90">
            {description}
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[calc(38%-14px)] h-full p-6 lg:p-[58px_46px] rounded-[24px] bg-[#FCFCFF] flex items-center justify-center overflow-y-auto no-scrollbar shrink-0">
        <div className="w-full max-w-[340px] my-auto">
          {children}
          {footer ? <div className="mt-4 text-center text-sm text-slate-600">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
