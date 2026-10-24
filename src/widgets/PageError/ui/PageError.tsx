import { FC } from "react";
import { useTranslation } from "react-i18next";
import styles from "./PageError.module.scss";

export const PageError: FC = () => {
	const { t } = useTranslation();

	return (
		<div className={styles["page-error"]}>
			{t("pages.error")}
			<button
				type="button"
				className={styles["page-error__button"]}
				onClick={() => location.reload()}
			>
				{t("pages.reload")}
			</button>
		</div>
	);
};
