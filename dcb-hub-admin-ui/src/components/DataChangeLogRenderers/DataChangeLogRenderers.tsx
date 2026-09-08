import { GridRenderCellParams } from "@mui/x-data-grid-premium";
import Link from "@components/Link/Link";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { calculateEntityLink } from "@helpers/dataChangeLogHelperFunctions";

export const renderEntityIdCell = ({ row }: GridRenderCellParams) => {
	const isNonLinkable =
		["reference_value_mapping", "numeric_range_mapping", "person"].includes(
			row?.entityType,
		) ||
		row?.actionInfo === "DELETE" ||
		row?.changeCategory === "Membership ended";

	return isNonLinkable ? (
		row.entityId
	) : (
		<Link
			to={`/${calculateEntityLink(row.entityType)}/${row.entityId}`}
			underline="hover"
		>
			{row.entityId}
		</Link>
	);
};

export const renderReferenceUrlCell = ({ value }: GridRenderCellParams) => {
	return <RenderAttribute attribute={value} type="url" title={value} />;
};
