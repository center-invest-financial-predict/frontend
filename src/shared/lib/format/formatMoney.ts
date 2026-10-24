const nbsp = "\u00A0";

/** Formats amount in rubles: `−30 100 ₽`. */
export const formatMoney = (value: number, locale = "ru-RU"): string => {
	const abs = Math.abs(value);
	const formatted = abs.toLocaleString(locale, {
		maximumFractionDigits: 0,
	});
	const sign = value < 0 ? "−" : value > 0 ? "+" : "";
	return `${sign}${formatted}${nbsp}₽`;
};

/** Absolute money without forced `+` for positive values. */
export const formatMoneyAbs = (value: number, locale = "ru-RU"): string => {
	const formatted = Math.abs(value).toLocaleString(locale, {
		maximumFractionDigits: 0,
	});
	const sign = value < 0 ? "−" : "";
	return `${sign}${formatted}${nbsp}₽`;
};
