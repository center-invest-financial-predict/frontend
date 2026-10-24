import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StubPage } from "@/pages/StubPage/ui/StubPage";

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	return <StubPage title={t("pages.sources.title")} description={t("pages.sources.desc")} />;
});
