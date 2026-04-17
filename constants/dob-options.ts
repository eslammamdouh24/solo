export const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: String(i + 1),
}));

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, "0"),
  value: String(i + 1),
}));

const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from(
  { length: currentYear - 1900 - 12 },
  (_, i) => ({
    label: String(currentYear - 13 - i),
    value: String(currentYear - 13 - i),
  }),
);
