import { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./StateBanner.module.scss";

type Variant = "empty" | "loading" | "error" | "low";

type Props = {
	variant: Variant;
	title: string;
	hint?: string;
	actionLabel?: string;
	onAction?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
	children?: ReactNode;
	className?: string;
};

export const StateBanner: FC<Props> = ({ variant, title, hint, actionLabel, onAction, children, className }) => {
	return (
		<div className={cn(styles["state-banner"], styles[`state-banner--${variant}`], className)}>
			<div className={styles["state-banner__text"]}>
				<div className={styles["state-banner__title"]}>{title}</div>
				{hint ? <div className={styles["state-banner__hint"]}>{hint}</div> : null}
				{children}
			</div>
			{actionLabel && onAction ? (
				<button type="button" className={styles["state-banner__cta"]} onClick={onAction}>
					{actionLabel}
				</button>
			) : null}
		</div>
	);
};
