import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./SourcesPage.module.scss";

type Mode = "hand" | "file" | "conn";

const CONNS = [
	{ n: "Банк, Центр-инвест", x: "Счёт в банке, операции каждый день", on: true },
	{ n: "1С", x: "Учётная база, счета и акты", on: false },
	{ n: "Кассы", x: "Выручка по чекам", on: false },
	{ n: "Маркетплейсы", x: "Выплаты и удержания", on: false },
	{ n: "ЭДО", x: "Договоры и счета на оплату", on: true },
];

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const [params] = useSearchParams();
	const asSources = params.get("tab") === "conn";
	const [mode, setMode] = useState<Mode>(asSources ? "conn" : "hand");
	const [evType, setEvType] = useState<"in" | "out">("out");
	const [conn, setConn] = useState(CONNS);

	useEffect(() => {
		setMode(asSources ? "conn" : "hand");
	}, [asSources]);

	if (asSources || mode === "conn") {
		return (
			<Page className={styles["sources-page"]}>
				<div>
					<h1 className={styles["sources-page__title"]}>{t("sources.title")}</h1>
					<p className={styles["sources-page__sub"]}>{t("sources.subtitle")}</p>
				</div>
				<div className={styles["sources-page__grid"]}>
					{conn.map((c, i) => (
						<Card key={c.n} className={styles["sources-page__card"]}>
							<span
								className={cn(
									styles["sources-page__st"],
									c.on && styles["sources-page__st--on"],
								)}
							>
								{c.on ? t("sources.on") : t("sources.off")}
							</span>
							<div className={styles["sources-page__name"]}>{c.n}</div>
							<div className={styles["sources-page__desc"]}>{c.x}</div>
							<button
								type="button"
								className={cn(
									styles["sources-page__btn"],
									!c.on && styles["sources-page__btn--primary"],
								)}
								onClick={() =>
									setConn((prev) =>
										prev.map((x, j) => (j === i ? { ...x, on: !x.on } : x)),
									)
								}
							>
								{c.on ? t("sources.disconnect") : t("sources.connect")}
							</button>
						</Card>
					))}
				</div>
				<p className={styles["sources-page__foot"]}>{t("sources.foot")}</p>
			</Page>
		);
	}

	return (
		<Page className={styles["sources-page"]}>
			<div className={styles["sources-page__narrow"]}>
				<h1 className={styles["sources-page__title"]}>{t("add.titleShort")}</h1>
				<div className={styles["sources-page__seg"]}>
					{(
						[
							["hand", "add.tabManualShort"],
							["file", "add.tabFileShort"],
						] as const
					).map(([k, label]) => (
						<button
							key={k}
							type="button"
							className={cn(
								styles["sources-page__pill"],
								mode === k && styles["sources-page__pill--on"],
							)}
							onClick={() => setMode(k)}
						>
							{t(label)}
						</button>
					))}
				</div>

				{mode === "hand" ? (
					<Card className={styles["sources-page__form"]}>
						<div className={styles["sources-page__chips"]}>
							{(
								[
									["out", "add.typeOut"],
									["in", "add.typeIn"],
								] as const
							).map(([k, label]) => (
								<button
									key={k}
									type="button"
									className={cn(
										styles["sources-page__chip"],
										evType === k && styles["sources-page__chip--on"],
									)}
									onClick={() => setEvType(k)}
								>
									{t(label)}
								</button>
							))}
						</div>
						<label className={styles["sources-page__field"]}>
							{t("add.name")}
							<input className={styles["sources-page__input"]} placeholder={t("add.namePh")} />
						</label>
						<label className={styles["sources-page__field"]}>
							{t("add.amount")}
							<input className={styles["sources-page__input"]} placeholder="0" />
						</label>
						<label className={styles["sources-page__field"]}>
							{t("add.date")}
							<input className={styles["sources-page__input"]} type="date" defaultValue="2026-10-29" />
						</label>
						<label className={styles["sources-page__field"]}>
							{t("add.category")}
							<select className={styles["sources-page__input"]} defaultValue="Прочее">
								{["Продажи", "Поставщики", "Налоги", "Аренда", "Зарплата", "Кредит", "Прочее"].map(
									(c) => (
										<option key={c} value={c}>
											{c}
										</option>
									),
								)}
							</select>
						</label>
						<button type="button" className={styles["sources-page__submit"]}>
							{t("add.saveForecast")}
						</button>
					</Card>
				) : (
					<Card className={styles["sources-page__form"]}>
						<label className={styles["sources-page__drop"]}>
							<span className={styles["sources-page__drop-title"]}>{t("add.dropTitle")}</span>
							<span className={styles["sources-page__desc"]}>{t("add.dropHint")}</span>
							<input type="file" accept=".csv,text/csv" className={styles["sources-page__file"]} />
						</label>
						<button type="button" className={styles["sources-page__link"]}>
							{t("add.sample")}
						</button>
					</Card>
				)}
			</div>
		</Page>
	);
});

export default SourcesPage;
