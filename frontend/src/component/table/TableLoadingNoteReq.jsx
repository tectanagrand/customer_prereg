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
import { useState, useEffect, useMemo } from "react";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { useTheme, styled } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material";
// import PaginationActionButton from "./PaginationActionButton";

export default function TableLoadingNoteReq({
    filters,
    setLoading,
    setSelectedRowsUp,
}) {
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const dataFilters = useMemo(() => filters, [filters]);
    const [rowSelected, setSelectedRows] = useState([]);
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
                header: "DO Number",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "Item Rule",
                accessorKey: "rules",
                cell: props => props.getValue(),
            },
            {
                header: "Plant",
                accessorKey: "plant",
                cell: props => props.getValue(),
            },
            {
                header: "Customer",
                accessorKey: "cust_code",
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
                header: "Create Date",
                accessorKey: "cre_date",
                cell: props => props.getValue(),
            },
            {
                header: "Planned Qty",
                accessorKey: "plan_qty",
                cell: props => props.getValue(),
            },
            {
                header: "UOM",
                accessorKey: "uom",
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
        const dataSelected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        setSelectedRowsUp(dataSelected);
    }, [rowSelected]);
    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                if (filters.DoNum !== "" && filters.CustNum !== "") {
                    const { data } = await Axios.post("/ln/osreq", {
                        filters: [
                            { id: "id_do", value: dataFilters.DoNum },
                            { id: "cust_code", value: dataFilters.CustNum },
                        ],
                    });
                    setRows(data.data);
                } else {
                    setRows([]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, [dataFilters]);
    // console.log(dataFilters);
    return (
        <>
            {/* <p>Rows Selected :</p>
            {dataSelected.map(item => {
                console.log(item);
                return <p key={item.id}>{item.id_do}</p>;
            })} */}
            <TableContainer
                sx={{
                    height: "35rem",
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
