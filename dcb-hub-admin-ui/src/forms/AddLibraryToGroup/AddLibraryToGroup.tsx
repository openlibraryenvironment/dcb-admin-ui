import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Autocomplete,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	TextField,
	Typography,
	Chip,
	Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import TimedAlert from "@components/TimedAlert/TimedAlert";
import { useGraphQLClient } from "@hooks/useGraphQLClient";

import { getGroupsSelection } from "@queries/getGroupsSelection";
import { getLibraries } from "@queries/getLibraries";
import { addLibraryToGroup } from "@mutations/addLibraryToGroup";

interface AddLibraryType {
	show: boolean;
	onClose: () => void;
	selectedLibraries?: { id: string; name: string }[]; //  prop to support bulk/row actions
}

export default function AddLibraryToGroup({
	show,
	onClose,
	selectedLibraries = [],
}: AddLibraryType) {
	const { t } = useTranslation();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();

	const [alert, setAlert] = useState({
		open: false,
		severity: "success",
		text: "",
	});

	const isBulkMode = selectedLibraries.length > 0;

	const validationSchema = Yup.object().shape({
		groupId: Yup.string().required(
			t("validation.required", { field: t("groups.name") }),
		),
		libraryId: Yup.string().when([], {
			is: () => !isBulkMode,
			then: (schema) =>
				schema.required(
					t("validation.required", { field: t("libraries.library") }),
				),
			otherwise: (schema) => schema.optional(),
		}),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid },
	} = useForm({
		resolver: yupResolver(validationSchema),
		mode: "onChange",
		defaultValues: { groupId: "", libraryId: "" },
	});

	// Only fetch libraries if we are NOT in bulk mode
	const { data: librariesData, isLoading: isLibrariesLoading } = useQuery({
		queryKey: ["librariesSelection"],
		queryFn: () =>
			gqlClient.request<any>(getLibraries, {
				order: "fullName",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
		enabled: !isBulkMode,
	});

	const { data: groupsData, isLoading: isGroupsLoading } = useQuery({
		queryKey: ["groupsSelection"],
		queryFn: () =>
			gqlClient.request<any>(getGroupsSelection, {
				order: "name",
				orderBy: "ASC",
				pageno: 0,
				pagesize: 1000,
				query: "",
			}),
	});

	const libraryOptions =
		librariesData?.libraries?.content?.map((item: any) => ({
			label: item.fullName,
			value: item.id,
		})) || [];
	const groupOptions =
		groupsData?.libraryGroups?.content?.map((item: any) => ({
			label: item.name,
			value: item.id,
		})) || [];

	const { mutateAsync: addLibraryMutation, isPending } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request(addLibraryToGroup, variables),
	});

	const onSubmit = async (data: any) => {
		try {
			const librariesToProcess = isBulkMode
				? selectedLibraries.map((l) => l.id)
				: [data.libraryId];

			// Execute all additions concurrently
			await Promise.all(
				librariesToProcess.map((libId) =>
					addLibraryMutation({
						input: { libraryGroup: data.groupId, library: libId },
					}),
				),
			);

			setAlert({
				open: true,
				severity: "success",
				text: t("libraries.alert_text_success"),
			});

			// Invalidate relevant queries to refresh grids
			queryClient.invalidateQueries({ queryKey: ["libraryGroups"] });
			queryClient.invalidateQueries({ queryKey: ["libraries"] });
			queryClient.invalidateQueries({ queryKey: ["libraries"] });
			queryClient.invalidateQueries({ queryKey: ["group", data.groupId] });

			setTimeout(() => {
				reset();
				onClose();
			}, 1000);
		} catch (error) {
			setAlert({
				open: true,
				severity: "error",
				text: t("libraries.error_adding_to_group"),
			});
			console.error(error);
		}
	};

	return (
		<>
			<Dialog open={show} onClose={onClose} fullWidth maxWidth="sm">
				<DialogTitle variant="modalTitle">
					{t("libraries.add_to_group")}
				</DialogTitle>
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
						color: "text.secondary",
					}}
				>
					<Close />
				</IconButton>
				<DialogContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<Stack spacing={3} direction="column" sx={{ mt: 1 }}>
							<Typography>{t("libraries.add_to_group_explanation")}</Typography>

							<Controller
								name="groupId"
								control={control}
								render={({ field }) => (
									<Autocomplete
										{...field}
										options={groupOptions}
										loading={isGroupsLoading}
										onChange={(_, newValue) =>
											field.onChange(newValue?.value || "")
										}
										value={
											groupOptions.find(
												(opt: any) => opt.value === field.value,
											) || null
										}
										isOptionEqualToValue={(option, value) =>
											option.value === value.value
										}
										renderInput={(params) => (
											<TextField
												{...params}
												required
												label={t("groups.name")}
												error={!!errors.groupId}
												helperText={errors.groupId?.message}
											/>
										)}
									/>
								)}
							/>

							{isBulkMode ? (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1 }}>
										{t("libraries.selected_libraries", {
											count: selectedLibraries.length,
										})}
									</Typography>
									<Box
										sx={{
											display: "flex",
											flexWrap: "wrap",
											gap: 1,
											maxHeight: 150,
											overflowY: "auto",
										}}
									>
										{selectedLibraries.map((lib) => (
											<Chip key={lib.id} label={lib.name} size="small" />
										))}
									</Box>
								</Box>
							) : (
								<Controller
									name="libraryId"
									control={control}
									render={({ field }) => (
										<Autocomplete
											{...field}
											options={libraryOptions}
											loading={isLibrariesLoading}
											onChange={(_, newValue) =>
												field.onChange(newValue?.value || "")
											}
											value={
												libraryOptions.find(
													(opt: any) => opt.value === field.value,
												) || null
											}
											isOptionEqualToValue={(option, value) =>
												option.value === value.value
											}
											renderInput={(params) => (
												<TextField
													{...params}
													required
													label={t("libraries.library")}
													error={!!errors.libraryId}
													helperText={errors.libraryId?.message}
												/>
											)}
										/>
									)}
								/>
							)}

							<Button
								type="submit"
								color="primary"
								variant="contained"
								disabled={!isValid || isPending}
							>
								{isPending
									? t("ui.actions.submitting")
									: t("ui.actions.submit")}
							</Button>
						</Stack>
					</form>
				</DialogContent>
			</Dialog>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				autoHideDuration={3000}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
			/>
		</>
	);
}
