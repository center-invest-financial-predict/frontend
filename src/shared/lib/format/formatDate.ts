/** Normalize API date (ISO string, timestamp, or Jackson LocalDate object) → `YYYY-MM-DD`. */
export const toIsoDate = (value: unknown): string => {
	if (value == null || value === "") return "";
	if (typeof value === "number" && Number.isFinite(value)) {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return "";
		return d.toISOString().slice(0, 10);
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
		const dots = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
		if (dots) {
			const [, dd, mm, yyyy] = dots;
			return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
		}
		const d = new Date(trimmed);
		if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
		return "";
	}
	if (typeof value === "object") {
		const o = value as {
			year?: number;
			monthValue?: number;
			month?: number | string;
			dayOfMonth?: number;
			day?: number;
		};
		const year = o.year;
		const day = o.dayOfMonth ?? o.day;
		let month: number | undefined =
			typeof o.monthValue === "number"
				? o.monthValue
				: typeof o.month === "number"
					? o.month
					: undefined;
		if (month == null && typeof o.month === "string") {
			const names = [
				"JANUARY",
				"FEBRUARY",
				"MARCH",
				"APRIL",
				"MAY",
				"JUNE",
				"JULY",
				"AUGUST",
				"SEPTEMBER",
				"OCTOBER",
				"NOVEMBER",
				"DECEMBER",
			];
			const idx = names.indexOf(o.month.toUpperCase());
			if (idx >= 0) month = idx + 1;
		}
		if (year != null && month != null && day != null) {
			return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
		}
	}
	return "";
};

/** Pick first usable date field from common API aliases. */
export const pickIsoDate = (...candidates: unknown[]): string => {
	for (const c of candidates) {
		const iso = toIsoDate(c);
		if (iso) return iso;
	}
	return "";
};

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
