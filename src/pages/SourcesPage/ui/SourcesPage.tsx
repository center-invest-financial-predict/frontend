import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGetSourcesQuery, useToggleSourceMutation, useUploadSourceFileMutation } from "@/entities/Finance";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { StateBanner } from "@/shared/ui/StateBanner";
import { getRouteAdd } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./SourcesPage.module.scss";

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch } = useGetSourcesQuery();
	const [toggleSource] = useToggleSourceMutation();
	const [uploadFile, { isSuccess: uploadOk, isLoading: uploading }] = useUploadSourceFileMutation();
	const [localOk, setLocalOk] = useState(false);

	const onFile = async (file: File | undefined) => {
		if (!file) return;
		const body = new FormData();
		body.append("file", file);
		try {
			await uploadFile(body).unwrap();
			setLocalOk(true);
		} catch {
			setLocalOk(false);
		}
	};

	return (
		<Page className={styles["sources-page"]}>
			<div>
				<h1 className={styles["sources-page__title"]}>{t("sources.title")}</h1>
				<p className={styles["sources-page__sub"]}>{t("sources.subtitle")}</p>
			</div>

			{isLoading ? <StateBanner variant="loading" title={t("states.loading")} /> : null}
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
					{data.items.map((c) => (
						<Card key={c.id} className={styles["sources-page__card"]}>
							<span className={cn(styles["sources-page__st"], c.connected && styles["sources-page__st--on"])}>
								{c.connected ? t("sources.on") : t("sources.off")}
							</span>
							<div className={styles["sources-page__name"]}>{c.name}</div>
							<div className={styles["sources-page__desc"]}>{c.description}</div>
							<button
								type="button"
								className={cn(styles["sources-page__btn"], !c.connected && styles["sources-page__btn--primary"])}
								onClick={() => void toggleSource({ id: c.id, connected: !c.connected })}
							>
								{c.connected ? t("sources.disconnect") : t("sources.connect")}
							</button>
						</Card>
					))}
				</div>
			) : null}

			<Card className={styles["sources-page__upload"]}>
				<div>
					<div className={styles["sources-page__name"]}>{t("sources.uploadTitle")}</div>
					<p className={styles["sources-page__desc"]}>{t("sources.uploadHint")}</p>
				</div>
				<div className={styles["sources-page__upload-actions"]}>
					<label className={styles["sources-page__file-btn"]}>
						{uploading ? t("states.loading") : t("sources.chooseFile")}
						<input
							type="file"
							accept=".csv,text/csv,text/plain"
							className={styles["sources-page__file"]}
							onChange={(e) => void onFile(e.target.files?.[0])}
						/>
					</label>
				</div>
				{uploadOk || localOk ? (
					<>
						<div className={styles["sources-page__ok"]}>{t("sources.uploadOk")}</div>
						<button type="button" className={cn(styles["sources-page__btn"], styles["sources-page__btn--primary"])}>
							{t("sources.uploadCta")}
						</button>
					</>
				) : null}
			</Card>
			<Card className={styles["sources-page__future"]}>
				<button
					type="button"
					className={cn(styles["sources-page__btn"], styles["sources-page__btn--primary"])}
					onClick={() => navigate(getRouteAdd())}
				>
					{t("sources.futureCta")}
				</button>
			</Card>
		</Page>
	);
});

export default SourcesPage;
