import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useGetSourcesQuery, useToggleSourceMutation } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./SourcesPage.module.scss";

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const { data, isLoading, isError, refetch } = useGetSourcesQuery();
	const [toggleSource] = useToggleSourceMutation();

	return (
		<Page className={styles["sources-page"]}>
			<div>
				<h1 className={styles["sources-page__title"]}>{t("sources.title")}</h1>
				<p className={styles["sources-page__sub"]}>{t("sources.subtitle")}</p>
			</div>

			{isLoading ? <StateBanner variant="loading" title={t("states.loading")} /> : null}
			{isError ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			{data ? (
				<div className={styles["sources-page__grid"]}>
					{data.items.map((c) => (
						<Card key={c.id} className={styles["sources-page__card"]}>
							<span className={cn(styles["sources-page__st"], c.connected && styles["sources-page__st--on"])}>
								{c.connected ? t("sources.on") : t("sources.off")}
							</span>
							<div className={styles["sources-page__name"]}>{c.name}</div>
							<div className={styles["sources-page__desc"]}>{c.description}</div>
							<button
								type="button"
								className={cn(styles["sources-page__btn"], !c.connected && styles["sources-page__btn--primary"])}
								onClick={() => void toggleSource({ id: c.id, connected: !c.connected })}
							>
								{c.connected ? t("sources.disconnect") : t("sources.connect")}
							</button>
						</Card>
					))}
				</div>
			) : null}
		</Page>
	);
});

export default SourcesPage;
