import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Page } from "@/widgets/Page";
import { Card } from "@/shared/ui/Card";
import { getRouteAdd } from "@/shared/consts/router";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./SourcesPage.module.scss";

const CONNS = [
	{ n: "Банк, Центр-инвест", x: "Счёт в банке, операции каждый день", on: true },
	{ n: "1С", x: "Учётная база, счета и акты", on: false },
	{ n: "Кассы", x: "Выручка по чекам", on: false },
	{ n: "Маркетплейсы", x: "Выплаты и удержания", on: false },
	{ n: "ЭДО", x: "Договоры и счета на оплату", on: true },
];

export const SourcesPage = memo(() => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [conn, setConn] = useState(CONNS);
	const [uploadOk, setUploadOk] = useState(false);

	return (
		<Page className={styles["sources-page"]}>
			<div>
				<h1 className={styles["sources-page__title"]}>{t("sources.title")}</h1>
				<p className={styles["sources-page__sub"]}>{t("sources.subtitle")}</p>
			</div>
			<div className={styles["sources-page__grid"]}>
				{conn.map((c, i) => (
					<Card key={c.n} className={styles["sources-page__card"]}>
						<span className={cn(styles["sources-page__st"], c.on && styles["sources-page__st--on"])}>
							{c.on ? t("sources.on") : t("sources.off")}
						</span>
						<div className={styles["sources-page__name"]}>{c.n}</div>
						<div className={styles["sources-page__desc"]}>{c.x}</div>
						<button
							type="button"
							className={cn(styles["sources-page__btn"], !c.on && styles["sources-page__btn--primary"])}
							onClick={() => setConn((prev) => prev.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
						>
							{c.on ? t("sources.disconnect") : t("sources.connect")}
						</button>
					</Card>
				))}
			</div>
			<Card className={styles["sources-page__upload"]}>
				<div>
					<div className={styles["sources-page__name"]}>{t("sources.uploadTitle")}</div>
					<p className={styles["sources-page__desc"]}>{t("sources.uploadHint")}</p>
				</div>
				<div className={styles["sources-page__upload-actions"]}>
					<label className={styles["sources-page__file-btn"]}>
						{t("sources.chooseFile")}
						<input
							type="file"
							accept=".csv,text/csv,text/plain"
							className={styles["sources-page__file"]}
							onChange={() => setUploadOk(true)}
						/>
					</label>
				</div>
				{uploadOk ? (
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
