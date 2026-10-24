import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StubPage } from "@/pages/StubPage/ui/StubPage";

export const AssistantPage = memo(() => {
	const { t } = useTranslation();
	return (
		<StubPage title={t("pages.assistant.title")} description={t("pages.assistant.desc")} />
	);
});
