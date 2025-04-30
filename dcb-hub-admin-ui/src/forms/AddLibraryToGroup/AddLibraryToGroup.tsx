import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	addLibraryToGroup,
	getGroupsSelection,
	getLibraries,
	getLibraryGroupById,
} from "src/queries/queries";
import { useMutation, useQuery } from "@apollo/client";
import * as Yup from "yup";
import {
	Autocomplete,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { Close } from "@mui/icons-material";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { Library } from "@models/Library";
import { Group } from "@models/Group";

interface AddLibrariesResponse {
	addLibraryToGroup: {
		id: string;
		library: {
			id: string;
			libraryCode: string;
			fullName: string;
		};
		libraryGroup: {
			id: string;
			code: string;
			name: string;
			type: string;
		};
	};
}

interface AddLibraryFormData {
	groupId: string;
	libraryId: string;
}

type AddLibraryType = {
	show: boolean;
	onClose: () => void;
};
type AutocompleteOption = {
	label: string;
	value: string;
};

export default function AddLibraryToGroup({ show, onClose }: AddLibraryType) {
	const { t } = useTranslation();
	const [alert, setAlert] = useState<{
		open: boolean;
		severity: "success" | "error";
		text: string | null;
	}>({
		open: false,
		severity: "success",
		text: null,
	});

	const validationSchema = Yup.object().shape({
		groupId: Yup.string().required(t("Group is required")),
		libraryId: Yup.string().required(t("Library is required")),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
	} = useForm<AddLibraryFormData>({
		defaultValues: {
			groupId: "",
			libraryId: "",
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const { data: libraries } = useQuery(getLibraries, {
		variables: {
			order: "fullName",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1000,
			query: "",
		},
	});

	const { data: groups } = useQuery(getGroupsSelection, {
		variables: {
			order: "name",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1000,
			query: "",
		},
	});
	const librariesData: Library[] = libraries?.libraries?.content;
	const groupsData: Group[] = groups?.libraryGroups?.content;
	const libraryOptions: AutocompleteOption[] =
		librariesData?.map((item: { fullName: string; id: string }) => ({
			label: item.fullName,
			value: item.id,
		})) || [];

	const groupOptions: AutocompleteOption[] =
		groupsData?.map((item: { name: string; id: string }) => ({
			label: item.name,
			value: item.id,
		})) || [];

	const [addLibraryMutation, { loading }] = useMutation<AddLibrariesResponse>(
		addLibraryToGroup,
		{
			refetchQueries: (mutationResult) => {
				const groupId =
					mutationResult?.data?.addLibraryToGroup?.libraryGroup?.id;
				return [
					{
						query: getLibraryGroupById,
						variables: { query: `id:${groupId}` },
					},
				];
			},
		},
	);

	const onSubmit = async (data: AddLibraryFormData) => {
		try {
			await addLibraryMutation({
				variables: {
					input: {
						libraryGroup: data.groupId,
						library: data.libraryId,
					},
				},
			});

			setAlert({
				open: true,
				severity: "success",
				text: t("libraries.alert_text_success"),
			});

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
			console.error(t("libraries.error_adding_to_group"), error);
		}
	};

	return (
		<>
			<Dialog
				open={show}
				onClose={onClose}
				aria-labelledby="new-group-modal"
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle id="form-dialog-title">
					{t("libraries.add_to_group")}
				</DialogTitle>
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: "absolute",
						right: 8,
						top: 8,
						color: (theme) => theme.palette.grey[500],
					}}
				>
					<Close />
				</IconButton>
				<DialogContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<Controller
							name="groupId"
							control={control}
							render={({ field: { onChange, value } }) => (
								<Autocomplete
									value={
										groupOptions.find((option) => option.value === value) ||
										null
									}
									onChange={(_, newValue: AutocompleteOption | null) => {
										onChange(newValue?.value || "");
									}}
									options={groupOptions}
									getOptionLabel={(option: AutocompleteOption) => option.label}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("groups.name")}
											error={!!errors.groupId}
											helperText={errors.groupId?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option.value === value.value
									}
								/>
							)}
						/>
						<Controller
							name="libraryId"
							control={control}
							render={({ field: { onChange, value } }) => (
								<Autocomplete
									value={
										libraryOptions.find((option) => option.value === value) ||
										null
									}
									onChange={(_, newValue: AutocompleteOption | null) => {
										onChange(newValue?.value || "");
									}}
									options={libraryOptions}
									getOptionLabel={(option: AutocompleteOption) => option.label}
									renderInput={(params) => (
										<TextField
											{...params}
											required
											label={t("libraries.library")}
											error={!!errors.libraryId}
											helperText={errors.libraryId?.message}
										/>
									)}
									isOptionEqualToValue={(option, value) =>
										option.value === value.value
									}
								/>
							)}
						/>
						<Button
							type="submit"
							color="primary"
							variant="contained"
							fullWidth
							disabled={!isValid || !isDirty || loading}
						>
							{loading ? t("ui.action.submitting") : t("general.submit")}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
			<TimedAlert
				severityType={alert.severity}
				open={alert.open}
				autoHideDuration={3000}
				onCloseFunc={() => setAlert({ ...alert, open: false })}
				alertText={alert.text || ""}
				key="add-library-alert"
			/>
		</>
	);
}

// export async function getStaticProps({ locale }: { locale: string }) {
// 	return {
// 		props: {
// 			...(await serverSideTranslations(locale, [
// 				"application",
// 				"common",
// 				"validation",
// 			])),
// 		},
// 	};
// }
