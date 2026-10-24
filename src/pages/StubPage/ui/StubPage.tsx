import { FC, memo } from "react";
import { Page } from "@/widgets/Page";
import { PageTitle } from "@/shared/ui/PageTitle";
import styles from "./StubPage.module.scss";

type Props = {
	title: string;
	description?: string;
};

export const StubPage: FC<Props> = memo(({ title, description }) => {
	return (
		<Page>
			<div className={styles["stub-page"]}>
				<PageTitle className={styles["stub-page__title"]} subtitle={description}>
					{title}
				</PageTitle>
			</div>
		</Page>
	);
});
