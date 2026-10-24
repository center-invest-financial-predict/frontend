/** ISO date-time → locale short date + time. */
export const formatDateTimeShort = (isoDateTime: string, locale = "ru-RU"): string => {
	const d = new Date(isoDateTime);
	if (Number.isNaN(d.getTime())) return isoDateTime;
	return d.toLocaleString(locale, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/** `2026-11-05` → `05.11.2026`. */
export const formatIsoDateDots = (isoDate: string): string => {
	const [y, m, d] = isoDate.split("-");
	if (!y || !m || !d) return isoDate;
	return `${d}.${m}.${y}`;
};

/** `2026-11-05` → short day.month for axes (`05.11`). */
export const formatDayMonth = (isoDate: string, locale = "ru-RU"): string => {
	const d = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(d.getTime())) return isoDate;
	return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
};

/** `2026-11-05` → tooltip / risk (`5 ноя` / `5 Nov`). */
export const formatDayMonthShort = (isoDate: string, locale = "ru-RU"): string => {
	const d = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(d.getTime())) return isoDate;
	return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
};

/** Calendar day number from ISO date. */
export const dayOfMonth = (isoDate: string): number => {
	const d = new Date(`${isoDate}T00:00:00`);
	return Number.isNaN(d.getTime()) ? 0 : d.getDate();
};

/** Month short label from ISO (`окт` / `Oct`). */
export const formatMonthShort = (isoDate: string, locale = "ru-RU"): string => {
	const d = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(locale, { month: "short" });
};
