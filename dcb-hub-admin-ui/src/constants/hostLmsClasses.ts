// Apart from hostLmsClientConfig so route options can name an ILS without putting the
// whole Host LMS form into what every page loads first
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
