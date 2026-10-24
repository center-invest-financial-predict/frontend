import { memo } from "react";
import { useTranslation } from "react-i18next";
import { PageTitle } from "@/shared/ui/PageTitle";
import styles from "./TodayHeader.module.scss";

export const TodayHeader = memo(() => {
	const { t } = useTranslation();

	return (
		<div className={styles["today-header"]}>
			<PageTitle>{t("today.title")}</PageTitle>
		</div>
	);
});
