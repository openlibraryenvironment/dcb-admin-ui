import {
	Html,
	Head,
	Main,
	NextScript,
	DocumentProps,
	DocumentContext,
} from "next/document";
import {
	DocumentHeadTags,
	DocumentHeadTagsProps,
	documentGetInitialProps,
} from "@mui/material-nextjs/v13-pagesRouter";

export default function MyDocument(
	props: DocumentProps & DocumentHeadTagsProps,
) {
	return (
		<Html lang="en">
			<Head>
				<DocumentHeadTags {...props} />
				{/* PWA primary color */}
				<link rel="shortcut icon" href="/favicon.ico" />
				<meta name="emotion-insertion-point" content="" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
	const finalProps = await documentGetInitialProps(ctx);
	return finalProps;
};
