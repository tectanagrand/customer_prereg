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
    TableFooter,
} from "@mui/material";
import { NumericFormat } from "react-number-format";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { checkboxClasses } from "@mui/material";
import { useTheme } from "@mui/material/styles";
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

export default function TableApprovalLNUPS({
    DoNum,
    CustNum,
    setLoading,
    setSelectedRowsUp,
    setRemainingUp,
    remaining,
    resetRows,
}) {
    const axiosPrivate = useAxiosPrivate();
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const rowData = useMemo(() => rows, [rows]);
    const [rowSelected, setSelectedRows] = useState([]);
    const [totalSelected, setTotal] = useState(0);
    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
    const initialOS = useRef(0);

    const uniformSelection = (table, row) => {
        const data_selected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        let x = row.original;
        //check is different
        if (data_selected.length > 0) {
            let different = !data_selected.some(
                item =>
                    item.plant === x.plant &&
                    item.fac_plant === x.fac_plant &&
                    item.oth_plant === x.oth_plant &&
                    item.fac_sloc === x.fac_sloc &&
                    item.oth_sloc === x.oth_sloc &&
                    item.fac_valtype === x.fac_valtype &&
                    item.oth_valtype === x.oth_valtype &&
                    item.material === x.material &&
                    item.inco_1 === x.inco_1
            );
            if (different) {
                table.resetRowSelection();
            }
        }
    };

    const columns = useMemo(() => {
        return [
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
                header: "Request No",
                accessorKey: "ticket_no",
                cell: props => props.getValue(),
            },
            {
                header: "DO Number",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "PO Number",
                accessorKey: "id_po",
                cell: props => props.getValue(),
            },
            {
                header: "STO Number",
                accessorKey: "id_sto",
                cell: props => props.getValue(),
            },
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
                cell: ({ row }) => {
                    if (row.original.cust_code) {
                        return (
                            row.original.cust_code +
                            " - " +
                            row.original.cust_name
                        );
                    } else if (row.original.intr_code) {
                        return (
                            row.original.intr_code +
                            " - " +
                            row.original.intr_name
                        );
                    } else {
                        return (
                            row.original.ven_code +
                            " - " +
                            row.original.ven_name
                        );
                    }
                },
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
                                    setValue(
                                        e.target.value.replace(/,/g, "").trim()
                                    );
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
    }, []);

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
                let totalQuantity = remaining;
                let totalUsed = 0;
                setRows(prev =>
                    prev.map((row, index) => {
                        totalQuantity += parseFloat(
                            prev[index][columnId] === ""
                                ? 0
                                : prev[index][columnId]
                        );
                        if (index === rowIndex) {
                            totalUsed += parseFloat(value === "" ? 0 : value);
                            return { ...prev[rowIndex], [columnId]: value };
                        } else {
                            totalUsed += parseFloat(
                                prev[index][columnId] === ""
                                    ? 0
                                    : prev[index][columnId]
                            );
                        }
                        return row;
                    })
                );

                setRemainingUp(totalQuantity - totalUsed);
            },
        },
    });

    useEffect(() => {
        let totalSelect = 0;
        const dataSelected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        for (const row of dataSelected) {
            totalSelect += parseInt(row.plan_qty);
        }
        setTotal(totalSelect);
    }, [rowSelected]);

    useEffect(() => {
        table.resetRowSelection();
        setLoading(true);
        if (DoNum !== "" && CustNum !== "" && DoNum && CustNum) {
            const updateSAPRemaining = setInterval(async () => {
                const { data: do_data } = await axiosPrivate.get(
                    `/master/doups?do_num=${DoNum}`
                );
                const os_data =
                    parseFloat(do_data.SLIP.KWMENG) -
                    parseFloat(do_data.TOTALSPEND);
                setRemainingUp(prev => prev + (os_data - initialOS.current));
            }, 120 * 1000);
            (async () => {
                let code_filter = "";
                if (CustNum.slice(0, 2) === "LN") {
                    code_filter = "ven_code";
                } else if (CustNum.slice(0, 2) === "CI") {
                    code_filter = "intr_code";
                } else {
                    code_filter = "cust_code";
                }
                try {
                    const { data: do_data } = await axiosPrivate.get(
                        `/master/doups?do_num=${DoNum}`
                    );
                    const os_data =
                        parseFloat(do_data.SLIP.KWMENG) -
                        parseFloat(do_data.TOTALSPEND);

                    const { data } = await axiosPrivate.post("/ln/osreq", {
                        filters: [
                            { id: "id_do", value: DoNum },
                            { id: code_filter, value: CustNum },
                        ],
                        cgrp: "UPSTREAM",
                    });
                    setRemainingUp(os_data);
                    setRows(data.data);
                    initialOS.current = os_data;
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            })();
            return () => clearInterval(updateSAPRemaining);
        } else {
            setRows([]);
            setRemainingUp(0);
        }
        setLoading(false);
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
                    height: "25rem",
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
                    {table.getRowModel().rows.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TableCell
                                    colspan={columns.length - 2}
                                    sx={{
                                        left: 0,
                                        bottom: 0, // <-- KEY
                                        zIndex: 2,
                                        position: "sticky",
                                        backgroundColor:
                                            theme.palette.primary.main,
                                        color: "white",
                                    }}
                                >
                                    Total :
                                </TableCell>
                                <TableCell
                                    colspan={1}
                                    sx={{
                                        left: 0,
                                        bottom: 0, // <-- KEY
                                        zIndex: 2,
                                        position: "sticky",
                                        backgroundColor:
                                            theme.palette.primary.main,
                                        color: "white",
                                    }}
                                >
                                    {totalSelected}
                                </TableCell>
                                <TableCell
                                    colspan={1}
                                    sx={{
                                        left: 0,
                                        bottom: 0, // <-- KEY
                                        zIndex: 2,
                                        position: "sticky",
                                        backgroundColor:
                                            theme.palette.primary.main,
                                        color: "white",
                                    }}
                                ></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>
        </>
    );
}
