import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { PageTitle } from "@/shared/ui/PageTitle";

export const NotFoundPage = () => {
	const { t } = useTranslation();
	return (
		<Page>
			<PageTitle>{t("pages.notFound")}</PageTitle>
		</Page>
	);
};
