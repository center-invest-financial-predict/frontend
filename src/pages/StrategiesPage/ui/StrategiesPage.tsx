import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StubPage } from "@/pages/StubPage/ui/StubPage";

export const StrategiesPage = memo(() => {
	const { t } = useTranslation();
	return (
		<StubPage title={t("pages.strategies.title")} description={t("pages.strategies.desc")} />
	);
});
