import { ColumnDef, SortingState, useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender, Column, Table as ReactTable } from "@tanstack/react-table"
import { Form, InputGroup, Table as BootstrapTable } from "react-bootstrap"
import React from "react"



export default function Table<T extends Object>({
    data = [],
	columns,
    type,
}: {
	data: Array<T>;
	columns: ColumnDef<T, any>[]; 
    type: string;
}) {
    // Full sorting will be implemented in future work using the below state management
    const [sorting, setSorting] = React.useState<SortingState>([])
    // The type prop will be used if we need to alter advanced table bahaviours for different screens.
	const table = useReactTable({
	  data,
	  columns,
	  getCoreRowModel: getCoreRowModel(),
	  getFilteredRowModel: getFilteredRowModel(),
	  getPaginationRowModel: getPaginationRowModel(),
	  onSortingChange: setSorting,
	  getSortedRowModel: getSortedRowModel(),
	  debugTable: true,
	})
    return (
		<div className="p-2">
		  <div className="h-2" />
          {/* This is our implementation of the react-bootstrap table. 
          The props used are the responsive, striped and bordered props.
          Responsive enables responsive behaviour on the table, allowing it to be scrolled horizontally
          when required. You can also specify a breakpoint at which this behaviour will stop, like so:
          responsive = "xl". For more info, see docs https://react-bootstrap.netlify.app/docs/components/table/#table.*/}
		  <BootstrapTable responsive striped bordered hover aria-label="Table">
			<thead>
			  {table.getHeaderGroups().map(headerGroup => (
				<tr aria-label="Table ID header" key={headerGroup.id}>
				  {headerGroup.headers.map(header => {
					return (
					  <td key={header.id} colSpan={header.colSpan}>
						{header.isPlaceholder ? null : (
						  <div    {...{
							className: header.column.getCanSort()
							  ? 'cursor-pointer select-none'
							  : '',
							onClick: header.column.getToggleSortingHandler(),
						  }}
						>
							{flexRender(
							  header.column.columnDef.header,
							  header.getContext()
							)}
							{header.column.getCanFilter() ? (
							  <div>
								<Filter column={header.column} table={table} />
							  </div>
							) : null}
						{{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
						  </div>
						)}
					  </td>
					)
				  })}
				</tr>
			  ))}
			</thead>
			<tbody>
			  {table.getRowModel().rows.map(row => {
				return (
				  <tr key={row.id}>
					{row.getVisibleCells().map(cell => {
					  return (
						<td key={cell.id}>
						  {flexRender(
							cell.column.columnDef.cell,
							cell.getContext()
						  )}
						</td>
					  )
					})}
				  </tr>
				)
			  })}
			</tbody>
		  </BootstrapTable>
          {/* UI elements for client-side pagination. 
          These are:
          the buttons to go back / go to the next page, the page count, the 'go to X page' selector,
          the 'show X selector', and the row count.
            */}
		  <div className="h-2" />
		  <div className="flex items-center gap-2">
			<button
			  className="return-to-first-page"
			  onClick={() => table.setPageIndex(0)}
			  disabled={!table.getCanPreviousPage()}
			>
			  {'<<'}
			</button>
			<button
			  className="return-to-previous-bage"
			  onClick={() => table.previousPage()}
			  disabled={!table.getCanPreviousPage()}
			>
			  {'<'}
			</button>
			<button
			  className="proceed-to-next-page"
			  onClick={() => table.nextPage()}
			  disabled={!table.getCanNextPage()}
			>
			  {'>'}
			</button>
			<button
			  className="proceed-to-final-page"
			  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
			  disabled={!table.getCanNextPage()}
			>
			  {'>>'}
			</button>
			<span className="pageCount">
			  <div>Page {table.getState().pagination.pageIndex + 1} of{' '}
				{table.getPageCount()}</div>
			</span>
            {/* Embolden page numbers */}
			<span className="flex items-center gap-1">
			  | Go to page:
			  <input
				type="number"
				defaultValue={table.getState().pagination.pageIndex + 1}
				onChange={e => {
				  const page = e.target.value ? Number(e.target.value) - 1 : 0
				  table.setPageIndex(page)
				}}
				className="border p-1 rounded w-16"
			  />
			</span>
            {/* Limit the available page numbers (i.e. to ones that are possible, no -1) */}
			<select
			  value={table.getState().pagination.pageSize}
			  onChange={e => {
				table.setPageSize(Number(e.target.value))
			  }}
			>
			  {[10, 20, 30, 40, 50].map(pageSize => (
				<option key={pageSize} value={pageSize}>
				  Show {pageSize}
				</option>
			  ))}
			</select>
		  </div>
		  <div>{table.getRowModel().rows.length} Rows</div>
		</div>
	  )
	}
	// To add new options for page sizes, just add the new value to the array on line 123.
    // This function is for the filtering / searching of the table.
	function Filter({
		column,
		table,
	  }: {
		column: Column<any, any>
		table: ReactTable<any>
	  }) {
		const firstValue = table
		  .getPreFilteredRowModel()
		  .flatRows[0]?.getValue(column.id)
	  
		const columnFilterValue = column.getFilterValue()
	  
		return typeof firstValue === 'number' ? (
		  <div className="flex space-x-2">
			<input
			  type="number"
			  value={(columnFilterValue as [number, number])?.[0] ?? ''}
			  onChange={e =>
				column.setFilterValue((old: [number, number]) => [
				  e.target.value,
				  old?.[1],
				])
			  }
			  placeholder={`Min`}
			  className="w-24 border shadow rounded"
			/>
			<input
			  type="number"
			  value={(columnFilterValue as [number, number])?.[1] ?? ''}
			  onChange={e =>
				column.setFilterValue((old: [number, number]) => [
				  old?.[0],
				  e.target.value,
				])
			  }
			  placeholder={`Max`}
			  className="w-24 border shadow rounded"
			/>
		  </div>
		) : (
		  <InputGroup className="table-search-path">
			{/* This is a search bar.
            Presently, one exists for every column. In future, we'd like one bar, 
            with toggleable filters, capable of searching all*/}
			<Form.Control onChange={e => column.setFilterValue(e.target.value)}
			placeholder={`Search...`}
			className="w-36 border shadow rounded" 
			value={(columnFilterValue ?? '') as string} />
		  </InputGroup>
		)
	  }

