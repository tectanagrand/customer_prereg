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
    TextField,
} from "@mui/material";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { useTheme, styled } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material";
// import PaginationActionButton from "./PaginationActionButton";

function useSkipper() {
    const shouldSkipRef = useRef(true);
    const shouldSkip = shouldSkipRef.current;

    // Wrap a function with this to skip a pagination reset temporarily
    const skip = useCallback(() => {
        shouldSkipRef.current = false;
    }, []);

    useEffect(() => {
        shouldSkipRef.current = true;
    });

    return [shouldSkip, skip];
}

export default function TableLoadingNoteReq({
    DoNum,
    CustNum,
    setLoading,
    setSelectedRowsUp,
    resetRows,
}) {
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const rowData = useMemo(() => rows, [rows]);
    const [rowSelected, setSelectedRows] = useState([]);
    const selectedRows = useMemo(() => rowSelected, [rowSelected]);
    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
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
                cell: ({ row }) =>
                    row.original.cust_code + " - " + row.original.cust_name,
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
                cell: ({ getValue, row: { index }, column: { id }, table }) => {
                    const initVal = getValue();
                    const [value, setValue] = useState(initVal);
                    const onBlur = () => {
                        table.options.meta?.updateData(index, id, value);
                    };

                    useEffect(() => {
                        setValue(initVal);
                    }, [initVal]);

                    return (
                        <>
                            <TextField
                                value={value}
                                onBlur={onBlur}
                                onChange={e => {
                                    setValue(e.target.value);
                                }}
                                type="number"
                            />
                        </>
                    );
                },
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
        data: rowData,
        columns,
        getRowId: row => row.id,
        getCoreRowModel: getCoreRowModel(),
        // onColumnFiltersChange: onColumnFilterChange,
        onRowSelectionChange: setSelectedRows,
        autoResetPageIndex,
        state: {
            rowSelection: rowSelected,
        },
        meta: {
            updateData: (rowIndex, columnId, value) => {
                skipAutoResetPageIndex();
                setRows(prev =>
                    prev.map((row, index) => {
                        if (index === rowIndex) {
                            return { ...prev[rowIndex], [columnId]: value };
                        }
                        return row;
                    })
                );
            },
        },
    });

    useEffect(() => {
        console.log("Filters changed Table:", DoNum, CustNum);
    }, [DoNum, CustNum]);

    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                if (DoNum !== "" && CustNum !== "") {
                    const { data } = await Axios.post("/ln/osreq", {
                        filters: [
                            { id: "id_do", value: DoNum },
                            { id: "cust_code", value: CustNum },
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
    }, [DoNum, CustNum, resetRows]);

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
