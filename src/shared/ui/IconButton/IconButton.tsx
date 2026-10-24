import { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./IconButton.module.scss";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	children: ReactNode;
};

export const IconButton: FC<Props> = ({
	children,
	className,
	type = "button",
	title,
	"aria-label": ariaLabel,
	...rest
}) => {
	return (
		<button
			type={type}
			className={cn(styles["icon-button"], className)}
			title={title}
			aria-label={ariaLabel ?? title}
			{...rest}
		>
			{children}
		</button>
	);
};
