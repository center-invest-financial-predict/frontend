import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useGetSourcesQuery, useSyncCompanyMutation } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./SourcesPage.module.scss";

const SOURCE_CODES = ["ONE_C", "CSV", "GOS_SERVICE"] as const;

const sourceLabel = (id: string, name: string, t: (key: string) => string): string => {
	const code = [id, name]
		.map((v) => v.trim().toUpperCase().replace(/-/g, "_"))
		.find((v) => (SOURCE_CODES as readonly string[]).includes(v));
	if (code === "ONE_C") return t("sources.names.ONE_C");
	if (code === "CSV") return t("sources.names.CSV");
	if (code === "GOS_SERVICE") return t("sources.names.GOS_SERVICE");
	return name || id;
};

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const { data, isLoading, isError, refetch } = useGetSourcesQuery();
	const [syncCompany, { isLoading: isSyncing }] = useSyncCompanyMutation();

	return (
		<Page className={styles["sources-page"]}>
			<div>
				<h1 className={styles["sources-page__title"]}>{t("sources.title")}</h1>
				<p className={styles["sources-page__sub"]}>{t("sources.subtitle")}</p>
			</div>

			{isLoading ? <Skeleton variant="card" count={3} label={t("states.loading")} /> : null}
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
					{data.items.map((c) => {
						const name = sourceLabel(c.id, c.name, t);
						const desc =
							c.description !== ""
								? t("sources.opsCount", { count: Number(c.description) || c.description })
								: "";
						return (
							<Card key={c.id} className={styles["sources-page__card"]}>
								<span className={cn(styles["sources-page__st"], c.connected && styles["sources-page__st--on"])}>
									{c.connected ? t("sources.on") : t("sources.off")}
								</span>
								<div className={styles["sources-page__name"]}>{name}</div>
								{desc ? <div className={styles["sources-page__desc"]}>{desc}</div> : null}
								<button
									type="button"
									className={cn(styles["sources-page__btn"], styles["sources-page__btn--primary"])}
									disabled={isSyncing}
									onClick={() => void syncCompany()}
								>
									{t("sources.sync")}
								</button>
							</Card>
						);
					})}
				</div>
			) : null}
		</Page>
	);
});

export default SourcesPage;
