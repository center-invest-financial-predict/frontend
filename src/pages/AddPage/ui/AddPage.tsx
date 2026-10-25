import { FormEvent, memo, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import {
	useConfirmOperationsImportMutation,
	useCreateEventMutation,
	usePreviewOperationsImportMutation,
	usePreviewReceiptImportMutation,
	useUploadSourceFileMutation,
	type OperationImportDraftDto,
	type OperationImportPreviewDto,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { cn } from "@/shared/lib/classNames/classNames";
import { getActiveInn } from "@/shared/lib/companyInn";
import styles from "./AddPage.module.scss";

type Tab = "hand" | "file";

const CAT_IDS = ["sales", "suppliers", "taxes", "rent", "salary", "credit", "other"] as const;
type CatId = (typeof CAT_IDS)[number];
type ImportKind = "statement" | "receipt";
type EditableDraft = {
	rowNumber: number;
	selected: boolean;
	missingFields: string[];
	warnings: string[];
	operation: OperationImportDraftDto;
};

const valueFrom = (record: Record<string, unknown>, snake: string, camel: string): unknown =>
	record[snake] ?? record[camel];

const draftsFromPreview = (preview: OperationImportPreviewDto): EditableDraft[] =>
	preview.rows.map((row) => {
		const op = row.operation;
		const rawDirection = String(valueFrom(op, "direction", "direction") ?? "");
		const direction = /income|inflow|поступ/i.test(rawDirection) ? "Поступление" : "Списание";
		const operation: OperationImportDraftDto = {
			operationId: String(valueFrom(op, "operation_id", "operationId") ?? ""),
			operationDate: String(valueFrom(op, "operation_date", "operationDate") ?? ""),
			amount: String(valueFrom(op, "amount", "amount") ?? ""),
			direction,
			counterpartyInn: String(valueFrom(op, "counterparty_inn", "counterpartyInn") ?? ""),
			counterpartyName: String(valueFrom(op, "counterparty_name", "counterpartyName") ?? ""),
			paymentPurpose: String(valueFrom(op, "payment_purpose", "paymentPurpose") ?? ""),
			balanceEod: valueFrom(op, "balance_eod", "balanceEod") as string | number | null | undefined,
		};
		return { ...row, selected: row.readyForReview, operation };
	});

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
	const [importKind, setImportKind] = useState<ImportKind>("statement");
	const [drafts, setDrafts] = useState<EditableDraft[]>([]);
	const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
	const [fallbackFile, setFallbackFile] = useState<File | null>(null);

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
	const [previewOperations, { isLoading: previewingOperations }] = usePreviewOperationsImportMutation();
	const [previewReceipt, { isLoading: previewingReceipt }] = usePreviewReceiptImportMutation();
	const [confirmOperations, { isLoading: confirming }] = useConfirmOperationsImportMutation();
	const previewing = previewingOperations || previewingReceipt;

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
		setFallbackFile(file);
		try {
			const preview = importKind === "receipt"
				? await previewReceipt({ formData, inn }).unwrap()
				: await previewOperations({ formData, inn }).unwrap();
			setDrafts(draftsFromPreview(preview));
			setPreviewWarnings(preview.warnings ?? []);
		} catch {
			setError(true);
			setUploadMessage(t("add.mlUnavailable"));
		}
	};

	const updateDraft = (index: number, patch: Partial<OperationImportDraftDto> & { selected?: boolean }) => {
		setDrafts((current) => current.map((row, i) => i === index
			? { ...row, selected: patch.selected ?? row.selected, operation: { ...row.operation, ...patch } }
			: row));
	};

	const onConfirmImport = async () => {
		const inn = (getActiveInn() || "").replace(/\D/g, "");
		const accepted = drafts.filter((row) => row.selected && row.operation.operationDate && Number(row.operation.amount) > 0);
		if (!inn || accepted.length === 0) {
			setError(true);
			return;
		}
		setError(false);
		try {
			const result = await confirmOperations({ inn, operations: accepted.map((row) => row.operation) }).unwrap();
			setUploadOk(result.inserted > 0);
			setUploadMessage(t("add.confirmed", { inserted: result.inserted, duplicates: result.duplicates, invalid: result.invalid }));
			setDrafts([]);
			setPreviewWarnings([]);
		} catch {
			setError(true);
		}
	};

	const onLegacyFallback = async () => {
		if (!fallbackFile) return;
		const inn = (getActiveInn() || "").replace(/\D/g, "");
		const formData = new FormData();
		formData.append("file", fallbackFile);
		try {
			const result = await uploadSourceFile({ formData, inn }).unwrap();
			setUploadOk(result.inserted > 0);
			setUploadMessage(t("sources.uploadOkCount", { count: result.inserted }));
			setDrafts([]);
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
								setUploadMessage(null);
								setUploadOk(false);
							setDrafts([]);
							setPreviewWarnings([]);
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
						<div className={styles["add-page__chips"]}>
							{([ ["statement", "add.statement"], ["receipt", "add.receipt"] ] as const).map(([kind, label]) => (
								<button key={kind} type="button" className={cn(styles["add-page__chip"], importKind === kind && styles["add-page__chip--on"])} onClick={() => { setImportKind(kind); setDrafts([]); setUploadMessage(null); }}>
									{t(label)}
								</button>
							))}
						</div>
						<label className={styles["add-page__drop"]}>
							<span className={styles["add-page__drop-title"]}>{importKind === "receipt" ? t("add.receiptHint") : t("add.dropTitle")}</span>
							{previewing ? <span className={styles["add-page__drop-hint"]}>{t("states.loading")}</span> : null}
							<input type="file" accept={importKind === "receipt" ? "image/jpeg,image/png,image/webp" : ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"} className={styles["add-page__file"]} disabled={previewing || confirming || uploading} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
						</label>
						{previewWarnings.map((warning, index) => <StateBanner key={`${index}-${warning}`} variant="low" title={warning} />)}
						{drafts.length > 0 ? (
							<div className={styles["add-page__parsed"]}>
								<div className={styles["add-page__parsed-meta"]}>{t("add.reviewRows", { count: drafts.length })}</div>
								{drafts.map((row, index) => (
									<div className={styles["add-page__draft"]} key={`${row.rowNumber}-${index}`}>
										<label><input type="checkbox" checked={row.selected} onChange={(e) => updateDraft(index, { selected: e.target.checked })} /> {t("add.includeRow", { row: row.rowNumber })}</label>
										<input aria-label={t("add.date")} type="date" value={row.operation.operationDate} onChange={(e) => updateDraft(index, { operationDate: e.target.value })} />
										<input aria-label={t("add.amount")} inputMode="decimal" value={String(row.operation.amount)} onChange={(e) => updateDraft(index, { amount: e.target.value.replace(",", ".") })} />
										<select aria-label={t("add.direction")} value={row.operation.direction} onChange={(e) => updateDraft(index, { direction: e.target.value as OperationImportDraftDto["direction"] })}><option value="Поступление">{t("add.typeIn")}</option><option value="Списание">{t("add.typeOut")}</option></select>
										<input aria-label={t("add.name")} placeholder={t("add.name")} value={row.operation.counterpartyName ?? ""} onChange={(e) => updateDraft(index, { counterpartyName: e.target.value })} />
										<textarea aria-label={t("add.purpose")} placeholder={t("add.purpose")} value={row.operation.paymentPurpose ?? ""} onChange={(e) => updateDraft(index, { paymentPurpose: e.target.value })} />
										{row.missingFields.length > 0 || row.warnings.length > 0 ? <small>{[...row.missingFields, ...row.warnings].join(" · ")}</small> : null}
									</div>
								))}
								<button type="button" className={styles["add-page__submit"]} disabled={confirming || drafts.filter((row) => row.selected && row.operation.operationDate && Number(row.operation.amount) > 0).length === 0} onClick={() => void onConfirmImport()}>{confirming ? t("states.loading") : t("add.confirmImport")}</button>
							</div>
						) : null}
						{error ? <StateBanner variant="error" title={t("states.errorTitle")} /> : null}
						{uploadMessage ? (
							<div className={uploadOk ? styles["add-page__ok"] : styles["add-page__drop-hint"]}>
								{uploadMessage}
							</div>
						) : null}
						{fallbackFile && uploadMessage === t("add.mlUnavailable") && importKind === "statement" ? <button type="button" className={styles["add-page__link"]} disabled={uploading} onClick={() => void onLegacyFallback()}>{uploading ? t("states.loading") : t("add.legacyFallback")}</button> : null}
					</Card>
				)}
			</div>
		</Page>
	);
});

export default AddPage;
