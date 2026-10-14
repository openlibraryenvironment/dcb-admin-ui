import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { createReferenceValueMapping } from "@mutations/createReferenceValueMapping";
import { mapAllTypes } from "@helpers/mapAllTypes";

/**
 * The fast path for the common case, and the only one for an ILS whose types cannot be
 * listed: every DCB patron type to one local patron type, every DCB item type to one
 * local item type. The rows are shown before anything is written.
 */
export default function MapAllTypes({
	hostLmsCode,
	onCreated,
}: {
	hostLmsCode: string;
	onCreated: (count: number) => void;
}) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const [localPatronType, setLocalPatronType] = useState("");
	const [localItemType, setLocalItemType] = useState("");

	const rows = mapAllTypes(hostLmsCode, localPatronType, localItemType);

	// One at a time: at most fourteen, and the server checks each against its own vocabulary
	const { mutate, isPending, isSuccess, error, reset } = useMutation({
		mutationFn: async () => {
			for (const row of rows) {
				await gqlClient.request(createReferenceValueMapping, {
					input: {
						...row,
						reason: "Initial setup",
						changeCategory: "New member",
					},
				});
			}
			return rows.length;
		},
		onSuccess: (count) => onCreated(count),
	});

	return (
		<Stack spacing={2} sx={{ width: "100%" }}>
			<Typography variant="h6" component="h3">
				{t("libraries.new.map_all_title")}
			</Typography>
			<Typography>{t("libraries.new.map_all_explanation")}</Typography>
			<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
				<TextField
					id="map-all-patron-type"
					label={t("libraries.new.map_all_patron_type")}
					value={localPatronType}
					onChange={(event) => {
						reset();
						setLocalPatronType(event.target.value);
					}}
					fullWidth
				/>
				<TextField
					id="map-all-item-type"
					label={t("libraries.new.map_all_item_type")}
					value={localItemType}
					onChange={(event) => {
						reset();
						setLocalItemType(event.target.value);
					}}
					fullWidth
				/>
			</Stack>

			{rows.length > 0 && (
				<Table size="small">
					<caption>
						{t("libraries.new.map_all_preview", { count: rows.length })}
					</caption>
					<TableHead>
						<TableRow>
							<TableCell>{t("libraries.new.map_all_category")}</TableCell>
							<TableCell>{t("libraries.new.map_all_dcb_value")}</TableCell>
							<TableCell>{t("libraries.new.map_all_local_value")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={`${row.fromCategory}-${row.fromValue}`}>
								<TableCell>{row.fromCategory}</TableCell>
								<TableCell>{row.fromValue}</TableCell>
								<TableCell>{row.toValue}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			<Button
				variant="contained"
				onClick={() => mutate()}
				disabled={rows.length === 0 || isPending || isSuccess}
				sx={{ alignSelf: "flex-start" }}
			>
				{t("libraries.new.map_all_create", { count: rows.length })}
			</Button>

			{isSuccess && (
				<Alert severity="success">
					{t("libraries.new.map_all_created", { count: rows.length })}
				</Alert>
			)}
			{error && (
				<Alert severity="error">
					{t("libraries.new.map_all_failed", { message: error.message })}
				</Alert>
			)}
		</Stack>
	);
}
