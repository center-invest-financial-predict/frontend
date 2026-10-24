import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./Badge.module.scss";

type BadgeVariant = "neutral" | "up" | "down" | "warning" | "green" | "danger";

type Props = HTMLAttributes<HTMLSpanElement> & {
	children: ReactNode;
	variant?: BadgeVariant;
};

export const Badge: FC<Props> = ({
	children,
	variant = "neutral",
	className,
	...rest
}) => {
	return (
		<span
			className={cn(
				styles.badge,
				variant !== "neutral" && styles[`badge--${variant}`],
				className,
			)}
			{...rest}
		>
			{children}
		</span>
	);
};
