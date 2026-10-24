import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetOperationsQuery, useGetRegularOperationsQuery } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatDayMonth } from "@/shared/lib/format/formatDate";
import { formatMoney } from "@/shared/lib/format/formatMoney";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./OperationsPage.module.scss";

type Tab = "ops" | "reg";
type Dir = "all" | "in" | "out";

export const OperationsPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const [tab, setTab] = useState<Tab>("ops");
	const [dir, setDir] = useState<Dir>("all");
	const [cat, setCat] = useState("all");
	const [openReg, setOpenReg] = useState<string | null>(null);

	const { data, isLoading, isError, refetch } = useGetOperationsQuery({ dir, category: cat });
	const {
		data: regs = [],
		isLoading: regLoading,
		isError: regError,
		refetch: refetchReg,
	} = useGetRegularOperationsQuery(undefined, { skip: tab !== "reg" });

	return (
		<Page className={styles["ops-page"]}>
			<div>
				<h1 className={styles["ops-page__title"]}>{t("operations.title")}</h1>
				<p className={styles["ops-page__sub"]}>{t("operations.subtitle")}</p>
			</div>

			<div className={styles["ops-page__seg"]}>
				{(
					[
						["ops", "operations.tabOps"],
						["reg", "operations.tabReg"],
					] as const
				).map(([k, label]) => (
					<button
						key={k}
						type="button"
						className={cn(styles["ops-page__pill"], tab === k && styles["ops-page__pill--on"])}
						onClick={() => setTab(k)}
					>
						{t(label)}
					</button>
				))}
			</div>

			{tab === "reg" ? (
				regLoading ? (
					<Skeleton variant="row" count={4} label={t("states.loading")} />
				) : regError ? (
					<StateBanner
						variant="error"
						title={t("states.errorTitle")}
						actionLabel={t("states.errorRetry")}
						onAction={() => refetchReg()}
					/>
				) : (
					<Card className={styles["ops-page__reg"]}>
						<div className={styles["ops-page__card-title"]}>{t("operations.regTitle")}</div>
						<p className={styles["ops-page__hint"]}>{t("operations.regHint")}</p>
						{regs.map((r) => (
							<div key={r.id} className={styles["ops-page__reg-item"]}>
								<button
									type="button"
									className={styles["ops-page__reg-btn"]}
									onClick={() => setOpenReg((v) => (v === r.id ? null : r.id))}
								>
									<span>
										<span className={styles["ops-page__reg-name"]}>{r.name}</span>
										<span className={styles["ops-page__hint"]}>
											{r.direction === "in" ? t("events.dirIn") : t("events.dirOut")}, {r.category}
										</span>
									</span>
									<span>
										{r.period}
										<span className={styles["ops-page__hint"]}>
											{t("operations.next")}: {r.next}
										</span>
									</span>
									<span>{r.amountLabel}</span>
									<span className={cn(styles["ops-page__st"], r.needsReview && styles["ops-page__st--warn"])}>
										{r.status}
									</span>
								</button>
								{openReg === r.id ? (
									<div className={styles["ops-page__reg-detail"]}>{r.detail || t("operations.regDetail")}</div>
								) : null}
							</div>
						))}
					</Card>
				)
			) : isLoading ? (
				<Skeleton variant="row" count={6} label={t("states.loading")} />
			) : isError || !data ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : (
				<>
					<Card className={styles["ops-page__chart"]}>
						<div className={styles["ops-page__card-title"]}>{t("operations.balTitle")}</div>
						<p className={styles["ops-page__hint"]}>{t("operations.balSub")}</p>
						<CashflowChart
							series={{
								...data.balanceHistory,
								todayIndex: Math.max((data.balanceHistory.points?.length ?? 1) - 1, 0),
							}}
							showRisk={false}
						/>
					</Card>

					<Card className={styles["ops-page__list"]}>
						<div className={styles["ops-page__chips"]}>
							{(
								[
									["all", "operations.filterAll"],
									["in", "operations.filterIn"],
									["out", "operations.filterOut"],
								] as const
							).map(([k, label]) => (
								<button
									key={k}
									type="button"
									className={cn(styles["ops-page__chip"], dir === k && styles["ops-page__chip--on"])}
									onClick={() => setDir(k)}
								>
									{t(label)}
								</button>
							))}
						</div>
						<div className={styles["ops-page__chips"]}>
							<button
								type="button"
								className={cn(
									styles["ops-page__chip"],
									styles["ops-page__chip--sm"],
									cat === "all" && styles["ops-page__chip--on"],
								)}
								onClick={() => setCat("all")}
							>
								{t("operations.filterAll")}
							</button>
							{data.categories.map((c) => (
								<button
									key={c}
									type="button"
									className={cn(
										styles["ops-page__chip"],
										styles["ops-page__chip--sm"],
										cat === c && styles["ops-page__chip--on"],
									)}
									onClick={() => setCat(c)}
								>
									{c}
								</button>
							))}
						</div>
						<div className={styles["ops-page__kpis"]}>
							<div>
								<span>{t("operations.total")}</span>
								<b>{formatMoney(data.totals.total, locale)}</b>
							</div>
							<div>
								<span>{t("operations.in")}</span>
								<b>{formatMoney(data.totals.inflow, locale)}</b>
							</div>
							<div>
								<span>{t("operations.out")}</span>
								<b>{formatMoney(data.totals.outflow, locale)}</b>
							</div>
							<div>
								<span>{t("operations.count")}</span>
								<b>{data.totals.count}</b>
							</div>
						</div>
						<div className={styles["ops-page__tr-head"]}>
							<span>{t("operations.colDate")}</span>
							<span>{t("operations.colCp")}</span>
							<span>{t("operations.colCat")}</span>
							<span>{t("operations.colAmt")}</span>
						</div>
						{data.items.map((r) => (
							<div key={r.id} className={styles["ops-page__tr"]}>
								<span>{formatDayMonth(r.date, locale)}</span>
								<span>{r.name}</span>
								<span>{r.category}</span>
								<span className={r.amount > 0 ? styles["ops-page__in"] : undefined}>
									{formatMoney(r.amount, locale)}
								</span>
							</div>
						))}
					</Card>
				</>
			)}
		</Page>
	);
});

export default OperationsPage;
