/**
 * What each ILS actually needs in its Host LMS client config.
 *
 * The wizard used to offer a bare JSON textarea, so the only way to learn that
 * Sierra needs `default-agency-code` and `page-size` was to submit and read the
 * 400 dcb-service threw back. This table is the same contract, stated up front:
 * it mirrors `HostLmsConfigValidator` (required / warned) and the
 * `HostLmsPropertyDefinition`s on each client, so the guided form can ask for
 * the right things and build the JSON itself.
 *
 * The JSON editor is still there for power users - this is what it should have
 * been generating.
 */

export const HOST_LMS_CLASSES = {
	alma: "org.olf.dcb.core.interaction.alma.AlmaHostLmsClient",
	polaris: "org.olf.dcb.core.interaction.polaris.PolarisLmsClient",
	folio: "org.olf.dcb.core.interaction.folio.ConsortialFolioHostLmsClient",
	koha: "org.olf.dcb.core.interaction.koha.KohaHostLmsClient",
	sierra: "org.olf.dcb.core.interaction.sierra.SierraLmsClient",
	foundation: "org.olf.dcb.core.interaction.foundation.FoundationClient",
	// Was `core.interaction.AbstractHostLmsClient`, which is abstract and could
	// never have been instantiated - a Host LMS recorded against it would have
	// had no working client at all. The concrete appliance client is this one.
	orsAppliance: "org.olf.dcb.request.lifecycle.ncip.ORSApplianceHostLMS",
} as const;

/**
 * `required` is enforced before the mutation is sent, because dcb-service will
 * reject it otherwise. `recommended` is not - either the backend only warns
 * (FOLIO's `folio-tenant`) or the client needs it at run time but creation
 * succeeds without it (Alma's virtual item codes). Saying "you will hit this
 * later" is more use than either blocking or staying silent.
 */
export type ClientConfigRequirement = "required" | "recommended" | "optional";

export type ClientConfigFieldType =
	| "text"
	| "url"
	| "secret"
	| "number"
	| "boolean"
	/** Comma-separated in the form, a JSON array of strings in the config. */
	| "stringList"
	/**
	 * A free-form object (Polaris' shelf location policy map). Edited as JSON
	 * text because the keys are the site's own local values - there is no fixed
	 * set of them to build a form from.
	 */
	| "jsonObject";

/**
 * A link appended to a field's helper text, for the values whose real
 * definition lives in the vendor's own documentation. Cheaper than paraphrasing
 * a code table into a one-line description and getting it subtly wrong.
 */
export interface ClientConfigDocs {
	url: string;
	labelKey: string;
}

export interface ClientConfigField {
	/**
	 * Path into the client config object. One segment for a top-level key,
	 * two for Polaris' nested `papi` / `services` / `item` objects. Doubles as
	 * the react-hook-form field name under `clientConfigFields`.
	 */
	path: string[];
	labelKey: string;
	/** One line saying what the value is and where to find it. */
	descriptionKey: string;
	requirement: ClientConfigRequirement;
	type: ClientConfigFieldType;
	placeholder?: string;
	docs?: ClientConfigDocs;
	/**
	 * Suspends `required` while this holds. `default-agency-code` is the only case:
	 * dcb-service rejects it outright on a shared system, so demanding it
	 * unconditionally made a shared Host LMS impossible to submit - the form would not
	 * let go without the key, and the server would not accept it with one.
	 */
	requiredUnless?: (values: any) => boolean;
}

export interface ClientConfigGroup {
	/** "" for the top-level fields, otherwise the nested object's key. */
	id: string;
	labelKey?: string;
	descriptionKey?: string;
	/**
	 * dcb-service checks the nested object exists at all, so an entirely empty
	 * group is a rejection waiting to happen.
	 */
	required: boolean;
	fields: ClientConfigField[];
}

/**
 * A client class this catalogue knows how to configure.
 *
 * The set of profiles here is exactly the set `HostLmsConfigValidator` accepts;
 * anything absent is rejected server-side with "Unsupported LMS Client Class",
 * so the picker offers these and nothing else.
 */
export interface HostLmsProfile {
	lmsClientClass: string;
	/** i18n key for the ILS name, as shown in the type dropdown. */
	labelKey: string;
	groups: ClientConfigGroup[];
}

const field = (
	path: string[],
	labelKey: string,
	descriptionKey: string,
	requirement: ClientConfigRequirement,
	type: ClientConfigFieldType = "text",
	placeholder?: string,
	docs?: ClientConfigDocs,
): ClientConfigField => ({
	path,
	labelKey,
	descriptionKey,
	requirement,
	type,
	placeholder,
	docs,
});

/**
 * Does this config declare a system hosting more than one participating library?
 *
 * Read from the form values rather than the built config because it has to answer
 * while the user is still typing, which is when `default-agency-code` stops being
 * required.
 */
const sharedSystemSet = (values: any): boolean =>
	values?.["shared-system"] === true || values?.["shared-system"] === "true";

/**
 * `default-agency-code`, in the six profiles where it means "the agency to assume
 * when a patron's home location does not map".
 *
 * One definition rather than six copies, because the conditional part is easy to
 * apply to five of them and forget on the sixth - and the failure mode of forgetting
 * is a shared system that cannot be created, with the form and the server each
 * blaming the other.
 *
 * ORS_APPLIANCE deliberately does not use this: there the key is the agency DCB
 * names in every NCIP party element, not a resolution fallback, and dcb-service
 * requires it whether the appliance is shared or not.
 */
const defaultAgencyCode = (): ClientConfigField => ({
	path: ["default-agency-code"],
	labelKey: "hostlms.config_fields.default_agency_code",
	descriptionKey: "hostlms.config_fields.default_agency_code_description",
	requirement: "required",
	type: "text",
	requiredUnless: sharedSystemSet,
});

/** Ex Libris' own developer documentation, linked from the Alma fields. */
const ALMA_API_DOCS: ClientConfigDocs = {
	url: "https://developers.exlibrisgroup.com/alma/apis/",
	labelKey: "hostlms.config_fields.alma_api_docs_link",
};

const ALMA_ITEM_POLICY_DOCS: ClientConfigDocs = {
	url: "https://developers.exlibrisgroup.com/alma/apis/docs/xsd/rest_item.xsd/?tags=POST",
	labelKey: "hostlms.config_fields.alma_item_docs_link",
};

/**
 * Keys every ILS understands, appended to each profile's top-level group by
 * `withSharedFields` rather than copied into all seven. `roles` in particular
 * is read from the client config regardless of ILS, so it belongs here and not
 * in one profile that happens to have an example of it.
 */
const SHARED_FIELDS: ClientConfigField[] = [
	field(
		["ingest"],
		"hostlms.config_fields.ingest",
		"hostlms.config_fields.ingest_description",
		"optional",
		"boolean",
	),
	field(
		["roles"],
		"hostlms.client_config.roles",
		"hostlms.config_fields.roles_description",
		"optional",
		"stringList",
		"CATALOGUE, CIRCULATION",
	),
	// Any ILS can host more than one participating library - one Koha with sixty
	// members, one Sierra shared by a participant and a non-participant - so this
	// is not a per-profile concern. Setting it disables the two shortcuts that
	// silently attribute a co-tenant's patrons or holdings to the wrong library:
	// `default-agency-code` and the `Location: *` wildcard mapping.
	field(
		["shared-system"],
		"hostlms.config_fields.shared_system",
		"hostlms.config_fields.shared_system_description",
		"optional",
		"boolean",
	),
	// Was on the Polaris profile alone, which is where it happened to be first used.
	// LocationToAgencyMappingService reads it for every ILS, and layering per-library
	// overrides over consortial defaults is how a shared system avoids repeating the
	// same mapping for each co-tenant - so Koha and Sierra need it at least as much.
	field(
		["contextHierarchy"],
		"hostlms.client_config.context_hierarchy",
		"hostlms.config_fields.context_hierarchy_description",
		"optional",
		"stringList",
		"SHARED-KOHA, MOBIUS, GLOBAL",
	),
];

const SIERRA: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.sierra,
	labelKey: "hostlms.names.sierra",
	groups: [
		{
			id: "",
			required: true,
			fields: [
				field(
					["base-url"],
					"hostlms.config_fields.base_url",
					"hostlms.config_fields.sierra_base_url_description",
					"required",
					"url",
					"https://sierra.example.org",
				),
				field(
					["key"],
					"hostlms.config_fields.sierra_key",
					"hostlms.config_fields.sierra_key_description",
					"required",
					"secret",
				),
				field(
					["secret"],
					"hostlms.config_fields.sierra_secret",
					"hostlms.config_fields.sierra_secret_description",
					"required",
					"secret",
				),
				defaultAgencyCode(),
				field(
					["page-size"],
					"hostlms.config_fields.page_size",
					"hostlms.config_fields.page_size_description",
					"required",
					"number",
					"100",
				),
				field(
					["patron-search-tag"],
					"hostlms.config_fields.patron_search_tag",
					"hostlms.config_fields.patron_search_tag_description",
					"optional",
				),
				field(
					["virtual-patron-pin"],
					"hostlms.config_fields.virtual_patron_pin",
					"hostlms.config_fields.virtual_patron_pin_description",
					"optional",
					"secret",
				),
				field(
					["get-holds-retry-attempts"],
					"hostlms.config_fields.get_holds_retry_attempts",
					"hostlms.config_fields.get_holds_retry_attempts_description",
					"optional",
					"number",
				),
				field(
					["place-hold-delay"],
					"hostlms.config_fields.place_hold_delay",
					"hostlms.config_fields.place_hold_delay_description",
					"optional",
					"number",
				),
				field(
					["get-hold-delay"],
					"hostlms.config_fields.get_hold_delay",
					"hostlms.config_fields.get_hold_delay_description",
					"optional",
					"number",
				),
			],
		},
	],
};

/**
 * Alma, split into the three things a consortium actually has to arrange:
 * the API credentials, the resource sharing library the items move through,
 * and the OAI-PMH harvest.
 *
 * The two URLs are not interchangeable and were previously described the wrong
 * way round. `alma-url` is what AlmaClientConfig hands to the API client - the
 * regional Ex Libris gateway. `base-url` is what OaiPmhIngestSource harvests
 * from - the institution's own Alma domain. Getting them the wrong way round
 * produces a Host LMS that pings and never ingests, or vice versa.
 *
 * There is no ingest source class to supply: CreateHostLmsDataFetcher derives
 * AlmaOaiPmhIngestSource from the client class on creation.
 */
const ALMA: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.alma,
	labelKey: "hostlms.names.alma",
	groups: [
		{
			// Heading only, so `required` stays false - none of these are nested.
			// The empty-id group is the harvesting one below, because that is
			// where `withSharedFields` appends the shared `ingest` toggle and it
			// belongs beside the OAI keys it governs.
			id: "almaConnection",
			labelKey: "hostlms.config_fields.alma_connection_group",
			descriptionKey: "hostlms.config_fields.alma_connection_group_description",
			required: false,
			fields: [
				field(
					["alma-url"],
					"hostlms.config_fields.alma_url",
					"hostlms.config_fields.alma_url_description",
					"required",
					"url",
					"https://api-na.hosted.exlibrisgroup.com",
					ALMA_API_DOCS,
				),
				field(
					["base-url"],
					"hostlms.config_fields.alma_base_url",
					"hostlms.config_fields.alma_base_url_description",
					"required",
					"url",
					"https://example.alma.exlibrisgroup.com",
				),
				field(
					["apikey"],
					"hostlms.config_fields.apikey",
					"hostlms.config_fields.alma_apikey_description",
					"required",
					"secret",
					undefined,
					ALMA_API_DOCS,
				),
				defaultAgencyCode(),
			],
		},
		{
			// A heading only - these are top-level keys, so the group must not be
			// forced into the config as a nested object.
			id: "almaResourceSharing",
			labelKey: "hostlms.config_fields.alma_resource_sharing_group",
			descriptionKey:
				"hostlms.config_fields.alma_resource_sharing_group_description",
			required: false,
			fields: [
				// Creation succeeds without these three, but AlmaClientConfig declares
				// them required, so the first real request will fail instead.
				field(
					["sharing-library-code"],
					"hostlms.config_fields.sharing_library_code",
					"hostlms.config_fields.alma_sharing_library_code_description",
					"recommended",
					"text",
					"RES_SHARE",
				),
				field(
					["virtual-item-library-code"],
					"hostlms.config_fields.virtual_item_library_code",
					"hostlms.config_fields.alma_virtual_item_library_code_description",
					"recommended",
				),
				field(
					["virtual-item-location-code"],
					"hostlms.config_fields.virtual_item_location_code",
					"hostlms.config_fields.alma_virtual_item_location_code_description",
					"recommended",
					"text",
					"OUT_RS_REQ",
				),
				// The support guide asks every Alma site for this up front, because
				// checkouts have to happen somewhere.
				field(
					["default-circ-desk-code"],
					"hostlms.config_fields.default_circ_desk_code",
					"hostlms.config_fields.alma_default_circ_desk_code_description",
					"recommended",
				),
				field(
					["pickup-circ-desk"],
					"hostlms.config_fields.pickup_circ_desk",
					"hostlms.config_fields.alma_pickup_circ_desk_description",
					"optional",
				),
				field(
					["item-policy"],
					"hostlms.config_fields.item_policy",
					"hostlms.config_fields.alma_item_policy_description",
					"optional",
					"text",
					undefined,
					ALMA_ITEM_POLICY_DOCS,
				),
				field(
					["shelf-location"],
					"hostlms.config_fields.shelf_location",
					"hostlms.config_fields.alma_shelf_location_description",
					"optional",
				),
				field(
					["user-identifier"],
					"hostlms.config_fields.user_identifier",
					"hostlms.config_fields.alma_user_identifier_description",
					"optional",
				),
			],
		},
		{
			id: "",
			labelKey: "hostlms.config_fields.alma_harvesting_group",
			descriptionKey: "hostlms.config_fields.alma_harvesting_group_description",
			required: false,
			fields: [
				// Required by HostLmsConfigValidator even though only the ingest
				// source reads it - it is what the OAI request path is built from.
				field(
					["institution-code"],
					"hostlms.config_fields.institution_code",
					"hostlms.config_fields.alma_institution_code_description",
					"required",
					"text",
					"01ABC_DEF",
				),
				field(
					["oai-set"],
					"hostlms.config_fields.oai_set",
					"hostlms.config_fields.alma_oai_set_description",
					"recommended",
				),
				// OaiPmhIngestSource calls .get() on this Optional, so a harvest
				// cannot even be constructed without it. Creation still succeeds,
				// which is exactly what "recommended" means here.
				field(
					["metadata-prefix"],
					"hostlms.config_fields.metadata_prefix",
					"hostlms.config_fields.alma_metadata_prefix_description",
					"recommended",
					"text",
					"marc21",
				),
			],
		},
	],
};

const FOLIO: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.folio,
	labelKey: "hostlms.names.folio",
	groups: [
		{
			id: "",
			required: true,
			fields: [
				field(
					["base-url"],
					"hostlms.config_fields.base_url",
					"hostlms.config_fields.folio_base_url_description",
					"required",
					"url",
					"https://okapi.example.org",
				),
				field(
					["apikey"],
					"hostlms.config_fields.apikey",
					"hostlms.config_fields.folio_apikey_description",
					"required",
					"secret",
				),
				defaultAgencyCode(),
				// dcb-service returns these two as creation warnings rather than
				// errors, so they are asked for but never block.
				field(
					["folio-tenant"],
					"hostlms.config_fields.folio_tenant",
					"hostlms.config_fields.folio_tenant_description",
					"recommended",
				),
				field(
					["user-base-url"],
					"hostlms.config_fields.user_base_url",
					"hostlms.config_fields.user_base_url_description",
					"recommended",
					"url",
				),
				field(
					["record-syntax"],
					"hostlms.config_fields.record_syntax",
					"hostlms.config_fields.record_syntax_description",
					"optional",
					"text",
					"marcxml",
				),
				field(
					["metadata-prefix"],
					"hostlms.config_fields.metadata_prefix",
					"hostlms.config_fields.metadata_prefix_description",
					"optional",
					"text",
					"marc21_withholdings",
				),
			],
		},
	],
};

const POLARIS: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.polaris,
	labelKey: "hostlms.names.polaris",
	groups: [
		{
			id: "",
			required: true,
			fields: [
				field(
					["base-url"],
					"hostlms.config_fields.base_url",
					"hostlms.config_fields.polaris_base_url_description",
					"required",
					"url",
				),
				field(
					["base-url-application-services"],
					"hostlms.config_fields.base_url_application_services",
					"hostlms.config_fields.base_url_application_services_description",
					"recommended",
					"url",
				),
				field(
					["access-id"],
					"hostlms.config_fields.access_id",
					"hostlms.config_fields.access_id_description",
					"required",
				),
				field(
					["access-key"],
					"hostlms.config_fields.access_key",
					"hostlms.config_fields.access_key_description",
					"required",
					"secret",
				),
				field(
					["domain-id"],
					"hostlms.config_fields.domain_id",
					"hostlms.config_fields.domain_id_description",
					"required",
				),
				field(
					["logon-branch-id"],
					"hostlms.config_fields.logon_branch_id",
					"hostlms.config_fields.logon_branch_id_description",
					"required",
				),
				field(
					["logon-user-id"],
					"hostlms.config_fields.logon_user_id",
					"hostlms.config_fields.logon_user_id_description",
					"required",
				),
				field(
					["staff-username"],
					"hostlms.config_fields.staff_username",
					"hostlms.config_fields.staff_username_description",
					"required",
				),
				field(
					["staff-password"],
					"hostlms.config_fields.staff_password",
					"hostlms.config_fields.staff_password_description",
					"required",
					"secret",
				),
				defaultAgencyCode(),
				// Everything below appears in real Polaris configurations but was
				// absent from this table, so the guided form silently dropped it on
				// anyone who switched out of the JSON editor.
				field(
					["page-size"],
					"hostlms.config_fields.page_size",
					"hostlms.config_fields.page_size_description",
					"optional",
					"number",
					"100",
				),
				field(
					["staff-ui"],
					"hostlms.config_fields.staff_ui",
					"hostlms.config_fields.staff_ui_description",
					"optional",
					"url",
				),
				// contextHierarchy is in SHARED_FIELDS - every ILS reads it, not just this one.
				// dcb-service warns when this is absent and falls back to defaults.
				// The keys are the site's own shelf location names, so there is no
				// fixed set of inputs to offer - it is edited as an object.
				field(
					["shelfLocationPolicyMap"],
					"hostlms.config_fields.shelf_location_policy_map",
					"hostlms.config_fields.shelf_location_policy_map_description",
					"recommended",
					"jsonObject",
					'{"Reference Desk": "REFERENCE", "Interlibrary Loan": "NO_LEND"}',
				),
				field(
					["use-new-bib-chunk-ingest"],
					"hostlms.config_fields.use_new_bib_chunk_ingest",
					"hostlms.config_fields.use_new_bib_chunk_ingest_description",
					"optional",
					"boolean",
				),
			],
		},
		{
			id: "papi",
			labelKey: "hostlms.client_config.papi",
			descriptionKey: "hostlms.config_fields.papi_description",
			required: true,
			fields: [
				field(
					["papi", "app-id"],
					"hostlms.client_config.papi_app_id",
					"hostlms.config_fields.papi_app_id_description",
					"recommended",
				),
				field(
					["papi", "org-id"],
					"hostlms.client_config.papi_org_id",
					"hostlms.config_fields.papi_org_id_description",
					"recommended",
				),
				field(
					["papi", "lang-id"],
					"hostlms.client_config.papi_lang_id",
					"hostlms.config_fields.papi_lang_id_description",
					"recommended",
				),
				field(
					["papi", "papi-version"],
					"hostlms.client_config.papi_version",
					"hostlms.config_fields.papi_version_description",
					"recommended",
				),
			],
		},
		{
			id: "services",
			labelKey: "hostlms.client_config.services",
			descriptionKey: "hostlms.config_fields.services_description",
			required: true,
			fields: [
				field(
					["services", "organisation-id"],
					"hostlms.client_config.services_organisation_id",
					"hostlms.config_fields.services_organisation_id_description",
					"recommended",
				),
				field(
					["services", "site-domain"],
					"hostlms.client_config.services_site_domain",
					"hostlms.config_fields.services_site_domain_description",
					"recommended",
				),
				field(
					["services", "workstation-id"],
					"hostlms.client_config.services_workstation_id",
					"hostlms.config_fields.services_workstation_id_description",
					"recommended",
				),
				field(
					["services", "product-id"],
					"hostlms.client_config.services_product_id",
					"hostlms.config_fields.services_product_id_description",
					"optional",
				),
				field(
					["services", "patron-barcode-prefix"],
					"hostlms.client_config.services_patron_barcode_prefix",
					"hostlms.config_fields.services_patron_barcode_prefix_description",
					"optional",
				),
				field(
					["services", "services-version"],
					"hostlms.client_config.services_version",
					"hostlms.config_fields.services_version_description",
					"optional",
				),
				field(
					["services", "language"],
					"hostlms.client_config.services_language",
					"hostlms.config_fields.services_language_description",
					"optional",
				),
			],
		},
		{
			id: "item",
			labelKey: "hostlms.client_config.item",
			descriptionKey: "hostlms.config_fields.item_description",
			required: true,
			fields: [
				field(
					["item", "barcode-prefix"],
					"hostlms.client_config.barcode_prefix",
					"hostlms.config_fields.barcode_prefix_description",
					"recommended",
				),
				field(
					["item", "ill-location-id"],
					"hostlms.client_config.ill_location_id",
					"hostlms.config_fields.ill_location_id_description",
					"recommended",
				),
				field(
					["item", "fine-code-id"],
					"hostlms.client_config.fine",
					"hostlms.config_fields.fine_code_id_description",
					"optional",
				),
				// Text, not number. PolarisConfig.ItemConfig declares every one of
				// these as `Object` and coerces String<->Integer on read, and real
				// configurations mix the two - so typing it as a number here would
				// rewrite a working config's "2" into 2 for no gain.
				field(
					["item", "renewal-limit"],
					"hostlms.client_config.renewal_limit",
					"hostlms.config_fields.renewal_limit_description",
					"optional",
				),
				field(
					["item", "history-action-id"],
					"hostlms.client_config.history_action_id",
					"hostlms.config_fields.history_action_id_description",
					"optional",
				),
				field(
					["item", "shelving-scheme-id"],
					"hostlms.client_config.shelving_scheme_id",
					"hostlms.config_fields.shelving_scheme_id_description",
					"optional",
				),
				field(
					["item", "loan-period-code-id"],
					"hostlms.client_config.loan_id",
					"hostlms.config_fields.loan_period_code_id_description",
					"optional",
				),
				field(
					["item", "av-loan-period-code-id"],
					"hostlms.config_fields.av_loan_period_code_id",
					"hostlms.config_fields.av_loan_period_code_id_description",
					"optional",
				),
				field(
					["item", "av-renewal-limit"],
					"hostlms.config_fields.renewal_limit_av",
					"hostlms.config_fields.renewal_limit_av_description",
					"optional",
				),
			],
		},
	],
};

/**
 * Koha authenticates against its REST API with an OAuth client credential pair, and
 * needs somewhere to put the virtual items DCB creates. Each of these is declared
 * required by KohaClientConfig, so a Host LMS missing any of them fails on its first
 * real request rather than at creation - which is why HostLmsConfigValidator demands
 * them up front.
 *
 * Note the URL key is `api-url`, not `base-url` as everywhere else. It is also what
 * DCB derives Koha's system identity from, so two Host LMS records pointing at one
 * Koha are recognised as one system.
 */
const KOHA: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.koha,
	labelKey: "hostlms.names.koha",
	groups: [
		{
			id: "",
			required: true,
			fields: [
				field(
					["api-url"],
					"hostlms.config_fields.koha_api_url",
					"hostlms.config_fields.koha_api_url_description",
					"required",
					"url",
					"https://koha.example.org/api/v1",
				),
				field(
					["client_id"],
					"hostlms.config_fields.koha_client_id",
					"hostlms.config_fields.koha_client_id_description",
					"required",
					"secret",
				),
				field(
					["client_secret"],
					"hostlms.config_fields.koha_client_secret",
					"hostlms.config_fields.koha_client_secret_description",
					"required",
					"secret",
				),
				defaultAgencyCode(),
				field(
					["sharing-library-code"],
					"hostlms.config_fields.sharing_library_code",
					"hostlms.config_fields.koha_sharing_library_code_description",
					"required",
				),
				field(
					["virtual-item-library-code"],
					"hostlms.config_fields.virtual_item_library_code",
					"hostlms.config_fields.virtual_item_library_code_description",
					"required",
				),
				// No virtual-item-location-code. KohaHostLmsClient.createItem sets
				// home_library_id and holding_library_id and nothing else - a shelving
				// location was never sent - so this was required configuration that no
				// code path read. Alma still has one; that adapter does use it.
				field(
					["page-size"],
					"hostlms.config_fields.page_size",
					"hostlms.config_fields.page_size_description",
					"recommended",
					"number",
					"100",
				),
			],
		},
	],
};

/**
 * The Foundation connector composes its behaviour from a base protocol plus
 * per-operation overrides, so it has no single fixed key set: which fields
 * matter depends on `base-protocol`. Both branches are shown, because the form
 * cannot know which one the user is about to pick, and the backend validates
 * only the branch the config selects.
 */
const FOUNDATION: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.foundation,
	labelKey: "hostlms.names.foundation",
	groups: [
		{
			id: "",
			required: true,
			fields: [
				field(
					["base-protocol"],
					"hostlms.config_fields.base_protocol",
					"hostlms.config_fields.base_protocol_description",
					"recommended",
					"text",
					"NCIP",
				),
				defaultAgencyCode(),
				// Required for the NCIP branch, which is the default - but a SIP2
				// host legitimately has no endpoint, so it cannot be a hard
				// requirement of the form.
				field(
					["ncip-endpoint-url"],
					"hostlms.config_fields.ncip_endpoint_url",
					"hostlms.config_fields.foundation_ncip_endpoint_url_description",
					"recommended",
					"url",
				),
			],
		},
		{
			id: "sip2",
			labelKey: "hostlms.config_fields.sip2_group",
			descriptionKey: "hostlms.config_fields.sip2_group_description",
			// Only meaningful on the SIP2 branch, so the group must not be forced
			// into existence on an NCIP host.
			required: false,
			fields: [
				field(
					["sip2", "host"],
					"hostlms.config_fields.sip2_host",
					"hostlms.config_fields.sip2_host_description",
					"optional",
				),
				field(
					["sip2", "port"],
					"hostlms.config_fields.sip2_port",
					"hostlms.config_fields.sip2_port_description",
					"optional",
					"number",
					"6001",
				),
				field(
					["sip2", "login"],
					"hostlms.config_fields.sip2_login",
					"hostlms.config_fields.sip2_login_description",
					"optional",
				),
				field(
					["sip2", "pass"],
					"hostlms.config_fields.sip2_pass",
					"hostlms.config_fields.sip2_pass_description",
					"optional",
					"secret",
				),
				field(
					["sip2", "locationCode"],
					"hostlms.config_fields.sip2_location_code",
					"hostlms.config_fields.sip2_location_code_description",
					"optional",
					"text",
					"SC",
				),
			],
		},
	],
};

/**
 * The OpenRS appliance is an NCIP v2.02 peer. The keys mirror what
 * DcbProfileRegistrationService writes when an appliance redeems an invitation,
 * so a hand-configured appliance and an invited one end up with the same shape.
 */
const ORS_APPLIANCE: HostLmsProfile = {
	lmsClientClass: HOST_LMS_CLASSES.orsAppliance,
	labelKey: "hostlms.names.ors_appliance",
	groups: [
		{
			id: "",
			required: true,
			fields: [
				field(
					["base-url"],
					"hostlms.config_fields.base_url",
					"hostlms.config_fields.ors_base_url_description",
					"required",
					"url",
					"https://appliance.example.org",
				),
				// Not defaultAgencyCode(): on the appliance this is the agency DCB
				// names in the NCIP party element of every LookupUser and
				// LookupItemSet, not a fallback for an unmapped location. An
				// appliance fronting several libraries needs it exactly as much as
				// one fronting a single library, so it stays required even when
				// `shared-system` is set - and dcb-service agrees.
				field(
					["default-agency-code"],
					"hostlms.config_fields.default_agency_code",
					"hostlms.config_fields.ors_default_agency_code_description",
					"required",
				),
				field(
					["ncip-endpoint-url"],
					"hostlms.config_fields.ncip_endpoint_url",
					"hostlms.config_fields.ors_ncip_endpoint_url_description",
					"required",
					"url",
				),
				field(
					["ncip-system-id"],
					"hostlms.config_fields.ncip_system_id",
					"hostlms.config_fields.ncip_system_id_description",
					"required",
				),
				// Defaults to the system id, so absence is a warning not an error.
				field(
					["ncip-agency-id"],
					"hostlms.config_fields.ncip_agency_id",
					"hostlms.config_fields.ncip_agency_id_description",
					"recommended",
				),
				// ORSApplianceOaiPmhIngestSource throws on construction without one
				// of these two, which surfaces as a harvest that never runs.
				field(
					["oai-endpoint-url"],
					"hostlms.config_fields.oai_endpoint_url",
					"hostlms.config_fields.oai_endpoint_url_description",
					"recommended",
					"url",
				),
				field(
					["tenant-id"],
					"hostlms.config_fields.tenant_id",
					"hostlms.config_fields.tenant_id_description",
					"optional",
				),
				field(
					["metadata-prefix"],
					"hostlms.config_fields.metadata_prefix",
					"hostlms.config_fields.metadata_prefix_description",
					"optional",
					"text",
					"marcxml",
				),
			],
		},
		{
			id: "ncipPeerAuth",
			labelKey: "hostlms.config_fields.ncip_peer_auth_group",
			descriptionKey: "hostlms.config_fields.ncip_peer_auth_group_description",
			// These are top-level keys, not a nested object - the group exists only
			// to give the form a heading, so nothing has to be forced into the JSON.
			required: false,
			fields: [
				field(
					["ncip-peer-auth-mode"],
					"hostlms.config_fields.ncip_peer_auth_mode",
					"hostlms.config_fields.ncip_peer_auth_mode_description",
					"recommended",
					"text",
					"JWT_REQUIRED",
				),
				field(
					["ncip-peer-issuer"],
					"hostlms.config_fields.ncip_peer_issuer",
					"hostlms.config_fields.ncip_peer_issuer_description",
					"optional",
				),
				field(
					["ncip-peer-jwks-url"],
					"hostlms.config_fields.ncip_peer_jwks_url",
					"hostlms.config_fields.ncip_peer_jwks_url_description",
					"optional",
					"url",
				),
				field(
					["ncip-peer-audience"],
					"hostlms.config_fields.ncip_peer_audience",
					"hostlms.config_fields.ncip_peer_audience_description",
					"optional",
				),
			],
		},
	],
};

/**
 * Appends the keys every ILS shares to the profile's empty-id group, so no
 * profile can be written without them and none of the seven can drift. Which
 * group carries the empty id is a presentation choice - Alma puts it last, on
 * its harvesting section, because that is what the `ingest` toggle controls.
 */
const withSharedFields = (profile: HostLmsProfile): HostLmsProfile => ({
	...profile,
	groups: profile.groups.map((group) =>
		group.id === ""
			? { ...group, fields: [...group.fields, ...SHARED_FIELDS] }
			: group,
	),
});

/**
 * Exactly the classes `HostLmsConfigValidator` accepts, in picker order.
 * Adding one here without adding it there produces a 400 the user cannot act on.
 */
export const HOST_LMS_PROFILES: HostLmsProfile[] = [
	ALMA,
	POLARIS,
	FOLIO,
	KOHA,
	SIERRA,
	FOUNDATION,
	ORS_APPLIANCE,
].map(withSharedFields);

export const getHostLmsProfile = (
	lmsClientClass?: string | null,
): HostLmsProfile | undefined =>
	HOST_LMS_PROFILES.find(
		(profile) => profile.lmsClientClass === lmsClientClass,
	);

export const clientConfigFieldsFor = (
	lmsClientClass?: string | null,
): ClientConfigField[] =>
	getHostLmsProfile(lmsClientClass)?.groups.flatMap((group) => group.fields) ??
	[];

/** react-hook-form field name for a config field, e.g. `papi.app-id`. */
export const fieldName = (configField: ClientConfigField): string =>
	configField.path.join(".");

const readPath = (source: any, path: string[]): unknown =>
	path.reduce(
		(value, segment) =>
			value && typeof value === "object" ? value[segment] : undefined,
		source,
	);

const writePath = (target: any, path: string[], value: unknown): void => {
	const parents = path.slice(0, -1);
	const leaf = path[path.length - 1];
	const container = parents.reduce((node, segment) => {
		if (typeof node[segment] !== "object" || node[segment] === null)
			node[segment] = {};
		return node[segment];
	}, target);
	container[leaf] = value;
};

const isBlank = (value: unknown): boolean =>
	value === undefined ||
	value === null ||
	(typeof value === "string" && value.trim().length === 0);

/**
 * Turns the guided form's values into the client config object dcb-service
 * expects. Empty fields are dropped rather than sent as "" - the validator
 * treats a blank string as missing anyway, and an empty key in the stored
 * config is worse than no key.
 */
export const buildClientConfig = (
	lmsClientClass: string | undefined | null,
	values: any,
): Record<string, unknown> => {
	const config: Record<string, unknown> = {};

	for (const configField of clientConfigFieldsFor(lmsClientClass)) {
		const raw = readPath(values, configField.path);
		if (isBlank(raw)) continue;

		if (configField.type === "boolean") {
			writePath(config, configField.path, raw === true || raw === "true");
			continue;
		}
		if (configField.type === "stringList") {
			// Already an array when hydrated from JSON; a comma-separated string
			// when typed. Blank entries are dropped so a trailing comma does not
			// become an empty role.
			const entries = Array.isArray(raw)
				? raw.map((entry) => String(entry).trim())
				: String(raw)
						.split(",")
						.map((entry) => entry.trim());
			const cleaned = entries.filter((entry) => entry.length > 0);
			if (cleaned.length > 0) writePath(config, configField.path, cleaned);
			continue;
		}
		if (configField.type === "jsonObject") {
			if (typeof raw === "object") {
				writePath(config, configField.path, raw);
				continue;
			}
			try {
				const parsed = JSON.parse(String(raw));
				// Only an object is useful here; anything else is dropped rather
				// than stored as a scalar the backend cannot read.
				if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
					writePath(config, configField.path, parsed);
				}
			} catch {
				// The field's own validation reports it; do not send broken JSON.
			}
			continue;
		}
		if (configField.type === "number") {
			const parsed = Number(raw);
			// A number field that somehow holds prose is passed through as the
			// string rather than as NaN, which would serialise to null.
			writePath(config, configField.path, Number.isNaN(parsed) ? raw : parsed);
			continue;
		}
		writePath(
			config,
			configField.path,
			typeof raw === "string" ? raw.trim() : raw,
		);
	}

	// dcb-service checks the nested objects exist, so a group the user left
	// entirely empty still has to be present - the missing-field validation
	// above it is what stops that being a silent empty object.
	for (const group of getHostLmsProfile(lmsClientClass)?.groups ?? []) {
		if (group.id && group.required && !(group.id in config))
			config[group.id] = {};
	}

	return config;
};

export interface ClientConfigProblem {
	/** Dotted field name, for react-hook-form. */
	name: string;
	labelKey: string;
	requirement: ClientConfigRequirement;
}

/** Required fields the guided form is still missing. Blocks submission. */
export const missingRequiredClientConfig = (
	lmsClientClass: string | undefined | null,
	values: any,
): ClientConfigProblem[] =>
	clientConfigFieldsFor(lmsClientClass)
		.filter(
			(configField) =>
				configField.requirement === "required" &&
				!(configField.requiredUnless?.(values) ?? false) &&
				isBlank(readPath(values, configField.path)),
		)
		.map((configField) => ({
			name: fieldName(configField),
			labelKey: configField.labelKey,
			requirement: "required" as const,
		}));

/**
 * The one combination dcb-service refuses outright, checked here so the user is told
 * by the field they just filled in rather than by a 400 after submitting.
 *
 * A shared system hosts several participating libraries, so no single agency can
 * stand in for an unrecognised location: `default-agency-code` would attribute every
 * co-tenant's patrons - including libraries outside the consortium entirely - to
 * whichever library happened to be configured, with nothing to say it happened.
 *
 * Mirrors `HostLmsConfigValidator.hasSharedSystemConflict`, appliance exemption
 * included. Diverging from it means the form and the server disagree about what is
 * valid, and the user is caught between them.
 */
export const hasSharedSystemConflict = (
	lmsClientClass: string | undefined | null,
	values: any,
): boolean =>
	lmsClientClass !== HOST_LMS_CLASSES.orsAppliance &&
	sharedSystemSet(values) &&
	!isBlank(readPath(values, ["default-agency-code"]));

/** Recommended fields left blank. Surfaced as a warning, never a block. */
export const missingRecommendedClientConfig = (
	lmsClientClass: string | undefined | null,
	values: any,
): ClientConfigProblem[] =>
	clientConfigFieldsFor(lmsClientClass)
		.filter(
			(configField) =>
				configField.requirement === "recommended" &&
				isBlank(readPath(values, configField.path)),
		)
		.map((configField) => ({
			name: fieldName(configField),
			labelKey: configField.labelKey,
			requirement: "recommended" as const,
		}));

/**
 * Hydrates the guided form from raw JSON, so switching out of the advanced
 * editor does not silently discard what was typed there. Keys the guided form
 * has no field for are reported rather than dropped in silence.
 */
export const clientConfigToFields = (
	lmsClientClass: string | undefined | null,
	config: Record<string, unknown>,
): { values: Record<string, unknown>; unmappedKeys: string[] } => {
	const values: Record<string, unknown> = {};
	const known = new Set<string>();

	for (const configField of clientConfigFieldsFor(lmsClientClass)) {
		known.add(configField.path.join("."));
		const raw = readPath(config, configField.path);
		if (raw === undefined || raw === null) continue;

		if (configField.type === "boolean") {
			writePath(values, configField.path, raw === true);
			continue;
		}
		if (configField.type === "stringList") {
			// Back to the comma-separated text the input holds.
			writePath(
				values,
				configField.path,
				Array.isArray(raw) ? raw.join(", ") : String(raw),
			);
			continue;
		}
		if (configField.type === "jsonObject") {
			writePath(
				values,
				configField.path,
				typeof raw === "object" ? JSON.stringify(raw, null, 2) : String(raw),
			);
			continue;
		}
		writePath(values, configField.path, String(raw));
	}

	const unmappedKeys: string[] = [];
	const walk = (node: unknown, prefix: string[]) => {
		if (!node || typeof node !== "object" || Array.isArray(node)) return;
		for (const [key, value] of Object.entries(node)) {
			const path = [...prefix, key];
			if (known.has(path.join("."))) continue;
			if (value && typeof value === "object" && !Array.isArray(value)) {
				walk(value, path);
				continue;
			}
			unmappedKeys.push(path.join("."));
		}
	};
	walk(config, []);

	return { values, unmappedKeys };
};
