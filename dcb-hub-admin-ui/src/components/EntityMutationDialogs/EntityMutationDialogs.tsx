import Confirmation from "@components/Confirmation/Confirmation";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import type { EntityMutationDialogProps } from "@hooks/useEntityMutation";

/**
 * Renders the confirmation prompt and result alert owned by `useEntityMutation`.
 * Spread the hook's `dialogProps` into it and the whole confirm/audit/alert
 * surface comes with it - which is the point: every page previously wired these
 * two components up by hand, and they drifted.
 */
export default function EntityMutationDialogs({
	open,
	action,
	entityName,
	editInformation,
	onConfirm,
	onClose,
	alert,
	onAlertClose,
}: EntityMutationDialogProps) {
	return (
		<>
			<Confirmation
				open={open}
				action={action}
				entityName={entityName}
				editInformation={editInformation}
				onConfirm={onConfirm}
				onClose={onClose}
			/>
			<TimedAlert
				open={alert.open}
				severityType={alert.severity}
				alertText={alert.text}
				alertTitle={alert.title}
				onCloseFunc={onAlertClose}
			/>
		</>
	);
}
