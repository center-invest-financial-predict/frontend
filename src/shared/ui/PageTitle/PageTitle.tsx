import { FC, ReactNode } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./PageTitle.module.scss";

type Props = {
	children: ReactNode;
	subtitle?: ReactNode;
	className?: string;
	as?: "h1" | "h2";
};

export const PageTitle: FC<Props> = ({
	children,
	subtitle,
	className,
	as: Tag = "h1",
}) => {
	return (
		<>
			<Tag className={cn(styles["page-title"], className)}>{children}</Tag>
			{subtitle ? <p className={styles["page-title__sub"]}>{subtitle}</p> : null}
		</>
	);
};
