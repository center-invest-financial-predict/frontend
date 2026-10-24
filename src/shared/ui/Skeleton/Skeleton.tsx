import { FC } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./Skeleton.module.scss";

type Variant = "line" | "title" | "row" | "card" | "chart";

type Props = {
	variant?: Variant;
	count?: number;
	className?: string;
	label?: string;
};

export const Skeleton: FC<Props> = ({ variant = "line", count = 1, className, label }) => {
	const items = Array.from({ length: Math.max(1, count) }, (_, i) => (
		<div
			key={i}
			className={cn(styles.skeleton, styles[`skeleton--${variant}`], className)}
		/>
	));

	if (count <= 1) {
		return (
			<div className={styles["skeleton-wrap"]} aria-busy="true" aria-label={label}>
				{items}
			</div>
		);
	}

	return (
		<div
			className={cn(styles["skeleton-wrap"], styles["skeleton-wrap--stack"])}
			aria-busy="true"
			aria-label={label}
		>
			{items}
		</div>
	);
};
