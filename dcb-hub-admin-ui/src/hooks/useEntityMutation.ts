import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { GridRowModel } from "@mui/x-data-grid-premium";

import { useGraphQLClient } from "@hooks/useGraphQLClient";
import { computeMutation } from "@helpers/computeMutation";
import {
	changedRowFields,
	readDeleteOutcome,
} from "@helpers/actions/entityMutationLogic";
import {
	ENTITY_REGISTRY,
	entityOwnsQueryKey,
	type EntityKey,
} from "@constants/entityRegistry";

interface AuditFields {
	reason: string;
	changeCategory: string;
	changeReferenceUrl: string;
}

interface DeleteRequest {
	id: string;
	/** Human-readable name, shown in the confirmation and the result alert. */
	name: string;
	/** Owning entity's id, for entities deleted from their parent (contacts). */
	ownerId?: string;
	/**
	 * Where to go once the record is gone. Set it when deleting the record the
	 * current page is about - the page has nothing left to show. Leave it unset
	 * for row deletes, where the grid stays put and shows a success alert.
	 */
	redirect?: string;
}

interface FormEditRequest {
	id: string;
	/** Only the fields that actually changed. */
	changedFields: Record<string, unknown>;
	name: string;
	/** Called with the server's response once the update has been persisted. */
	onSuccess?: (updated: any) => void;
	/**
	 * What the confirmation dialog shows. Defaults to the raw changed fields;
	 * pass a `formatChangedFields` result to get the old -> new comparison.
	 */
	changeSummary?: string | Record<string, any>;
	/**
	 * Replaces the generic "X has been updated" alert. For edits the user
	 * initiated as a specific act rather than a field change - enabling pickup,
	 * say - where "Location updated" is true but says nothing.
	 */
	successText?: string;
	errorText?: string;
}

/** A pending grid edit, held open until the user confirms or dismisses. */
interface PendingGridEdit {
	resolve: (row: GridRowModel) => void;
	reject: (error: unknown) => void;
	newRow: GridRowModel;
	oldRow: GridRowModel;
}

type Pending =
	| ({ kind: "gridEdit"; summary: string } & PendingGridEdit)
	| ({ kind: "formEdit" } & FormEditRequest)
	| ({ kind: "delete" } & DeleteRequest);

export interface AlertState {
	open: boolean;
	severity: "success" | "error";
	text: string | null;
	title: string | null;
}

/**
 * The single edit/delete mechanism for both data grids and details pages.
 *
 * Grids and details pages differ only in how the change is captured - a
 * deferred `processRowUpdate` promise versus a submitted form - so that is the
 * only thing they get separate entry points for. Everything after the user
 * confirms (build the input, mutate, invalidate, alert, navigate) is one code
 * path, driven by ENTITY_REGISTRY rather than by arguments at the call site.
 *
 * Invalidation is a key-prefix predicate, not a caller-supplied key list. A
 * list is what let deletes ship with no invalidation at all: the caller simply
 * did not pass one, and nothing could tell. Here it is not the caller's job.
 */
export function useEntityMutation(entity: EntityKey) {
	const { t } = useTranslation();
	const router = useRouter();
	const gqlClient = useGraphQLClient();
	const queryClient = useQueryClient();
	const definition = ENTITY_REGISTRY[entity];

	const [pending, setPending] = useState<Pending | null>(null);
	const [alert, setAlert] = useState<AlertState>({
		open: false,
		severity: "success",
		text: null,
		title: null,
	});

	const entityName = t(definition.nameKey);

	const { mutateAsync: runUpdate } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(definition.updateMutation ?? "", variables),
	});

	const { mutateAsync: runDelete } = useMutation({
		mutationFn: (variables: { input: any }) =>
			gqlClient.request<any>(definition.deleteMutation ?? "", variables),
	});

	/**
	 * Refresh every cached query this entity can appear in. Awaited, so a caller
	 * that navigates afterwards cannot land on a list still rendering the record
	 * it just deleted.
	 */
	const invalidate = useCallback(
		() =>
			queryClient.invalidateQueries({
				predicate: (query) => entityOwnsQueryKey(entity, query.queryKey),
			}),
		[queryClient, entity],
	);

	const succeed = useCallback(
		(messageKey: string, titleKey: string, name: string) =>
			setAlert({
				open: true,
				severity: "success",
				text: t(messageKey, { entity: entityName, name }),
				title: t(titleKey),
			}),
		[t, entityName],
	);

	const fail = useCallback(
		(messageKey: string, name: string) =>
			setAlert({
				open: true,
				severity: "error",
				text: t(messageKey, { entity: entityName, name }),
				title: t("ui.data_grid.error"),
			}),
		[t, entityName],
	);

	/**
	 * Grid entry point. Wire straight to `processRowUpdate`: the returned promise
	 * stays open while the confirmation dialog collects the audit fields, then
	 * resolves with the persisted row (or the original row if dismissed), which
	 * is what stops the grid showing an edit the server never accepted.
	 */
	const requestGridEdit = useCallback(
		(newRow: GridRowModel, oldRow: GridRowModel) =>
			new Promise<GridRowModel>((resolve, reject) => {
				const summary = computeMutation(newRow, oldRow);
				if (!summary) return resolve(oldRow);
				setPending({
					kind: "gridEdit",
					summary,
					resolve,
					reject,
					newRow,
					oldRow,
				});
			}),
		[],
	);

	/** Details-page entry point. Call from the form's submit handler. */
	const requestFormEdit = useCallback(
		(request: FormEditRequest) => setPending({ kind: "formEdit", ...request }),
		[],
	);

	/** Shared by both, and by the grids' row delete action. */
	const requestDelete = useCallback(
		(request: DeleteRequest) => setPending({ kind: "delete", ...request }),
		[],
	);

	const confirm = useCallback(
		async (
			reason: string,
			changeCategory: string,
			changeReferenceUrl: string,
		) => {
			if (!pending) return;
			const audit: AuditFields = { reason, changeCategory, changeReferenceUrl };

			if (pending.kind === "delete") {
				const { id, name, ownerId, redirect } = pending;
				try {
					const response = await runDelete({
						input: { ...definition.buildDeleteId(id, { ownerId }), ...audit },
					});
					const { success, message } = readDeleteOutcome(
						response,
						definition.deleteOperation,
					);
					if (!success) throw new Error(message ?? "Delete refused");

					// Invalidate BEFORE navigating: the destination list reads from the
					// same cache, so navigating first shows the deleted record until
					// something else happens to refetch.
					await invalidate();
					setPending(null);

					if (redirect) {
						router.navigate({ to: redirect });
						return;
					}
					succeed("ui.data_grid.delete_success", "ui.data_grid.deleted", name);
				} catch (error) {
					console.error(`Error deleting ${entity} ${name}:`, error);
					setPending(null);
					fail("ui.data_grid.delete_error", name);
				}
				return;
			}

			// Both edit paths converge here: the only difference is where the
			// changed fields come from and who needs telling afterwards.
			const isGridEdit = pending.kind === "gridEdit";
			const id = isGridEdit ? String(pending.newRow.id) : pending.id;
			const name = isGridEdit
				? String(pending.newRow.name ?? pending.newRow.id)
				: pending.name;
			const changedFields = isGridEdit
				? changedRowFields(pending.newRow, pending.oldRow)
				: pending.changedFields;

			const input = definition.normaliseUpdateFields
				? definition.normaliseUpdateFields(changedFields)
				: changedFields;

			try {
				const response = await runUpdate({
					input: { ...definition.buildUpdateId(id), ...input, ...audit },
				});
				const updated = definition.updateOperation
					? (response?.[definition.updateOperation] ?? response)
					: response;

				await invalidate();

				if (isGridEdit) {
					pending.resolve(updated);
				} else {
					pending.onSuccess?.(updated);
				}
				const successText = !isGridEdit ? pending.successText : undefined;
				setPending(null);
				if (successText) {
					setAlert({
						open: true,
						severity: "success",
						text: successText,
						title: t("ui.data_grid.updated"),
					});
				} else {
					succeed("ui.data_grid.edit_success", "ui.data_grid.updated", name);
				}
			} catch (error) {
				console.error(`Error updating ${entity} ${name}:`, error);
				if (isGridEdit) pending.reject(error);
				const errorText = !isGridEdit ? pending.errorText : undefined;
				setPending(null);
				if (errorText) {
					setAlert({
						open: true,
						severity: "error",
						text: errorText,
						title: t("ui.data_grid.error"),
					});
				} else {
					fail("ui.data_grid.edit_error", name);
				}
			}
		},
		[
			pending,
			definition,
			runDelete,
			runUpdate,
			invalidate,
			router,
			succeed,
			fail,
			entity,
			t,
		],
	);

	const cancel = useCallback(() => {
		// A dismissed grid edit must resolve with the ORIGINAL row. Leaving the
		// promise open freezes the row in edit mode for the rest of the session.
		if (pending?.kind === "gridEdit") pending.resolve(pending.oldRow);
		setPending(null);
	}, [pending]);

	const dialogProps = useMemo(
		() => ({
			open: pending !== null,
			action: (pending?.kind === "delete" ? "deletion" : "gridEdit") as
				"deletion" | "gridEdit",
			entityName:
				pending?.kind === "delete" || pending?.kind === "formEdit"
					? pending.name
					: entityName,
			editInformation:
				pending?.kind === "gridEdit"
					? pending.summary
					: pending?.kind === "formEdit"
						? (pending.changeSummary ?? pending.changedFields)
						: undefined,
			onConfirm: confirm,
			onClose: cancel,
			alert,
			onAlertClose: () => setAlert((current) => ({ ...current, open: false })),
		}),
		[pending, entityName, confirm, cancel, alert],
	);

	/**
	 * Ready-made PageContainer action for "delete the record this page is about".
	 * Nineteen library tabs each hand-rolled this; they now pass it straight
	 * through, so the label, the audit prompt and the invalidation cannot drift.
	 */
	const buildDeleteAction = useCallback(
		({
			id,
			name,
			redirect,
			ownerId,
			disabled,
			icon,
		}: DeleteRequest & { disabled?: boolean; icon?: ReactNode }) => ({
			key: "delete",
			onClick: () => requestDelete({ id, name, ownerId, redirect }),
			disabled,
			label: t("ui.data_grid.delete_entity", {
				entity: entityName.toLowerCase(),
			}),
			startIcon: icon,
		}),
		[requestDelete, t, entityName],
	);

	return {
		requestGridEdit,
		requestFormEdit,
		requestDelete,
		buildDeleteAction,
		dialogProps,
		invalidate,
	};
}

export type EntityMutationDialogProps = ReturnType<
	typeof useEntityMutation
>["dialogProps"];
