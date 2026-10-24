import { FC, ReactNode, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./CollapseItem.module.scss";

type Props = {
	label: string;
	children: ReactNode;
	defaultOpen?: boolean;
	className?: string;
};

export const CollapseItem: FC<Props> = ({ label, children, defaultOpen = false, className }) => {
	const [open, setOpen] = useState(defaultOpen);
	const panelId = useId();
	const buttonId = useId();

	return (
		<div className={cn(styles["collapse-item"], open && styles["collapse-item--open"], className)}>
			<button
				type="button"
				id={buttonId}
				className={styles["collapse-item__trigger"]}
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((v) => !v)}
			>
				<span className={styles["collapse-item__label"]}>{label}</span>
				<ChevronDown
					className={styles["collapse-item__icon"]}
					size={18}
					strokeWidth={1.5}
					aria-hidden
				/>
			</button>
			<div
				id={panelId}
				role="region"
				aria-labelledby={buttonId}
				hidden={!open}
				className={styles["collapse-item__panel"]}
			>
				<div className={styles["collapse-item__body"]}>{children}</div>
			</div>
		</div>
	);
};
