import { FormEvent, memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import {
	useConfirmParsedEventsMutation,
	useCreateEventMutation,
	useParseEventsFileMutation,
	type ParsedEventRowDto,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatDayMonth, formatIsoDateDots } from "@/shared/lib/format/formatDate";
import { formatMoney } from "@/shared/lib/format/formatMoney";
import styles from "./AddPage.module.scss";

type Tab = "hand" | "file";

const CATS = ["Продажи", "Поставщики", "Налоги", "Аренда", "Зарплата", "Кредит", "Прочее"] as const;

export const AddPage = memo(() => {
	const { t, i18n } = useTranslation();
	const locale = i18n.language?.startsWith("en") ? "en-US" : "ru-RU";
	const [tab, setTab] = useState<Tab>("hand");
	const [evType, setEvType] = useState<"in" | "out">("out");
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [category, setCategory] = useState<string>(CATS[CATS.length - 1]);
	const [catOpen, setCatOpen] = useState(false);
	const catRef = useRef<HTMLDivElement>(null);
	const [rows, setRows] = useState<ParsedEventRowDto[]>([]);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!catOpen) return;
		const onDoc = (e: MouseEvent) => {
			if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setCatOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, [catOpen]);

	const [createEvent, { isLoading: saving }] = useCreateEventMutation();
	const [parseFile, { isLoading: parsing }] = useParseEventsFileMutation();
	const [confirmParsed, { isLoading: confirming }] = useConfirmParsedEventsMutation();

	const onSaveHand = async (e: FormEvent) => {
		e.preventDefault();
		setError(false);
		const value = Number(amount.replace(/\s/g, "").replace(",", "."));
		if (!name.trim() || !Number.isFinite(value) || value <= 0) {
			setError(true);
			return;
		}
		try {
			await createEvent({
				direction: evType,
				name: name.trim(),
				amount: evType === "out" ? -Math.abs(value) : Math.abs(value),
				date,
				category,
			}).unwrap();
			setSaved(true);
		} catch {
			setError(true);
		}
	};

	const onFile = async (file: File | undefined) => {
		if (!file) return;
		setSaved(false);
		setError(false);
		const body = new FormData();
		body.append("file", file);
		try {
			const res = await parseFile(body).unwrap();
			setRows(res.rows);
		} catch {
			setError(true);
			setRows([]);
		}
	};

	const onConfirm = async () => {
		setError(false);
		try {
			await confirmParsed({ rows }).unwrap();
			setSaved(true);
		} catch {
			setError(true);
		}
	};

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
								setError(false);
							}}
						>
							{t(label)}
						</button>
					))}
				</div>

				{tab === "hand" ? (
					<Card className={styles["add-page__form"]}>
						<form onSubmit={(e) => void onSaveHand(e)}>
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
								<input
									className={styles["add-page__input"]}
									placeholder={t("add.namePh")}
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</label>
							<label className={styles["add-page__field"]}>
								{t("add.amount")}
								<input
									className={styles["add-page__input"]}
									placeholder="0"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
								/>
							</label>
							<label className={styles["add-page__field"]}>
								{t("add.date")}
								<span className={styles["add-page__date"]}>
									<span className={styles["add-page__date-value"]}>{formatIsoDateDots(date)}</span>
									<input
										className={styles["add-page__date-input"]}
										type="date"
										value={date}
										onChange={(e) => setDate(e.target.value)}
									/>
								</span>
							</label>
							<div className={styles["add-page__field"]} ref={catRef}>
								<span id="add-category-label">{t("add.category")}</span>
								<button
									type="button"
									className={cn(
										styles["add-page__select"],
										catOpen && styles["add-page__select--open"],
									)}
									aria-haspopup="listbox"
									aria-expanded={catOpen}
									aria-labelledby="add-category-label"
									onClick={() => setCatOpen((v) => !v)}
								>
									<span>{category}</span>
									<ChevronDown size={18} strokeWidth={1.5} aria-hidden />
								</button>
								{catOpen ? (
									<ul className={styles["add-page__select-list"]} role="listbox">
										{CATS.map((c) => (
											<li key={c} role="option" aria-selected={c === category}>
												<button
													type="button"
													className={cn(
														styles["add-page__select-option"],
														c === category && styles["add-page__select-option--on"],
													)}
													onClick={() => {
														setCategory(c);
														setCatOpen(false);
													}}
												>
													{c}
												</button>
											</li>
										))}
									</ul>
								) : null}
							</div>
							<button type="submit" className={styles["add-page__submit"]} disabled={saving}>
								{t("add.saveForecast")}
							</button>
							{error ? <StateBanner variant="error" title={t("states.errorTitle")} /> : null}
							{saved ? <div className={styles["add-page__ok"]}>{t("add.savedOk")}</div> : null}
						</form>
					</Card>
				) : (
					<Card className={styles["add-page__form"]}>
						<label className={styles["add-page__drop"]}>
							<span className={styles["add-page__drop-title"]}>{t("add.dropTitle")}</span>
							{parsing ? (
								<span className={styles["add-page__drop-hint"]}>{t("states.loading")}</span>
							) : null}
							<input
								type="file"
								accept=".csv,text/csv,text/plain"
								className={styles["add-page__file"]}
								onChange={(e) => void onFile(e.target.files?.[0])}
							/>
						</label>
						{rows.length > 0 ? (
							<div className={styles["add-page__parsed"]}>
								<div className={styles["add-page__parsed-meta"]}>
									{t("add.parsedMeta", { count: rows.length })}
								</div>
								{rows.map((r) => (
									<div key={`${r.date}-${r.name}-${r.amount}`} className={styles["add-page__parsed-row"]}>
										<span>{formatDayMonth(r.date, locale)}</span>
										<span className={styles["add-page__parsed-name"]}>{r.name}</span>
										<span className={styles["add-page__parsed-cat"]}>{r.category}</span>
										<b className={r.ok ? styles["add-page__parsed-amt--in"] : undefined}>
											{formatMoney(r.amount, locale)}
										</b>
									</div>
								))}
								<button
									type="button"
									className={styles["add-page__submit"]}
									disabled={confirming}
									onClick={() => void onConfirm()}
								>
									{t("add.saveForecast")}
								</button>
								{error ? <StateBanner variant="error" title={t("states.errorTitle")} /> : null}
								{saved ? <div className={styles["add-page__ok"]}>{t("add.savedOk")}</div> : null}
							</div>
						) : null}
						{error && rows.length === 0 ? (
							<StateBanner variant="error" title={t("states.errorTitle")} />
						) : null}
					</Card>
				)}
			</div>
		</Page>
	);
});

export default AddPage;
