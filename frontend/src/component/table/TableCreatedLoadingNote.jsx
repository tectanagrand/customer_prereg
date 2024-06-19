import {
    TableContainer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TablePagination,
    TableFooter,
} from "@mui/material";

import {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
} from "@tanstack/react-table";

import { useMemo, useState, useEffect } from "react";

import PaginationActionButton from "../table/PaginationActionButton";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

export default function TableCreatedLoadingNote({ do_num, ...props }) {
    const axiosPrivate = useAxiosPrivate();
    const [DataLN, setDataLN] = useState({ data: [], size: 0 });
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });

    useEffect(() => {
        (async () => {
            try {
                if (do_num !== "" && do_num) {
                    const { data } = await axiosPrivate(
                        `/ln/dash?do_num=${do_num}&limit=5&offset=0`
                    );
                    setDataLN({ data: data.data, size: data.size });
                }
            } catch (error) {
                console.error(error);
            }
        })();
        // console.log("do num change");
    }, [do_num]);

    useEffect(() => {
        // console.log("pagination change");
        (async () => {
            try {
                if (do_num !== "" && do_num) {
                    const { data } = await axiosPrivate(
                        `/ln/dash?do_num=${do_num}&limit=${pagination.pageSize}&offset=${pagination.pageIndex * pagination.pageSize}`
                    );
                    setDataLN(data);
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }, [pagination.pageIndex]);

    const columns = useMemo(
        () => [
            {
                accessorKey: "ln_num",
                header: "Loading Note Number",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "tanggal_loading",
                header: "Tanggal Loading",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "vhcl_id",
                header: "Plat Nomor",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "plan_qty",
                header: "Planning Quantity",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "act_qty",
                header: "Act.",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "bruto",
                header: "Bruto",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "tarra",
                header: "Tarra",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "netto",
                header: "Netto",
                cell: ({ getValue }) => getValue(),
            },
            {
                accessorKey: "quality",
                header: "Quality",
                cell: ({ getValue }) => getValue(),
            },
        ],
        []
    );
    const table = useReactTable({
        data: DataLN.data,
        columns: columns,
        manualPagination: true,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        state: {
            pagination,
        },
    });

    return (
        <>
            <TableContainer sx={props.sx}>
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
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
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
                        {table.getCoreRowModel().rows.map(row => {
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
            <Table>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5]}
                            count={DataLN.size}
                            rowsPerPage={pagination.pageSize}
                            page={pagination.pageIndex}
                            onPageChange={(_, page) => {
                                // console.log(page);
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
        </>
    );
}
