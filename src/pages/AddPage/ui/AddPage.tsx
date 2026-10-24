import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./AddPage.module.scss";

type Tab = "hand" | "file";

const CATS = ["Продажи", "Поставщики", "Налоги", "Аренда", "Зарплата", "Кредит", "Прочее"] as const;

const SAMPLE_ROWS = [
	{ d: "29.10", n: "Оплата от Сити-Фуд", cat: "Продажи", a: "+120 000 ₽", ok: true },
	{ d: "02.11", n: "Аренда склада", cat: "Аренда", a: "−180 000 ₽", ok: false },
	{ d: "05.11", n: "Зарплата", cat: "Зарплата", a: "−248 000 ₽", ok: false },
];

export const AddPage = memo(() => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<Tab>("hand");
	const [evType, setEvType] = useState<"in" | "out">("out");
	const [parsed, setParsed] = useState(false);
	const [saved, setSaved] = useState(false);

	return (
		<Page className={styles["add-page"]}>
			<div>
				<h1 className={styles["add-page__title"]}>{t("add.titleShort")}</h1>
				<p className={styles["add-page__sub"]}>{t("add.subtitle")}</p>
			</div>

			<div className={styles["add-page__narrow"]}>
				<div className={styles["add-page__seg"]}>
					{(
						[
							["hand", "add.tabManualShort"],
							["file", "add.tabFileShort"],
						] as const
					).map(([k, label]) => (
						<button
							key={k}
							type="button"
							className={cn(styles["add-page__pill"], tab === k && styles["add-page__pill--on"])}
							onClick={() => {
								setTab(k);
								setSaved(false);
							}}
						>
							{t(label)}
						</button>
					))}
				</div>

				{tab === "hand" ? (
					<Card className={styles["add-page__form"]}>
						<div className={styles["add-page__chips"]}>
							{(
								[
									["out", "add.typeOut"],
									["in", "add.typeIn"],
								] as const
							).map(([k, label]) => (
								<button
									key={k}
									type="button"
									className={cn(styles["add-page__chip"], evType === k && styles["add-page__chip--on"])}
									onClick={() => setEvType(k)}
								>
									{t(label)}
								</button>
							))}
						</div>
						<label className={styles["add-page__field"]}>
							{t("add.name")}
							<input className={styles["add-page__input"]} placeholder={t("add.namePh")} />
						</label>
						<label className={styles["add-page__field"]}>
							{t("add.amount")}
							<input className={styles["add-page__input"]} placeholder="0" />
						</label>
						<label className={styles["add-page__field"]}>
							{t("add.date")}
							<input className={styles["add-page__input"]} type="date" defaultValue="2026-10-29" />
						</label>
						<label className={styles["add-page__field"]}>
							{t("add.category")}
							<select className={styles["add-page__input"]} defaultValue="Прочее">
								{CATS.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</select>
						</label>
						<button type="button" className={styles["add-page__submit"]} onClick={() => setSaved(true)}>
							{t("add.saveForecast")}
						</button>
						{saved ? <div className={styles["add-page__ok"]}>{t("add.savedOk")}</div> : null}
					</Card>
				) : (
					<Card className={styles["add-page__form"]}>
						<label className={styles["add-page__drop"]}>
							<span className={styles["add-page__drop-title"]}>{t("add.dropTitle")}</span>
							<span className={styles["add-page__drop-hint"]}>{t("add.dropHint")}</span>
							<input
								type="file"
								accept=".csv,text/csv,text/plain"
								className={styles["add-page__file"]}
								onChange={() => setParsed(true)}
							/>
						</label>
						{parsed ? (
							<div className={styles["add-page__parsed"]}>
								<div className={styles["add-page__parsed-meta"]}>
									{t("add.parsedMeta", { count: SAMPLE_ROWS.length })}
								</div>
								{SAMPLE_ROWS.map((r) => (
									<div key={r.n} className={styles["add-page__parsed-row"]}>
										<span>{r.d}</span>
										<span className={styles["add-page__parsed-name"]}>{r.n}</span>
										<span className={styles["add-page__parsed-cat"]}>{r.cat}</span>
										<b className={r.ok ? styles["add-page__parsed-amt--in"] : undefined}>{r.a}</b>
									</div>
								))}
								<button type="button" className={styles["add-page__submit"]} onClick={() => setSaved(true)}>
									{t("add.saveForecast")}
								</button>
								{saved ? <div className={styles["add-page__ok"]}>{t("add.savedOk")}</div> : null}
							</div>
						) : null}
					</Card>
				)}
			</div>
		</Page>
	);
});

export default AddPage;
