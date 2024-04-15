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
    TextField,
} from "@mui/material";
import { NumericFormat } from "react-number-format";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { useTheme, styled } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
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
    who,
}) {
    // console.log(who);
    const axiosPrivate = useAxiosPrivate();
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const rowData = useMemo(() => rows, [rows]);
    const [rowSelected, setSelectedRows] = useState([]);
    const selectedRows = useMemo(() => rowSelected, [rowSelected]);
    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
    const location = useLocation();
    const path = location.pathname.split("/");
    const curposPath = path[path.length - 1];

    const uniformSelection = (table, row) => {
        const data_selected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        let x = row.original;
        //check is different
        if (data_selected.length > 0) {
            let different = !data_selected.some(
                item =>
                    item.fac_plant === x.fac_plant &&
                    item.oth_plant === x.oth_plant &&
                    item.fac_sloc === x.fac_sloc &&
                    item.oth_sloc === x.oth_sloc &&
                    item.fac_valtype === x.fac_valtype &&
                    item.oth_valtype === x.oth_valtype &&
                    item.material === x.material
            );
            if (different) {
                table.resetRowSelection();
            }
        }
    };
    // const { onPaginationChange, pagination, limit, skip } = usePagination();
    // const { sorting, onSortingChange, order, field } = useSorting();
    // const { filters, onColumnFilterChange } = useFilter();
    const columns = useMemo(() => {
        let additional = [];
        let lnnum = [];
        if (who === "wb") {
            additional = [
                {
                    header: "Fac. Store Loc",
                    accessorKey: "fac_sloc",
                    cell: props => props.getValue(),
                },
                {
                    header: "Oth. Store Loc.",
                    accessorKey: "oth_sloc",
                    cell: props => props.getValue(),
                },
                {
                    header: "Fac. Val. Type.",
                    accessorKey: "fac_valtype",
                    cell: props => props.getValue(),
                },
                {
                    header: "Oth. Val. Type.",
                    accessorKey: "oth_valtype",
                    cell: props => props.getValue(),
                },
            ];
            lnnum = [
                {
                    header: "Loading Note Num.",
                    accessorKey: "ln_num",
                    cell: props => props.getValue(),
                },
            ];
        }
        return [
            {
                id: "select",
                header: ({ table }) =>
                    who === "log" && (
                        <CheckBoxTable
                            {...{
                                checked: table.getIsAllRowsSelected(),
                                indeterminate: table.getIsSomeRowsSelected(),
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
                    ),
                cell: ({ table, row }) => {
                    return (
                        <CheckBoxTable
                            {...{
                                checked: row.getIsSelected(),
                                disabled: !row.getCanSelect(),
                                indeterminate: row.getIsSomeSelected(),
                                onChange: e => {
                                    // console.log(e);
                                    uniformSelection(table, row);
                                    const selectHandler =
                                        row.getToggleSelectedHandler(e);
                                    selectHandler(e);
                                },
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
            ...lnnum,
            {
                header: "Plant",
                accessorKey: "plant",
                cell: props => props.getValue(),
            },
            {
                header: "Material",
                accessorKey: "material",
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
                header: "Tanggal Surat Jalan",
                accessorKey: "tanggal_surat_jalan",
                cell: props => props.getValue(),
            },
            ...additional,
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
                            <NumericFormat
                                customInput={TextField}
                                thousandSeparator
                                value={value}
                                onBlur={onBlur}
                                onChange={e => {
                                    setValue(e.target.value);
                                }}
                                sx={{
                                    input: {
                                        "&.MuiOutlinedInput-input.Mui-disabled":
                                            {
                                                WebkitTextFillColor:
                                                    theme.palette.grey[500],
                                                color: theme.palette.grey[500],
                                            },
                                    },
                                    maxWidth: "10rem",
                                }}
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
        ];
    }, [who]);

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

    // useEffect(() => {
    //     console.log("Filters changed Table:", DoNum, CustNum);
    // }, [DoNum, CustNum]);

    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                // console.log(DoNum);
                // console.log(CustNum);
                if (DoNum !== "" && CustNum !== "") {
                    const { data } = await axiosPrivate.post("/ln/osreq", {
                        filters: [
                            { id: "id_do", value: DoNum },
                            { id: "cust_code", value: CustNum },
                        ],
                        who: who,
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
        // console.log(selectedRows);
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
                    minWidth: "100%",
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
