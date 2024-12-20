import {
    getCoreRowModel,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";
import {
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableFooter,
    TableRow,
    TableCell,
} from "@mui/material";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

/**
 * @param {import("@tanstack/react-table").Column} colTab
 * @return {import("@mui/material").SxProps}
 */
function pinnedColumnStyling(colTab, is_header) {
    const isPinned = colTab.getIsPinned();
    return {
        left: isPinned === "left" ? `${colTab.getStart("left")}px` : undefined,
        right:
            isPinned === "right" ? `${colTab.getAfter("right")}px` : undefined,
        opacity: isPinned ? 1 : 0.95,
        position: isPinned ? "sticky" : "",
        zIndex: isPinned ? (is_header ? 2 : 1) : is_header ? 1 : 0,
        backgroundColor: isPinned && !is_header ? "white" : "",
    };
}

const TableSpanPin = forwardRef(
    /**
     *
     * @param {Object} param
     * @param {import("@tanstack/react-table").TableOptions} param.config_table
     * @param {Array} param.data
     * @param {Array} param.columns
     * @param {Map | null} param.spanning_col
     * @param {Object} param.pinned_col
     * @returns
     */
    ({ data, columns, sx, spanning_col, pinned_col, config_table }, ref) => {
        // console.log(Array.from(pinned_col.keys()));
        const [columnPinning, setColumnPinning] = useState({
            left: [],
            right: [],
        });
        const table = useReactTable({
            getCoreRowModel: getCoreRowModel(),
            data: data,
            columns: columns,
            state: {
                columnPinning,
            },
            onColumnPinningChange: setColumnPinning,
            initialState: {
                columnPinning: pinned_col
                    ? pinned_col
                    : { right: [], left: [] },
            },
            ...config_table,
        });

        useEffect(() => {
            setColumnPinning(pinned_col);
        }, [pinned_col]);

        useImperativeHandle(ref, () => table);
        return (
            <TableContainer
                sx={{
                    ...sx,
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        return (
                                            <TableCell
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                sx={{
                                                    ...pinnedColumnStyling(
                                                        header.column,
                                                        true
                                                    ),
                                                    minWidth: `${header.getSize()}px`,
                                                }}
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
                        {table.getRowModel().rows.map(row => {
                            return (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map(cell => {
                                        if (
                                            spanning_col.has(
                                                cell.column.columnDef
                                                    .accessorKey
                                            )
                                        ) {
                                            if (cell.row.original.is_header) {
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        sx={{
                                                            borderUpper:
                                                                "1px solid black",
                                                            borderBottom:
                                                                "1px solid black",
                                                            ...pinnedColumnStyling(
                                                                cell.column
                                                            ),
                                                            minWidth: `${cell.column.getSize()}px`,
                                                        }}
                                                        rowSpan={
                                                            cell.row.original
                                                                .span
                                                        }
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                                        borderUpper:
                                                            "1px solid black",
                                                        borderBottom:
                                                            "1px solid black",
                                                        ...pinnedColumnStyling(
                                                            cell.column
                                                        ),
                                                    }}
                                                    rowSpan={1}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
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
);

export default TableSpanPin;
