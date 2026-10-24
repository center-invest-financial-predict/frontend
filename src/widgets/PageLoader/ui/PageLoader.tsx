import { FC } from "react";
import { Loader } from "@/shared/ui/Loader";
import styles from "./PageLoader.module.scss";

export const PageLoader: FC = () => {
	return (
		<div className={styles["page-loader"]}>
			<Loader />
		</div>
	);
};
