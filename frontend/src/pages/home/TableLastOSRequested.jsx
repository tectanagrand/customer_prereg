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

function TableChildLastReq({ dataChild }) {
    const columns = useMemo(
        () => [
            {
                header: "Create Date",
                accessorKey: "cre_date",
                cell: props => props.getValue(),
            },
            {
                header: "Driver ID",
                accessorKey: "driver_id",
                cell: props => props.getValue(),
            },
            {
                header: "Driver Name",
                accessorKey: "driver_name",
                cell: props => props.getValue(),
            },
            {
                header: "Vehicle",
                accessorKey: "vhcl_id",
                cell: props => props.getValue(),
            },
            {
                header: "Media Transport",
                accessorKey: "media_tp",
                cell: props => props.getValue(),
            },
            {
                header: "Planning Quantity",
                accessorKey: "plan_qty",
                cell: props => props.getValue(),
            },
        ],
        []
    );
    const table = useReactTable({
        columns,
        data: dataChild,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <TableContainer
                sx={{
                    height: "10rem",
                }}
            >
                <Table>
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
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
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

export default function TableParentLastOSReq() {
    const [dataCust, setDataCust] = useState([]);
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const navigate = useNavigate();

    const buttonAction = async (action, data) => {
        if (action === "edit") {
            navigate(
                {
                    pathname: "./create",
                    search: `?idloadnote=${data.id}`,
                },
                {
                    state: {
                        page: "user",
                    },
                }
            );
        }
    };

    const buttonNewUser = () => {
        navigate("./create");
    };

    const columns = useMemo(
        () => [
            {
                id: "expand",
                enableSorting: false,
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
            {
                header: "DO Number",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "Contract Number",
                accessorKey: "con_num",
                cell: props => props.getValue(),
            },
            {
                header: "Contract Quantity",
                accessorKey: "con_qty",
                cell: props => props.getValue(),
            },
            {
                header: "Plant",
                accessorKey: "plant",
                cell: props => props.getValue(),
            },
            {
                header: "Company",
                accessorKey: "company",
                cell: props => props.getValue(),
            },
            {
                header: "Customer",
                accessorKey: "customer",
                cell: props => props.getValue(),
            },
            // {
            //     id: "action_but",
            //     enableSorting: false,
            //     cell: props => {
            //         let buttons = [];
            //         buttons.push(
            //             <Tooltip
            //                 key={props.row.id}
            //                 title={<Typography>Edit</Typography>}
            //             >
            //                 <IconButton
            //                     sx={{ backgroundColor: "primary.light", mx: 1 }}
            //                     onClick={() =>
            //                         buttonAction("edit", {
            //                             id: props.row.original.hd_id,
            //                         })
            //                     }
            //                 >
            //                     <Edit></Edit>
            //                 </IconButton>
            //             </Tooltip>
            //         );
            //         return buttons;
            //     },
            // },
        ],
        []
    );

    const table = useReactTable({
        columns,
        data: dataCust,
        getRowCanExpand: () => true,
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
                const { data } = await Axios.get("/ln/lastreq");
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
                                    {row.getIsExpanded() && (
                                        <TableRow key={"rowchild" + row.id}>
                                            <TableCell
                                                key={"rowcell" + row.id}
                                                colSpan={
                                                    row.getVisibleCells().length
                                                }
                                            >
                                                {
                                                    <TableChildLastReq
                                                        dataChild={
                                                            row.original
                                                                .sub_table
                                                        }
                                                        key={
                                                            "tablechild" +
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
