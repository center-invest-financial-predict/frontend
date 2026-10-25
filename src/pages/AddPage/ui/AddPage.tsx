import { FormEvent, memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { useCreateEventMutation, useUploadSourceFileMutation } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { parseApiError } from "@/shared/api/parseApiError";
import { getActiveInn } from "@/shared/lib/companyInn";
import styles from "./AddPage.module.scss";

type Tab = "hand" | "file";

const CAT_IDS = ["sales", "suppliers", "taxes", "rent", "salary", "credit", "other"] as const;
type CatId = (typeof CAT_IDS)[number];

/** Stable API values (legacy Russian labels stored on backend). */
const CAT_API: Record<CatId, string> = {
	sales: "Продажи",
	suppliers: "Поставщики",
	taxes: "Налоги",
	rent: "Аренда",
	salary: "Зарплата",
	credit: "Кредит",
	other: "Прочее",
};

export const AddPage = memo(() => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<Tab>("hand");
	const [evType, setEvType] = useState<"in" | "out">("out");
	const [name, setName] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [category, setCategory] = useState<CatId>("other");
	const [catOpen, setCatOpen] = useState(false);
	const catRef = useRef<HTMLDivElement>(null);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState(false);
	const [uploadMessage, setUploadMessage] = useState<string | null>(null);
	const [uploadOk, setUploadOk] = useState(false);

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
	const [uploadSourceFile, { isLoading: uploading }] = useUploadSourceFileMutation();

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
				category: CAT_API[category],
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
		setUploadMessage(null);
		setUploadOk(false);
		const inn = (getActiveInn() || "").replace(/\D/g, "");
		if (!inn) {
			setError(true);
			return;
		}
		const formData = new FormData();
		formData.append("file", file);
		try {
			const result = await uploadSourceFile({ formData, inn }).unwrap();
			setUploadOk(true);
			setError(false);
			setUploadMessage(
				result.inserted > 0
					? t("sources.uploadOkCount", { count: result.inserted })
					: result.duplicates > 0
						? t("sources.uploadOkDup", { count: result.duplicates })
						: t("sources.uploadOk"),
			);
		} catch (err) {
			setError(true);
			setUploadOk(false);
			setUploadMessage(parseApiError(err, t("sources.uploadFail")));
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
								setUploadMessage(null);
								setUploadOk(false);
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
									placeholder={t("add.amountPh")}
									inputMode="decimal"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
								/>
							</label>
							<label className={styles["add-page__field"]}>
								{t("add.date")}
								<input
									className={styles["add-page__input"]}
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value || date)}
								/>
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
									<span>{t(`add.cats.${category}`)}</span>
									<ChevronDown size={18} strokeWidth={1.5} aria-hidden />
								</button>
								{catOpen ? (
									<ul className={styles["add-page__select-list"]} role="listbox">
										{CAT_IDS.map((c) => (
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
													{t(`add.cats.${c}`)}
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
							<span className={styles["add-page__drop-hint"]}>{t("sources.uploadHint")}</span>
							{uploading ? (
								<span className={styles["add-page__drop-hint"]}>{t("sources.uploading")}</span>
							) : null}
							<input
								type="file"
								accept=".csv,text/csv,text/plain"
								className={styles["add-page__file"]}
								onChange={(e) => void onFile(e.target.files?.[0])}
							/>
						</label>
						{uploadMessage ? (
							<div
								className={cn(
									styles["add-page__ok"],
									!uploadOk && styles["add-page__drop-hint"],
								)}
							>
								{uploadMessage}
							</div>
						) : null}
						{error ? <StateBanner variant="error" title={t("states.errorTitle")} /> : null}
					</Card>
				)}
			</div>
		</Page>
	);
});

export default AddPage;
