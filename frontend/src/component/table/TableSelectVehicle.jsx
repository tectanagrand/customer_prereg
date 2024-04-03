import { Axios } from "../../api/axios";
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
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { useTheme } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material";
// import PaginationActionButton from "./PaginationActionButton";

export default function TableSelectVehicle({ setLoading, setSelectedRowsUp }) {
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const rowData = useMemo(() => rows, [rows]);
    const [rowSelected, setSelectedRows] = useState([]);
    const selectedRows = useMemo(() => rowSelected, [rowSelected]);
    // const { onPaginationChange, pagination, limit, skip } = usePagination();
    // const { sorting, onSortingChange, order, field } = useSorting();
    // const { filters, onColumnFilterChange } = useFilter();
    const columns = useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <CheckBoxTable
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler(),
                            sx: {
                                [`&, &.${checkboxClasses.checked}`]: {
                                    color: theme.palette.grey[100],
                                },
                                color: theme.palette.grey[100],
                            },
                        }}
                    />
                ),
                cell: ({ row }) => {
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
                },
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
        data: rowData,
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
        (async () => {
            try {
                const { data } = await Axios.get("/master/vhcl?is_send=true");
                setRows(data);
            } catch (error) {
                console.error(error);
            } finally {
                // setLoading(false);
            }
        })();
    }, []);

    // useEffect(() => {
    //     console.log(rows);
    // }, [rows]);

    useEffect(() => {
        console.log(selectedRows);
        const dataSelected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        setSelectedRowsUp(dataSelected);
    }, [rows, rowSelected]);

    return (
        <>
            <TableContainer
                sx={{
                    height: "30rem",
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
