import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Alert,
	AlertTitle,
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Radio,
	RadioGroup,
} from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import SetupFooter from "@components/Setup/SetupFooter";
import { CustomLinkButton } from "@components/CustomLink/CustomLink";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import {
	consortiumBasicsQuery,
	readConsortiumPresence,
} from "@/queryOptions/consortium";
import { creatableHostLmsProfiles } from "@helpers/hostLmsClientConfig";
import {
	ilsKeyOf,
	type IlsKey,
	type NewLibrarySearch,
} from "@helpers/librarySetupFlow";

/** "Which system does this library use?" Every later question depends on the answer. */
export default function SystemChapter({
	search,
}: {
	search: NewLibrarySearch;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [ils, setIls] = useState<IlsKey | undefined>(search.ils);
	const [showError, setShowError] = useState(false);
	const firstOption = useRef<HTMLInputElement>(null);
	const { hasConsortium } = readConsortiumPresence(
		useQuery(consortiumBasicsQuery(useGraphQLClient())),
	);

	const options = creatableHostLmsProfiles()
		.map((profile) => ({
			key: ilsKeyOf(profile.lmsClientClass),
			labelKey: profile.labelKey,
		}))
		.filter(
			(option): option is { key: IlsKey; labelKey: string } =>
				option.key !== undefined,
		);
	const invalid = showError && !ils;

	const onContinue = () => {
		if (!ils) {
			setShowError(true);
			firstOption.current?.focus();
			return;
		}
		navigate({
			to: "/libraries/new/$step",
			params: { step: "connection" },
			// A different system cannot keep the one connected for the last
			search: ils === search.ils ? search : { ils },
		});
	};

	// A library joins a consortium, so without one there is nothing to add it to. Only a
	// definite "no" blocks: while the answer is pending this behaves normally.
	if (hasConsortium === false) {
		return (
			<Alert severity="warning">
				<AlertTitle>{t("consortium.new.required_title")}</AlertTitle>
				{t("consortium.new.required_body")}
				<CustomLinkButton
					to="/setup/$step"
					params={{ step: "consortium" }}
					variant="outlined"
					color="inherit"
					size="small"
					sx={{ display: "flex", mt: 2, width: "fit-content" }}
				>
					{t("consortium.new.title")}
				</CustomLinkButton>
			</Alert>
		);
	}

	return (
		<>
			<FormControl error={invalid} component="fieldset">
				<FormLabel component="legend" id="library-system-label">
					{t("libraries.setup.system.question")}
				</FormLabel>
				<RadioGroup
					aria-labelledby="library-system-label"
					aria-describedby={invalid ? "library-system-error" : undefined}
					aria-invalid={invalid || undefined}
					name="library-system"
					value={ils ?? ""}
					onChange={(event) => {
						setIls(event.target.value as IlsKey);
						setShowError(false);
					}}
				>
					{options.map((option, index) => (
						<FormControlLabel
							key={option.key}
							value={option.key}
							control={
								<Radio
									slotProps={
										index === 0 ? { input: { ref: firstOption } } : undefined
									}
								/>
							}
							label={t(option.labelKey)}
						/>
					))}
				</RadioGroup>
				{invalid && (
					<FormHelperText id="library-system-error">
						{t("libraries.setup.system.required")}
					</FormHelperText>
				)}
			</FormControl>

			<SetupFooter onContinue={onContinue} />
		</>
	);
}
