'use client';

export default function CaseResultSkeleton() {
  return (
    <div className="workspace-list-card overflow-hidden">
      <div className="grid gap-4 border-l-[3px] border-l-[#4C2F5E] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <div className="lh-skeleton h-8 w-28 rounded-full" />
          <div className="lh-skeleton h-8 w-24 rounded-full" />
          <div className="lh-skeleton h-8 w-36 rounded-full" />
        </div>

        <div className="space-y-3">
          <div className="lh-skeleton h-3 w-32" />
          <div className="lh-skeleton h-7 w-4/5" />
          <div className="lh-skeleton h-4 w-full" />
          <div className="lh-skeleton h-4 w-11/12" />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="lh-skeleton h-7 w-24 rounded-full" />
          <div className="lh-skeleton h-7 w-20 rounded-full" />
          <div className="lh-skeleton h-7 w-28 rounded-full" />
        </div>

        <div className="grid gap-3 rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="space-y-2">
              <div className="lh-skeleton h-3 w-20" />
              <div className="lh-skeleton h-4 w-28" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="lh-skeleton h-8 w-24 rounded-full" />
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-[#4C2F5E]/8 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="lh-skeleton h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <div className="lh-skeleton h-4 w-28" />
              <div className="lh-skeleton h-3 w-32" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="lh-skeleton h-10 w-24 rounded-full" />
            <div className="lh-skeleton h-10 w-24 rounded-full" />
            <div className="lh-skeleton h-10 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
