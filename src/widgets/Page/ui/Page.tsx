import { FC, HTMLAttributes, ReactNode } from "react";
import styles from "./Page.module.scss";
import { cn } from "@/shared/lib/classNames/classNames";

interface Props extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
}

export const Page: FC<Props> = ({ children, className, ...rest }) => {
	return (
		<main className={cn(styles.page, className)} {...rest}>
			{children}
		</main>
	);
};
