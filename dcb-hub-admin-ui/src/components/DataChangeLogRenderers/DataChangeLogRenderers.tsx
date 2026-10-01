import { GridRenderCellParams } from "@mui/x-data-grid-premium";
import Link from "@components/Link/Link";
import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { dataChangeLogEntityPath } from "@helpers/dataChangeLogHelperFunctions";

export const renderEntityIdCell = ({ row }: GridRenderCellParams) => {
	const path = dataChangeLogEntityPath(row?.entityType, row?.entityId, {
		// A deleted record and an ended membership both leave an id that no longer
		// addresses anything, whatever kind of entity it was.
		deleted:
			row?.actionInfo === "DELETE" ||
			row?.changeCategory === "Membership ended",
	});

	return path ? (
		<Link to={path} underline="hover">
			{row.entityId}
		</Link>
	) : (
		row.entityId
	);
};

export const renderReferenceUrlCell = ({ value }: GridRenderCellParams) => {
	return <RenderAttribute attribute={value} type="url" title={value} />;
};
