import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import { CashflowChart } from "@/pages/TodayPage/ui/CashflowChart/CashflowChart";
import styles from "./OperationsPage.module.scss";

type Tab = "ops" | "reg";
type Dir = "all" | "in" | "out";

const OPS = [
	{ d: "23.10", n: "Эквайринг, выручка", a: 26000, cat: "Продажи" },
	{ d: "22.10", n: "Эквайринг, выручка", a: 26000, cat: "Продажи" },
	{ d: "21.10", n: "Поставщик молока", a: -42000, cat: "Поставщики" },
	{ d: "16.10", n: "Аванс", a: -120000, cat: "Зарплата" },
	{ d: "10.10", n: "Кредит", a: -96500, cat: "Кредит" },
	{ d: "05.10", n: "Зарплата", a: -248000, cat: "Зарплата" },
	{ d: "02.10", n: "Аренда", a: -180000, cat: "Аренда" },
	{ d: "01.10", n: "Эквайринг, выручка", a: 38000, cat: "Продажи" },
];

const REGS = [
	{
		n: "Эквайринг, выручка",
		dir: "Поступление",
		cat: "Продажи",
		per: "Каждый день",
		next: "Ежедневно",
		amt: "26 000 ₽ в будни",
		st: "Ожидаем по истории",
	},
	{
		n: "Аренда",
		dir: "Списание",
		cat: "Аренда",
		per: "Раз в месяц",
		next: "02.11",
		amt: "180 000 ₽",
		st: "Ожидаем по истории",
	},
	{
		n: "Зарплата",
		dir: "Списание",
		cat: "Зарплата",
		per: "Раз в месяц",
		next: "05.11",
		amt: "248 000 ₽",
		st: "Добавлено пользователем",
	},
	{
		n: "Поставщик зерна",
		dir: "Списание",
		cat: "Поставщики",
		per: "Примерно раз в месяц",
		next: "30.10",
		amt: "Суммы отличаются",
		st: "Требует проверки",
	},
];

const CATS = ["all", "Продажи", "Поставщики", "Налоги", "Аренда", "Зарплата", "Кредит", "Прочее"];

export const OperationsPage = memo(() => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<Tab>("ops");
	const [dir, setDir] = useState<Dir>("all");
	const [cat, setCat] = useState("all");
	const [openReg, setOpenReg] = useState<string | null>(null);

	const filtered = useMemo(
		() =>
			OPS.filter(
				(x) =>
					(dir === "all" || (dir === "in" && x.a > 0) || (dir === "out" && x.a < 0)) &&
					(cat === "all" || x.cat === cat),
			),
		[dir, cat],
	);

	const total = filtered.reduce((q, x) => q + x.a, 0);
	const inn = filtered.filter((x) => x.a > 0).reduce((q, x) => q + x.a, 0);
	const out = filtered.filter((x) => x.a < 0).reduce((q, x) => q + x.a, 0);

	const fm = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("ru-RU")} ₽`;

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
				<Card className={styles["ops-page__reg"]}>
					<div className={styles["ops-page__card-title"]}>{t("operations.regTitle")}</div>
					<p className={styles["ops-page__hint"]}>{t("operations.regHint")}</p>
					{REGS.map((r) => (
						<div key={r.n} className={styles["ops-page__reg-item"]}>
							<button
								type="button"
								className={styles["ops-page__reg-btn"]}
								onClick={() => setOpenReg((v) => (v === r.n ? null : r.n))}
							>
								<span>
									<span className={styles["ops-page__reg-name"]}>{r.n}</span>
									<span className={styles["ops-page__hint"]}>
										{r.dir}, {r.cat}
									</span>
								</span>
								<span>
									{r.per}
									<span className={styles["ops-page__hint"]}>
										{t("operations.next")}: {r.next}
									</span>
								</span>
								<span>{r.amt}</span>
								<span className={cn(styles["ops-page__st"], r.st.includes("проверки") && styles["ops-page__st--warn"])}>
									{r.st}
								</span>
							</button>
							{openReg === r.n ? (
								<div className={styles["ops-page__reg-detail"]}>{t("operations.regDetail")}</div>
							) : null}
						</div>
					))}
				</Card>
			) : (
				<>
					<Card className={styles["ops-page__chart"]}>
						<div className={styles["ops-page__card-title"]}>{t("operations.balTitle")}</div>
						<p className={styles["ops-page__hint"]}>{t("operations.balSub")}</p>
						<CashflowChart variant="history" />
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
							{CATS.map((c) => (
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
									{c === "all" ? t("operations.filterAll") : c}
								</button>
							))}
						</div>
						<div className={styles["ops-page__kpis"]}>
							<div>
								<span>{t("operations.total")}</span>
								<b>{fm(total)}</b>
							</div>
							<div>
								<span>{t("operations.in")}</span>
								<b>{fm(inn)}</b>
							</div>
							<div>
								<span>{t("operations.out")}</span>
								<b>{fm(out)}</b>
							</div>
							<div>
								<span>{t("operations.count")}</span>
								<b>{filtered.length}</b>
							</div>
						</div>
						<div className={styles["ops-page__tr-head"]}>
							<span>{t("operations.colDate")}</span>
							<span>{t("operations.colCp")}</span>
							<span>{t("operations.colCat")}</span>
							<span>{t("operations.colAmt")}</span>
						</div>
						{filtered.map((r) => (
							<div key={r.d + r.n + r.a} className={styles["ops-page__tr"]}>
								<span>{r.d}</span>
								<span>{r.n}</span>
								<span>{r.cat}</span>
								<span className={r.a > 0 ? styles["ops-page__in"] : undefined}>{fm(r.a)}</span>
							</div>
						))}
					</Card>
				</>
			)}
		</Page>
	);
});

export default OperationsPage;
