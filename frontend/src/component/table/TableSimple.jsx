import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    TableContainer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";
import { useMemo, useState } from "react";
import SearchFieldComp from "../input/SearchFieldComp";
// import PaginationActionButton from "./PaginationActionButton";

export default function TableSimple({
    rowsData,
    sx,
    columns,
    active_search,
    stickyHeader,
}) {
    const col = useMemo(() => columns, [columns]);
    const table = useReactTable({
        data: rowsData,
        columns: col,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: "includesString",
    });

    const dataTable = useMemo(() => {
        if (active_search) {
            return table.getFilteredRowModel();
        }
        return table.getCoreRowModel();
    }, [active_search, rowsData, table.getState().globalFilter]);

    return (
        <>
            <TableContainer
                sx={{
                    height: "20rem",
                    ...sx,
                }}
            >
                {active_search && (
                    <SearchFieldComp setQuery={table.setGlobalFilter} />
                )}
                <Table stickyHeader={stickyHeader}>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        return (
                                            <TableCell
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div>
                                                        <div>
                                                            {flexRender(
                                                                header.column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext()
                                                            )}
                                                        </div>
                                                        {/* {header.id !==
                                                            "select" && (
                                                            <div>
                                                                <FilterTextFieldComp
                                                                    column={
                                                                        header.column
                                                                    }
                                                                />
                                                            </div>
                                                        )} */}
                                                    </div>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableHead>
                    <TableBody>
                        {dataTable.rows.map(row => {
                            return (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => {
                                        return (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}
