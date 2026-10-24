import { Business } from "@/entities/User";

export const DEMO_BUSINESSES: Business[] = [
	{
		inn: "6100123456",
		name: "ООО «Верста», кофейни",
		form: "ООО",
		tax: "УСН «доходы минус расходы»",
		city: "Ростов-на-Дону",
	},
	{
		inn: "6164301122",
		name: "ИП Крылова А. С., пекарня",
		form: "ИП",
		tax: "УСН «доходы»",
		city: "Ростов-на-Дону",
	},
	{
		inn: "6150078890",
		name: "ООО «Тихий порт», склад",
		form: "ООО",
		tax: "ОСНО",
		city: "Батайск",
	},
];

export const filterBusinesses = (query: string): Business[] => {
	const q = query.trim().toLowerCase();
	const digits = q.replace(/\D/g, "");
	const matched = DEMO_BUSINESSES.filter(
		(b) =>
			!q ||
			(digits && b.inn.startsWith(digits)) ||
			b.name.toLowerCase().includes(q),
	);
	if (digits && !matched.length) {
		return [
			{
				inn: digits,
				name: `Компания, ИНН ${digits}`,
				form: digits.length === 12 ? "ИП" : "ООО",
				tax: "УСН «доходы»",
				city: "Ростов-на-Дону",
			},
		];
	}
	return matched;
};
