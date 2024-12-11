import React, { Fragment, useMemo } from "react";
import {
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableFooter,
    TablePagination,
    IconButton,
    Box,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import {
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import PaginationActionButton from "./PaginationActionButton";

export default function TableWithDetail({
    columns,
    data,
    paginate,
    setPaginate,
    sx,
    TableChild,
}) {
    const columnTable = useMemo(() => {
        return [
            {
                id: "expand",
                header: "",
                cell: ({ row }) => {
                    return row.getCanExpand() ? (
                        <>
                            <IconButton
                                {...{ onClick: row.getToggleExpandedHandler() }}
                            >
                                {row.getIsExpanded() ? (
                                    <KeyboardArrowDown />
                                ) : (
                                    <KeyboardArrowRight />
                                )}
                            </IconButton>
                        </>
                    ) : (
                        ""
                    );
                },
            },
            ...columns,
        ];
    }, [columns]);
    const table = useReactTable({
        columns: columnTable,
        data: data.rows,
        getRowCanExpand: () => true,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPaginate,
        state: {
            pagination: paginate,
        },
    });

    return (
        <Box sx={sx}>
            <TableContainer sx={sx}>
                <Table stickyHeader>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        return (
                                            <TableCell key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext
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
                                <Fragment key={row.id}>
                                    <TableRow hover>
                                        {row.getVisibleCells().map(cell => {
                                            return (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                    {row.getIsExpanded() && (
                                        <TableRow key={"rowchild-" + row.id}>
                                            <TableCell
                                                key={"rowcell-" + row.id}
                                                colSpan={
                                                    row.getVisibleCells().length
                                                }
                                            >
                                                {
                                                    <TableChild
                                                        dataChild={
                                                            row.original
                                                                .sub_table
                                                        }
                                                        key={
                                                            "tablechild-" +
                                                            row.id
                                                        }
                                                    />
                                                }
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Table>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5]}
                            count={data.count}
                            rowsPerPage={paginate.pageSize}
                            page={paginate.pageIndex}
                            onPageChange={(_, page) => {
                                table.setPageIndex(page);
                            }}
                            onRowsPerPageChange={e => {
                                const size = e.target.value
                                    ? Number(e.target.value)
                                    : 10;
                                table.setPageSize(size);
                            }}
                            ActionsComponent={PaginationActionButton}
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </Box>
    );
}
