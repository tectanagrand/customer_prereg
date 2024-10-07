import {
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table";
import { useEffect, useMemo } from "react";

export default function TableRowGrouping({
    rows,
    column,
    id_spanning,
    tableconf,
    onSelectChange,
}) {
    const id_merged = useMemo(() => id_spanning, [id_spanning]);

    const table = useReactTable({
        getRowId: row => row.id,
        columns: column,
        data: rows,
        getCoreRowModel: getCoreRowModel(),
        ...tableconf,
    });

    useEffect(() => {
        const selectedData = table
            .getSelectedRowModel()
            .rows.map(row => row.original);
        onSelectChange(selectedData);
    }, [table.getState().rowSelection]);

    useEffect(() => {
        table.resetRowSelection();
    }, [rows]);
    return (
        <TableContainer>
            <Table>
                <TableHead>
                    {table.getHeaderGroups().map(headersGroup => {
                        return (
                            <TableRow key={headersGroup.id}>
                                {headersGroup.headers.map(header => {
                                    return (
                                        <TableCell key={header.id}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        );
                    })}
                </TableHead>
                <TableBody>
                    {table.getRowModel().rows.map(rows => {
                        return (
                            <TableRow key={rows.id}>
                                {rows.getVisibleCells().map(cell => {
                                    if (cell.column.id === id_merged) {
                                        if (cell.getValue() !== "") {
                                            return (
                                                <TableCell
                                                    rowSpan={
                                                        cell.row.original.span
                                                    }
                                                    sx={{
                                                        borderStyle: "solid",
                                                        borderTopWidth: "0px",
                                                        borderBottomWidth:
                                                            "4px",
                                                        borderRightWidth: "0px",
                                                        borderLeftWidth: "0px",
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        }
                                    } else {
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                sx={{
                                                    borderStyle: "solid",
                                                    borderTopWidth: "0px",
                                                    borderBottomWidth: "4px",
                                                    borderRightWidth: "0px",
                                                    borderLeftWidth: "0px",
                                                }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        );
                                    }
                                })}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
