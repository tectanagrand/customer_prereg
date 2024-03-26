import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
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
    Backdrop,
    CircularProgress,
    Dialog,
} from "@mui/material";
import {
    KeyboardArrowRight,
    KeyboardArrowDown,
    KeyboardArrowUp,
    Edit,
    Outbox,
    CheckCircleOutline,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/axios";
import toast, { Toaster } from "react-hot-toast";
import TableChildCustLN from "./TableChildCustLN";
import { useNavigate } from "react-router-dom";
import { Fragment } from "react";
import PaginationActionButton from "./PaginationActionButton";
import { FilterTextFieldComp } from "../input/FilterTextFieldComp";
import AutocompleteFilter from "../input/AutocompleteFilterComp";
import { useTheme } from "@mui/material/styles";
import { useSession } from "../../provider/sessionProvider";

export default function TableParentCustDashboard() {
    const theme = useTheme();
    const [dataCust, setDataCust] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [sorting, setSorting] = useState([]);
    const [backDrop, setBackdrop] = useState(false);
    const [successModal, setScsModal] = useState(false);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const navigate = useNavigate();
    const { getPermission } = useSession();

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
        } else if (action === "uplog") {
            setBackdrop(true);
            try {
                const upData = await Axios.post("/ln/tolog", {
                    id_header: data.id,
                });
                setScsModal(true);
                setRefresh(true);
            } catch (error) {
                toast.error(error.response.data.message);
            } finally {
                setBackdrop(false);
            }
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
                id: "action_but",
                enableSorting: false,
                cell: props => {
                    let buttons = [];
                    if (
                        props.row.original.ctros > 0 &&
                        getPermission("O/S Request").fcreate
                    ) {
                        buttons.push(
                            <Tooltip
                                key={props.row.id}
                                title={<Typography>Edit</Typography>}
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "primary.light",
                                        mx: 1,
                                    }}
                                    onClick={() =>
                                        buttonAction("edit", {
                                            id: props.row.original.hd_id,
                                        })
                                    }
                                >
                                    <Edit></Edit>
                                </IconButton>
                            </Tooltip>
                        );
                    }
                    if (props.row.original.cur_pos === "INIT") {
                        buttons.push(
                            <Tooltip
                                key={`${props.row.id}-log`}
                                title={
                                    <Typography>Send To Logistic</Typography>
                                }
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "primary.light",
                                        mx: 1,
                                    }}
                                    onClick={() =>
                                        buttonAction("uplog", {
                                            id: props.row.original.hd_id,
                                        })
                                    }
                                >
                                    <Outbox></Outbox>
                                </IconButton>
                            </Tooltip>
                        );
                    }
                    return buttons;
                },
            },
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
        getFilteredRowModel: getFilteredRowModel(),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        state: {
            pagination,
            sorting,
        },
    });

    useEffect(() => {
        (async () => {
            const allow = getPermission("O/S Request").fcreate;
            try {
                const { data } = await Axios.get(
                    "/ln/lnuser?isallow=" + allow,
                    {
                        withCredentials: true,
                    }
                );
                setDataCust(data);
            } catch (error) {
                console.error(error);
                toast.error(error.response.data.message);
            }
        })();
    }, [refresh]);

    return (
        <>
            <Toaster />
            {getPermission("O/S Request").fcreate && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        sx={{ width: 200, heigth: 50, margin: 2 }}
                        variant="contained"
                        onClick={buttonNewUser}
                    >
                        <Typography>Request New</Typography>
                    </Button>
                </Box>
            )}

            <TableContainer sx={{ height: "38rem" }}>
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
                                                {header.column.getCanFilter() ? (
                                                    <div>
                                                        <AutocompleteFilter
                                                            column={
                                                                header.column
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <></>
                                                )}
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignContent:
                                                                "center",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={header.column.getToggleSortingHandler()}
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
                                                                        width: "1.5rem",
                                                                        height: "1.5rem",
                                                                    }}
                                                                />
                                                            ) : header.column.getNextSortingOrder() ===
                                                              "desc" ? (
                                                                <KeyboardArrowDown
                                                                    sx={{
                                                                        width: "1.5rem",
                                                                        height: "1.5rem",
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
                                                    <TableChildCustLN
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
            <Backdrop open={backDrop}>
                <CircularProgress />
            </Backdrop>
            <Dialog
                open={successModal}
                maxWidth="sm"
                onClose={() => {
                    setScsModal(false);
                }}
                sx={{ zIndex: theme => theme.zIndex.drawer - 2 }}
            >
                <Box
                    sx={{
                        minWidth: "30rem",
                        minHeight: "15rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        p: 4,
                    }}
                >
                    <CheckCircleOutline
                        sx={{
                            height: "4rem",
                            width: "4rem",
                            color: "green",
                        }}
                    />
                    <Typography variant="h4">
                        Loading Note Send to Logistic
                    </Typography>
                </Box>
            </Dialog>
        </>
    );
}
