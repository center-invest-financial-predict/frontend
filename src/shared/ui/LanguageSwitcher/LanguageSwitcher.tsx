import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { SITE_LOCALES, type SiteLocale } from "@/shared/config/site";
import { PillSwitch } from "@/shared/ui/PillSwitch";

const OPTIONS = SITE_LOCALES.map((value) => ({
	value,
	label: value.toUpperCase(),
}));

export const LanguageSwitcher: FC = memo(() => {
	const { t, i18n } = useTranslation();
	const raw = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
	const value: SiteLocale = raw === "ru" ? "ru" : "en";

	return (
		<div role="group" aria-label={t("header.language")}>
			<PillSwitch
				value={value}
				options={OPTIONS}
				onChange={(lng) => {
					void i18n.changeLanguage(lng);
				}}
			/>
		</div>
	);
});
