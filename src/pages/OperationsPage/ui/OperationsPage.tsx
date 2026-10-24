import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StubPage } from "@/pages/StubPage/ui/StubPage";

export const OperationsPage = memo(() => {
	const { t } = useTranslation();
	return (
		<StubPage title={t("pages.operations.title")} description={t("pages.operations.desc")} />
	);
});
