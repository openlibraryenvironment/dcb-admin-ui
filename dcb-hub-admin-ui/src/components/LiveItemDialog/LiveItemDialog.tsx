import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
	Alert,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@mui/material";

import RequestReference from "@components/RequestReference/RequestReference";
import { useDcbRestClient } from "@hooks/useDcbRestClient";
import { requestReferenceOf } from "@helpers/requestReference";
import { type LiveItem, liveItemQuery } from "@/queryOptions/liveItem";

const FIELDS: (keyof LiveItem)[] = [
	"status",
	"rawStatus",
	"barcode",
	"localId",
	"bibId",
	"holdCount",
	"renewalCount",
	"renewable",
	"holdingId",
	"localRequestId",
];

/** What the item's own LMS says about it right now, asked once per opening. */
export default function LiveItemDialog({
	hostLmsCode,
	barcode,
	onClose,
}: {
	hostLmsCode: string;
	barcode: string;
	onClose: () => void;
}) {
	const { t } = useTranslation();
	const client = useDcbRestClient();
	const { data, isLoading, error } = useQuery(
		liveItemQuery(client, hostLmsCode, barcode),
	);
	const status = axios.isAxiosError(error) ? error.response?.status : undefined;
	const reference = error ? requestReferenceOf(error) : null;

	return (
		<Dialog open onClose={onClose} aria-labelledby="live-item-title">
			<DialogTitle id="live-item-title">
				{t("items.live_lookup.title", { barcode, hostLms: hostLmsCode })}
			</DialogTitle>
			<DialogContent>
				<div role="status" aria-live="polite">
					{isLoading ? (
						<CircularProgress aria-label={t("items.live_lookup.asking")} />
					) : error ? (
						<Alert severity={status === 404 ? "warning" : "error"}>
							{t(
								status === 404
									? "items.live_lookup.not_found"
									: status === 403
										? "items.live_lookup.forbidden"
										: "items.live_lookup.failed",
								{ barcode, hostLms: hostLmsCode },
							)}
							{status !== 404 && reference && (
								<RequestReference reference={reference} />
							)}
						</Alert>
					) : (
						<Table size="small" aria-labelledby="live-item-title">
							<TableBody>
								{FIELDS.filter((field) => data?.[field] !== undefined).map(
									(field) => (
										<TableRow key={field}>
											<TableCell component="th" scope="row">
												{t(`items.live_lookup.fields.${field}`)}
											</TableCell>
											<TableCell>
												{typeof data?.[field] === "boolean"
													? t(data[field] ? "ui.actions.yes" : "ui.actions.no")
													: String(data?.[field])}
											</TableCell>
										</TableRow>
									),
								)}
							</TableBody>
						</Table>
					)}
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} variant="contained">
					{t("ui.actions.close")}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
