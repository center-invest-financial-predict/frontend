import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./Card.module.scss";

type Props = HTMLAttributes<HTMLElement> & {
	children: ReactNode;
	compact?: boolean;
	as?: "div" | "section" | "article";
};

export const Card: FC<Props> = ({
	children,
	compact,
	as: Tag = "div",
	className,
	...rest
}) => {
	return (
		<Tag
			className={cn(styles.card, compact && styles["card--compact"], className)}
			{...rest}
		>
			{children}
		</Tag>
	);
};
