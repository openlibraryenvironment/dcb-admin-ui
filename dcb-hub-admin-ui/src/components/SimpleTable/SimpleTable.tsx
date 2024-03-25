import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box } from "@mui/material";

export default function SimpleTable(props: any) {
	const { column_names, row_data } = props;

	return (
		<Box
			sx={{
				paddingTop: 2,
				paddingBottom: 2,
			}}
		>
			<TableContainer
				sx={{
					overflowX: "hidden",
				}}
			>
				<Table
					sx={{
						minWidth: 50,
					}}
					aria-label="simple table"
				>
					<TableHead>
						<TableRow>
							{column_names.map((column: any) => (
								<TableCell key={column} sx={{ fontSize: "1rem" }}>
									{column}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{row_data.map((row: any, rowIndex: number) => (
							<TableRow
								key={rowIndex}
								sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
							>
								{row.map((cell: any, cellIndex: number) => (
									<TableCell
										key={`${rowIndex}-${cellIndex}`}
										sx={{ fontSize: "1rem" }}
									>
										{cell}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}
