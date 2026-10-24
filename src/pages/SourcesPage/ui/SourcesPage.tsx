import { ChangeEvent, memo, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	useGetSourcesQuery,
	useSyncCompanyMutation,
	useUploadSourceFileMutation,
} from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { StateBanner } from "@/shared/ui/StateBanner";
import { parseApiError } from "@/shared/api/parseApiError";
import { cn } from "@/shared/lib/classNames/classNames";
import { formatIsoDateDots } from "@/shared/lib/format/formatDate";
import { useAppSelector } from "@/shared/lib/hooks";
import styles from "./SourcesPage.module.scss";

const SOURCE_CODES = ["ONE_C", "CSV", "GOS_SERVICE"] as const;

const normalizeSourceCode = (value: string): string =>
	value.trim().toUpperCase().replace(/-/g, "_");

const sourceLabel = (id: string, name: string, t: (key: string) => string): string => {
	const code = [id, name]
		.map(normalizeSourceCode)
		.find((v) => (SOURCE_CODES as readonly string[]).includes(v));
	if (code === "ONE_C") return t("sources.names.ONE_C");
	if (code === "CSV") return t("sources.names.CSV");
	if (code === "GOS_SERVICE") return t("sources.names.GOS_SERVICE");
	return name || id;
};

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const fileRef = useRef<HTMLInputElement>(null);
	const profileSources = useAppSelector((state) => state.user.profile?.sources ?? []);
	const chosenAtReg = useMemo(
		() => new Set(profileSources.map((s) => normalizeSourceCode(s))),
		[profileSources],
	);
	const { data, isLoading, isError, refetch } = useGetSourcesQuery();
	const [syncCompany, { isLoading: isSyncing }] = useSyncCompanyMutation();
	const [uploadSourceFile, uploadState] = useUploadSourceFileMutation();
	const [uploadMessage, setUploadMessage] = useState<string | null>(null);
	const [uploadOk, setUploadOk] = useState(false);

	const items = useMemo(() => {
		if (!data) return [];
		return data.items.map((c) => {
			const code = normalizeSourceCode(c.id || c.name);
			const connected = c.connected || chosenAtReg.has(code) || (uploadOk && code === "CSV");
			return { ...c, id: code || c.id, connected };
		});
	}, [chosenAtReg, data, uploadOk]);

	const hasActive = items.some((c) => c.connected) || chosenAtReg.size > 0;

	const onCsvPick = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setUploadMessage(null);
		setUploadOk(false);
		const body = new FormData();
		body.append("file", file);
		try {
			const result = await uploadSourceFile(body).unwrap();
			if (result.inserted > 0) {
				setUploadOk(true);
				setUploadMessage(t("sources.uploadOkCount", { count: result.inserted }));
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
			setUploadMessage(parseApiError(err, t("sources.uploadFail")));
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
					actionLabel={t("states.errorRetry")}
					onAction={() => refetch()}
				/>
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
						const opsCount =
							c.operationCount ??
							(c.description !== "" ? Number(c.description) : Number.NaN);
						const desc = Number.isFinite(opsCount)
							? t("sources.opsCount", { count: opsCount })
							: "";
						const lastSync = c.lastDataDate
							? t("sources.lastSync", { date: formatIsoDateDots(c.lastDataDate) })
							: "";
						const showConnect = !c.connected && !isCsv;
						const showUpload = isCsv;

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
								{showConnect ? (
									<button
										type="button"
										className={cn(
											styles["sources-page__btn"],
											styles["sources-page__btn--primary"],
										)}
										disabled={isSyncing}
										onClick={() => void syncCompany()}
									>
										{t("sources.connect")}
									</button>
								) : null}
								{showUpload ? (
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
