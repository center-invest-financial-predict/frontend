import { ChangeEvent, memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	useGetSourcesQuery,
	useSyncCompanyMutation,
	useUploadSourceFileMutation,
} from "@/entities/Finance";
import { DataSourceKind, useUserActions } from "@/entities/User";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { isApiUnreachableError, parseApiError } from "@/shared/api/parseApiError";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatIsoDateDots } from "@/shared/lib/format/formatDate";
import { useAppSelector } from "@/shared/lib/hooks";
import styles from "./SourcesPage.module.scss";

const SOURCE_CODES = ["ONE_C", "CSV", "GOS_SERVICE"] as const;
const TOGGLEABLE = new Set<string>(["ONE_C", "GOS_SERVICE"]);

const normalizeSourceCode = (value: string): string => {
	const raw = value.trim().toUpperCase().replace(/-/g, "_").replace(/\s+/g, "_");
	if (raw === "1C" || raw === "1С" || raw === "ONEC" || raw === "1_C") return "ONE_C";
	if (raw === "GOS" || raw === "GOSUSLUGI" || raw === "GOS_USLUGI") return "GOS_SERVICE";
	return raw;
};

const sourceLabel = (id: string, name: string, t: (key: string) => string): string => {
	const code = [id, name]
		.map(normalizeSourceCode)
		.find((v) => (SOURCE_CODES as readonly string[]).includes(v));
	if (code === "ONE_C") return t("sources.names.ONE_C");
	if (code === "CSV") return t("sources.names.CSV");
	if (code === "GOS_SERVICE") return t("sources.names.GOS_SERVICE");
	return name || id;
};

const isToggleable = (code: string): code is "ONE_C" | "GOS_SERVICE" => TOGGLEABLE.has(code);

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const fileRef = useRef<HTMLInputElement>(null);
	const profile = useAppSelector((state) => state.user.profile);
	const profileSources = profile?.sources ?? [];
	const { setProfile } = useUserActions();
	const chosenAtReg = useMemo(
		() => new Set(profileSources.map((s) => normalizeSourceCode(s))),
		[profileSources],
	);
	const { data, isLoading, isError, refetch } = useGetSourcesQuery();
	const [syncCompany, { isLoading: isSyncing }] = useSyncCompanyMutation();
	const [uploadSourceFile, uploadState] = useUploadSourceFileMutation();
	const [uploadMessage, setUploadMessage] = useState<string | null>(null);
	const [uploadOk, setUploadOk] = useState(false);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	useEffect(() => {
		if (!data || profile?.sources !== undefined) return;
		const seeded = data.items
			.map((c) => normalizeSourceCode(c.id || c.name))
			.filter((code): code is DataSourceKind =>
				isToggleable(code) &&
				Boolean(
					data.items.find((item) => normalizeSourceCode(item.id || item.name) === code)
						?.connected,
				),
			);
		if (!seeded.length) return;
		setProfile({
			...profile,
			sources: seeded,
		});
	}, [data, profile, setProfile]);

	const items = useMemo(() => {
		if (!data) return [];
		return data.items.map((c) => {
			const code = normalizeSourceCode(c.id || c.name);
			const connected =
				code === "CSV"
					? Boolean(c.connected || uploadOk)
					: isToggleable(code)
						? chosenAtReg.has(code)
						: Boolean(c.connected);
			return { ...c, id: code || c.id, connected };
		});
	}, [chosenAtReg, data, uploadOk]);

	const hasActive = items.some((c) => c.connected) || chosenAtReg.size > 0;

	const setSourceEnabled = (code: "ONE_C" | "GOS_SERVICE", enabled: boolean) => {
		const nextSources = enabled
			? (Array.from(new Set([...profileSources.map(normalizeSourceCode), code])) as DataSourceKind[])
			: profileSources.filter((s) => normalizeSourceCode(s) !== code);
		setProfile({
			...profile,
			sources: nextSources,
		});
	};

	const onConnect = async (code: "ONE_C" | "GOS_SERVICE") => {
		setActionError(null);
		setPendingId(code);
		try {
			setSourceEnabled(code, true);
			await syncCompany().unwrap();
			void refetch();
		} catch (err) {
			setSourceEnabled(code, false);
			setActionError(
				isApiUnreachableError(err)
					? t("states.apiUnreachable")
					: parseApiError(err, t("sources.connectFail")),
			);
		} finally {
			setPendingId(null);
		}
	};

	const onDisconnect = (code: "ONE_C" | "GOS_SERVICE") => {
		setActionError(null);
		setSourceEnabled(code, false);
	};

	const onCsvPick = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setUploadMessage(null);
		setUploadOk(false);
		const inn = (profile?.business?.inn || "").replace(/\D/g, "");
		if (!inn) {
			setUploadMessage(t("sources.uploadFail"));
			return;
		}
		const formData = new FormData();
		formData.append("file", file);
		try {
			const result = await uploadSourceFile({ formData, inn }).unwrap();
			if (result.inserted > 0) {
				setUploadOk(true);
				setUploadMessage(t("sources.uploadOkCount", { count: result.inserted }));
				if (!chosenAtReg.has("CSV")) {
					setProfile({
						...profile,
						sources: Array.from(
							new Set([...profileSources.map(normalizeSourceCode), "CSV"]),
						) as DataSourceKind[],
					});
				}
			} else {
				setUploadOk(false);
				setUploadMessage(
					t("sources.uploadEmpty", {
						invalid: result.invalid,
						skipped: result.skipped,
					}),
				);
			}
			void refetch();
		} catch (err) {
			setUploadMessage(
				isApiUnreachableError(err)
					? t("states.apiUnreachable")
					: parseApiError(err, t("sources.uploadFail")),
			);
		}
	};

	return (
		<Page className={styles["sources-page"]}>
			<div>
				<h1 className={styles["sources-page__title"]}>{t("sources.title")}</h1>
				<p className={styles["sources-page__sub"]}>
					{t(hasActive ? "sources.subtitleActive" : "sources.subtitle")}
				</p>
			</div>

			{isLoading ? <Skeleton variant="card" count={3} label={t("states.loading")} /> : null}
			{isError ? (
				<StateBanner
					variant="error"
					title={t("states.errorTitle")}
					hint={t("states.apiUnreachable")}
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
			) : null}

			{actionError ? (
				<div className={cn(styles["sources-page__ok"], styles["sources-page__ok--err"])} role="alert">
					{actionError}
				</div>
			) : null}

			{uploadMessage ? (
				<div
					className={cn(styles["sources-page__ok"], !uploadOk && styles["sources-page__ok--err"])}
					role="status"
				>
					{uploadMessage}
				</div>
			) : null}

			<input
				ref={fileRef}
				className={styles["sources-page__file"]}
				type="file"
				accept=".csv,text/csv,text/plain"
				tabIndex={-1}
				aria-hidden
				onChange={onCsvPick}
			/>

			{data ? (
				<div className={styles["sources-page__grid"]}>
					{items.map((c) => {
						const name = sourceLabel(c.id, c.name, t);
						const isCsv = c.id === "CSV";
						const toggleCode = isToggleable(c.id) ? c.id : null;
						const opsCount =
							c.operationCount ??
							(c.description !== "" ? Number(c.description) : Number.NaN);
						const desc =
							c.connected && Number.isFinite(opsCount)
								? t("sources.opsCount", { count: opsCount })
								: "";
						const lastSync =
							c.connected && c.lastDataDate
								? t("sources.lastSync", { date: formatIsoDateDots(c.lastDataDate) })
								: "";
						const busy = pendingId === c.id;

						return (
							<Card key={c.id} className={styles["sources-page__card"]}>
								<span
									className={cn(
										styles["sources-page__st"],
										c.connected && styles["sources-page__st--on"],
									)}
								>
									{c.connected ? t("sources.on") : t("sources.off")}
								</span>
								<div className={styles["sources-page__name"]}>{name}</div>
								{desc ? <div className={styles["sources-page__desc"]}>{desc}</div> : null}
								{lastSync ? (
									<div className={styles["sources-page__desc"]}>{lastSync}</div>
								) : c.connected && !isCsv ? (
									<p className={styles["sources-page__foot"]}>{t("sources.connectedHint")}</p>
								) : null}
								{toggleCode && c.connected ? (
									<button
										type="button"
										className={styles["sources-page__btn"]}
										disabled={busy}
										onClick={() => onDisconnect(toggleCode)}
									>
										{t("sources.disconnect")}
									</button>
								) : null}
								{toggleCode && !c.connected ? (
									<button
										type="button"
										className={cn(
											styles["sources-page__btn"],
											styles["sources-page__btn--primary"],
										)}
										disabled={busy || isSyncing}
										onClick={() => void onConnect(toggleCode)}
									>
										{busy ? t("sources.connecting") : t("sources.connect")}
									</button>
								) : null}
								{isCsv ? (
									<button
										type="button"
										className={cn(
											styles["sources-page__btn"],
											styles["sources-page__btn--primary"],
										)}
										disabled={uploadState.isLoading}
										onClick={() => fileRef.current?.click()}
									>
										{uploadState.isLoading ? t("sources.uploading") : t("sources.uploadAction")}
									</button>
								) : null}
							</Card>
						);
					})}
				</div>
			) : null}
		</Page>
	);
});

export default SourcesPage;
