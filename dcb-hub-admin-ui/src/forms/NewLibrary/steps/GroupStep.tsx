import { useMutation, useQuery } from "@apollo/client/react";
import { yupResolver } from "@hookform/resolvers/yup";
import {
	Autocomplete,
	Button,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { TFunction } from "next-i18next";
import * as Yup from "yup";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	addLibraryToGroup,
	getGroupsSelection,
	getLibraryGroupById,
} from "src/queries/queries";
import { Group } from "@models/Group";
import TimedAlert from "@components/TimedAlert/TimedAlert";

type GroupStepType = {
	libraryId: string;
	t: TFunction;
	handleClose: () => void;
};
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
type AutocompleteOption = {
	label: string;
	value: string;
};
export default function GroupStep({
	libraryId,
	t,
	handleClose,
}: GroupStepType) {
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
		libraryId: Yup.string().required(
			t("ui.validation.required", {
				field: t("groups.group_one"),
			}),
		),
	});

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isValid, isDirty },
	} = useForm<AddLibraryFormData>({
		defaultValues: {
			groupId: "",
			libraryId: libraryId,
		},
		resolver: yupResolver(validationSchema),
		mode: "onChange",
	});

	const { data: groups } = useQuery(getGroupsSelection, {
		variables: {
			order: "name",
			orderBy: "ASC",
			pageno: 0,
			pagesize: 1000,
			query: "",
		},
		errorPolicy: "all",
	});

	const groupsData: Group[] = groups?.libraryGroups?.content;

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
						library: libraryId,
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
				handleClose();
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
			<form onSubmit={handleSubmit(onSubmit)}>
				<Stack spacing={1} mb={2}>
					<Typography> {t("libraries.new.group_explanation")}</Typography>
					<Controller
						name="groupId"
						control={control}
						render={({ field: { onChange, value } }) => (
							<Autocomplete
								value={
									groupOptions.find((option) => option.value === value) || null
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
				</Stack>

				<Stack spacing={1} direction={"row"}>
					<Button variant="outlined" onClick={handleClose}>
						{t("libraries.new.close_no_group")}
					</Button>
					<div style={{ flex: "1 0 0" }} />
					<Button
						type="submit"
						color="primary"
						variant="contained"
						disabled={!isValid || !isDirty || loading}
					>
						{loading ? t("ui.action.submitting") : t("general.submit")}
					</Button>
				</Stack>
			</form>

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
