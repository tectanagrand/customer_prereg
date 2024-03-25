import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
    getPaginationRowModel,
    getSortedRowModel,
} from "@tanstack/react-table";
import {
    TableContainer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Typography,
    Box,
    Button,
    TablePagination,
    TableFooter,
} from "@mui/material";
import {
    KeyboardArrowRight,
    KeyboardArrowDown,
    KeyboardArrowUp,
    Edit,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Fragment } from "react";
import PaginationActionButton from "../../component/table/PaginationActionButton";

export default function TableParentLastReqCust() {
    const [dataCust, setDataCust] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const navigate = useNavigate();

    const columns = useMemo(
        () => [
            {
                header: "DO Number",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "Material",
                accessorKey: "desc_con",
                cell: props => props.getValue(),
            },
            {
                header: "Driver",
                accessorKey: "driver",
                cell: props => props.getValue(),
            },
            {
                header: "Vehicle",
                accessorKey: "vhcl_id",
                cell: props => props.getValue(),
            },
            {
                header: "Planned Quantity",
                accessorKey: "plan_qty",
                cell: props => props.getValue(),
            },
            {
                header: "Status",
                accessorKey: "status",
                cell: props => props.getValue(),
            },
        ],
        []
    );

    const table = useReactTable({
        columns,
        data: dataCust,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            pagination,
            sorting,
        },
    });

    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get("/ln/lastos");
                setDataCust(data);
            } catch (error) {
                console.error(error);
                toast.error(error.response.data.message);
            }
        })();
    }, []);

    return (
        <>
            <TableContainer sx={{ height: "23rem" }}>
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
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        sx={{
                                                            display: "flex",
                                                            alignContent:
                                                                "center",
                                                        }}
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
                                                        )}
                                                        {header.column.getCanSort() ? (
                                                            header.column.getNextSortingOrder() ===
                                                            "asc" ? (
                                                                <KeyboardArrowUp
                                                                    sx={{
                                                                        width: "1rem",
                                                                        height: "1rem",
                                                                    }}
                                                                />
                                                            ) : header.column.getNextSortingOrder() ===
                                                              "desc" ? (
                                                                <KeyboardArrowDown
                                                                    sx={{
                                                                        width: "1rem",
                                                                        height: "1rem",
                                                                    }}
                                                                />
                                                            ) : (
                                                                ""
                                                            )
                                                        ) : (
                                                            ""
                                                        )}
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
                            count={table.getFilteredRowModel().rows.length}
                            rowsPerPage={pagination.pageSize}
                            page={pagination.pageIndex}
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
        </>
    );
}
