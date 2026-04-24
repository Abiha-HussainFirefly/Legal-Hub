import type { ProfileHeatmapDay } from "@/types/profile";

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });
const labelFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const intensityClasses: Record<ProfileHeatmapDay["intensity"], string> = {
  0: "bg-[#EEE7F3] dark:bg-[#2C2336]",
  1: "bg-[#DCCEE8] dark:bg-[#47385A]",
  2: "bg-[#BB9ED1] dark:bg-[#6A4F84]",
  3: "bg-[#8D74A3] dark:bg-[#8D74A3]",
  4: "bg-[#4C2F5E] dark:bg-[#CDB8DF]",
};

function buildWeeks(days: ProfileHeatmapDay[]) {
  const weeks: ProfileHeatmapDay[][] = [];
  let currentWeek: ProfileHeatmapDay[] = [];

  for (const day of days) {
    const currentDate = new Date(day.date);
    const weekday = currentDate.getUTCDay();

    if (currentWeek.length === 0) {
      for (let pad = 0; pad < weekday; pad += 1) {
        currentWeek.push(undefined as unknown as ProfileHeatmapDay);
      }
    }

    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(undefined as unknown as ProfileHeatmapDay);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export default function ProfileActivityHeatmap({
  days,
}: {
  days: ProfileHeatmapDay[];
}) {
  const weeks = buildWeeks(days);
  const activeDays = days.filter((day) => day.total > 0).length;
  const totalActivity = days.reduce((sum, day) => sum + day.total, 0);
  const strongestDay = days.reduce<ProfileHeatmapDay | null>((best, day) => {
    if (!best || day.total > best.total) return day;
    return best;
  }, null);
  const monthLabels = weeks.map((week) => {
    const firstDay = week.find(Boolean);
    if (!firstDay) return "";
    const date = new Date(firstDay.date);
    return date.getUTCDate() <= 7 ? monthFormatter.format(date) : "";
  });

  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Activity Heatmap
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--heading)]">
            Contribution intensity over the last 12 months
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
            Daily activity across discussions, answers, comments, cases, profile views, and
            engagement signals.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Active Days
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--heading)]">{activeDays}</p>
          </div>
          <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Total Activity
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--heading)]">{totalActivity}</p>
          </div>
          <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Strongest Day
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--heading)]">
              {strongestDay && strongestDay.total > 0
                ? labelFormatter.format(new Date(strongestDay.date))
                : "No peak yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>Low</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <span
              key={intensity}
              className={`h-3.5 w-3.5 rounded-[4px] ${intensityClasses[intensity as 0 | 1 | 2 | 3 | 4]}`}
            />
          ))}
          <span>High</span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="mb-3 grid grid-flow-col auto-cols-[13px] gap-2 pl-10">
            {monthLabels.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="grid grid-rows-7 gap-2 pt-[2px] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {["Sun", "", "Tue", "", "Thu", "", "Sat"].map((label, index) => (
                <span key={`${label}-${index}`} className="h-[13px]">
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-flow-col auto-cols-[13px] gap-2">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-2">
                  {week.map((day, dayIndex) =>
                    day ? (
                      <div
                        key={day.date}
                        className={`h-[13px] w-[13px] rounded-[4px] ${intensityClasses[day.intensity]}`}
                        title={`${labelFormatter.format(new Date(day.date))}: ${day.total} tracked activities`}
                      />
                    ) : (
                      <div
                        key={`empty-${weekIndex}-${dayIndex}`}
                        className="h-[13px] w-[13px] rounded-[4px] bg-transparent"
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
