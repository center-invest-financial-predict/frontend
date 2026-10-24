import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { ScreenHeader } from "@/shared/ui/ScreenHeader";
import { FaqSection } from "./FaqSection";
import styles from "./FaqPage.module.scss";

export const FaqPage = memo(() => {
	const { t } = useTranslation();

	return (
		<Page className={styles["faq-page"]}>
			<ScreenHeader title={t("faq.title")} subtitle={t("faq.subtitle")} />
			<FaqSection />
		</Page>
	);
});

export default FaqPage;
