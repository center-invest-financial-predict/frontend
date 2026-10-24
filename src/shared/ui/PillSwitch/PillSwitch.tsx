import { cn } from "@/shared/lib/classNames/classNames";
import styles from "./PillSwitch.module.scss";

type Option<T extends string> = {
	value: T;
	label: string;
};

type Props<T extends string> = {
	value: T;
	options: Option<T>[];
	onChange: (value: T) => void;
};

export function PillSwitch<T extends string>({ value, options, onChange }: Props<T>) {
	return (
		<div className={styles["pill-switch"]}>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					className={cn(
						styles["pill-switch__option"],
						value === option.value && styles["pill-switch__option--active"],
					)}
					onClick={() => onChange(option.value)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
