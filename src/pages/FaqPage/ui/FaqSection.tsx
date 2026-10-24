import { FC, memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CollapseItem } from "@/shared/ui/CollapseItem";
import { StateBanner } from "@/shared/ui/StateBanner";
import styles from "./FaqSection.module.scss";

type FaqItem = {
	id: string;
	question: string;
	answer: string;
};

type FaqPayload = {
	items?: FaqItem[];
};

type Props = {
	title?: string;
};

const SKELETON_ROWS = 4;

export const FaqSection: FC<Props> = memo(({ title }) => {
	const { t, i18n } = useTranslation();
	const [items, setItems] = useState<FaqItem[]>([]);
	const [pending, setPending] = useState(true);
	const [error, setError] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	const sectionTitle = title ?? t("faq.sectionTitle");
	const lng = i18n.language?.startsWith("en") ? "en" : "ru";

	useEffect(() => {
		let cancelled = false;
		setPending(true);
		setError(false);

		void fetch(`/content/faq.${lng}.json`)
			.then((res) => {
				if (!res.ok) throw new Error("faq load failed");
				return res.json() as Promise<FaqPayload>;
			})
			.then((data) => {
				if (cancelled) return;
				const next = Array.isArray(data.items) ? data.items : [];
				setItems(next.filter((item) => item?.id && item.question && item.answer));
			})
			.catch(() => {
				if (!cancelled) {
					setItems([]);
					setError(true);
				}
			})
			.finally(() => {
				if (!cancelled) setPending(false);
			});

		return () => {
			cancelled = true;
		};
	}, [lng, reloadKey]);

	if (!pending && !error && items.length === 0) {
		return null;
	}

	return (
		<section id="faq" className={styles["page-faq"]} aria-labelledby="faq-title">
			<h2 id="faq-title" className={styles["page-faq__title"]}>
				{sectionTitle}
			</h2>

			{pending ? (
				<div className={styles["page-faq__skeleton"]} aria-busy="true" aria-label={t("states.loading")}>
					{Array.from({ length: SKELETON_ROWS }, (_, n) => (
						<div key={n} className={styles["page-faq__skeleton-row"]} />
					))}
				</div>
			) : null}

			{!pending && error ? (
				<StateBanner
					variant="error"
					title={t("faq.loadError")}
					actionLabel={t("states.errorRetry")}
					onAction={() => setReloadKey((k) => k + 1)}
				/>
			) : null}

			{!pending && !error && items.length > 0 ? (
				<div className={styles["page-faq__list"]}>
					{items.map((item) => (
						<CollapseItem key={item.id} label={item.question}>
							<p className={styles["page-faq__answer"]}>{item.answer}</p>
						</CollapseItem>
					))}
				</div>
			) : null}
		</section>
	);
});
