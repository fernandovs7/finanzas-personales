export function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const TODAY = getToday();
export const toPeriod = (date) => date.slice(0, 7);
export const toFortnight = (date) => (Number(date.slice(8, 10)) <= 15 ? "Q1" : "Q2");
export const sortByDate = (items) => [...items].sort((a, b) => a.date.localeCompare(b.date));
export const addMonthsToDate = (date, months) => {
  const [year, month, day] = date.split("-").map(Number);
  const base = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  const finalDate = new Date(base.getFullYear(), base.getMonth(), safeDay);
  return finalDate.toISOString().slice(0, 10);
};


export const periodLabel = (period) =>
  new Date(`${period}-01T12:00:00`).toLocaleDateString("es-CR", {
    month: "long",
    year: "numeric"
  });
export const dateLabel = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

export function shiftDate(date, days) {
  const base = new Date(`${date}T12:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function historyGroupLabel(date) {
  if (date === TODAY) {
    return `Hoy · ${dateLabel(date)}`;
  }

  if (date === shiftDate(TODAY, -1)) {
    return `Ayer · ${dateLabel(date)}`;
  }

  return dateLabel(date);
}
