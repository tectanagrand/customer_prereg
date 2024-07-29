import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import {
    flexRender,
    getCoreRowModel,
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
import { useState, useEffect, useMemo } from "react";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { useTheme } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material";
// import PaginationActionButton from "./PaginationActionButton";

export default function TableSelectVehicle({
    refresh,
    setSelectedRowsUp,
    setRefr,
    req_id,
    notselect,
    sx,
    ...props
}) {
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [rows, setRows] = useState([]);
    const rowData = useMemo(() => rows, [rows]);
    const [rowSelected, setSelectedRows] = useState([]);
    const selectedRows = useMemo(() => rowSelected, [rowSelected]);
    const setRefresh = () => {
        setRefr(false);
    };
    // const { onPaginationChange, pagination, limit, skip } = usePagination();
    // const { sorting, onSortingChange, order, field } = useSorting();
    // const { filters, onColumnFilterChange } = useFilter();
    const columns = useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => {
                    if (!notselect) {
                        return (
                            <CheckBoxTable
                                {...{
                                    checked: table.getIsAllRowsSelected(),
                                    indeterminate:
                                        table.getIsSomeRowsSelected(),
                                    onChange:
                                        table.getToggleAllRowsSelectedHandler(),
                                    sx: {
                                        [`&, &.${checkboxClasses.checked}`]: {
                                            color: theme.palette.grey[100],
                                        },
                                        color: theme.palette.grey[100],
                                    },
                                }}
                            />
                        );
                    } else {
                        return <></>;
                    }
                },
                cell: ({ row }) => {
                    if (!notselect) {
                        return (
                            <CheckBoxTable
                                {...{
                                    checked: row.getIsSelected(),
                                    disabled: !row.getCanSelect(),
                                    indeterminate: row.getIsSomeSelected(),
                                    onChange: row.getToggleSelectedHandler(),
                                }}
                            />
                        );
                    } else {
                        return <></>;
                    }
                },
            },
            {
                header: "Plant Location",
                accessorKey: "plant",
                cell: props => props.getValue(),
            },
            {
                header: "Nomor Plat",
                accessorKey: "vhcl_id",
                cell: props => props.getValue(),
            },
        ],
        []
    );

    const table = useReactTable({
        data: rows,
        columns,
        getRowId: row => row.id,
        getCoreRowModel: getCoreRowModel(),
        // onColumnFiltersChange: onColumnFilterChange,
        onRowSelectionChange: setSelectedRows,
        state: {
            rowSelection: rowSelected,
        },
    });

    useEffect(() => {
        // setLoading(true);
        let id_req = req_id ? `&req_id=${req_id}` : "";
        (async () => {
            try {
                const { data } = await axiosPrivate.get(
                    "/master/vhcl?is_send=true" + id_req
                );
                setRows(data.data);
            } catch (error) {
                console.error(error);
            } finally {
                if (refresh) {
                    setRefresh();
                }
            }
        })();
    }, [refresh, req_id]);

    // useEffect(() => {
    //     console.log(rows);
    // }, [rows]);

    useEffect(() => {
        const dataSelected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        setSelectedRowsUp(dataSelected);
        if (props.setSomeVeh) {
            if (!table.getIsAllRowsSelected() && rows.length > 0) {
                props.setSomeVeh(true);
            } else {
                props.setSomeVeh(false);
            }
        }
    }, [rows, rowSelected]);

    return (
        <>
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
