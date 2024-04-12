import {
    TableContainer,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    Checkbox,
    Table,
    IconButton,
} from "@mui/material";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    flexRender,
} from "@tanstack/react-table";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import CheckBoxPermission from "../input/CheckBoxPermission";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";

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

export default function NewTableMenuAccess({ dtAccessUp, role_id }) {
    const axiosPrivate = useAxiosPrivate();
    const [rowsData, setRows] = useState([]);
    const [selectedRows, setSelectedRows] = useState({});
    const [searchParams] = useSearchParams();
    const { handleSubmit, register } = useForm();
    const columns = useMemo(() => [
        {
            id: "expand",
            enableSorting: false,
            cell: ({ row }) => {
                return row.getCanExpand() &&
                    row.depth === 0 &&
                    row.subRows.length > 0 ? (
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
            accessorKey: "menu_page",
            header: ({ table, row }) => {
                return (
                    <>
                        {/* <CheckBoxPermission
                            {...{
                                checked: table.getIsAllRowsSelected(),
                                indeterminate: table.getIsSomeRowsSelected(),
                                onClick:
                                    table.getToggleAllRowsSelectedHandler(),
                            }}
                        />{" "} */}
                        <p>Permission</p>
                    </>
                );
            },
            cell: ({ row, getValue }) => {
                const onClick = e => {
                    table.options.meta.headerOnChecked(row, e.target.checked);
                    row.toggleSelected(true);
                };
                const data = row.original;
                const checkedSome =
                    data.fcreate || data.fread || data.fupdate || data.fdelete;
                return (
                    <div style={{ paddingLeft: row.depth * 2 + "rem" }}>
                        <CheckBoxPermission
                            {...{
                                checked: checkedSome,
                                indeterminate: row.getIsSomeSelected(),
                                onChange: onClick,
                            }}
                        />
                        {getValue()}
                    </div>
                );
            },
        },
        {
            id: "fcreate",
            accessorKey: "fcreate",
            header: "Create",
            cell: ({ row, column, table, getValue }) => {
                const [checked, setChecked] = useState(getValue());
                useEffect(() => {
                    setChecked(checked);
                }, [getValue]);
                return (
                    <Checkbox
                        onClick={() => {
                            setChecked(!checked);
                            table.options.meta.checkedUserPermission(
                                row.index,
                                column.id,
                                !checked,
                                row
                            );
                        }}
                        checked={checked}
                    />
                );
            },
        },
        {
            id: "fread",
            accessorKey: "fread",
            header: "Read",
            cell: ({ row, column, table, getValue }) => {
                const [checked, setChecked] = useState(getValue());
                useEffect(() => {
                    setChecked(checked);
                }, [getValue]);
                return (
                    <Checkbox
                        onClick={() => {
                            setChecked(!checked);
                            table.options.meta.checkedUserPermission(
                                row.index,
                                column.id,
                                !checked,
                                row
                            );
                        }}
                        checked={checked}
                    />
                );
            },
        },
        {
            id: "fupdate",
            accessorKey: "fupdate",
            header: "Update",
            cell: ({ row, column, table, getValue }) => {
                const [checked, setChecked] = useState(getValue());
                useEffect(() => {
                    setChecked(checked);
                }, [getValue]);
                return (
                    <Checkbox
                        onClick={() => {
                            setChecked(!checked);
                            table.options.meta.checkedUserPermission(
                                row.index,
                                column.id,
                                !checked,
                                row
                            );
                        }}
                        checked={checked}
                    />
                );
            },
        },
        {
            id: "fdelete",
            accessorKey: "fdelete",
            header: "Delete",
            cell: ({ row, column, table, getValue }) => {
                const [checked, setChecked] = useState(getValue());
                useEffect(() => {
                    setChecked(checked);
                }, [getValue]);
                return (
                    <Checkbox
                        onClick={() => {
                            setChecked(!checked);
                            table.options.meta.checkedUserPermission(
                                row.index,
                                column.id,
                                !checked,
                                row
                            );
                        }}
                        checked={checked}
                    />
                );
            },
        },
    ]);
    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

    useEffect(() => {
        (async () => {
            const { data } = await axiosPrivate.post("/user/role", {
                role_id: searchParams.get("id_role") ?? "",
            });
            setRows(data.data);
        })();
    }, []);

    useEffect(() => {
        const flattenRows = [];
        const selectedMap = new Map(Object.entries(selectedRows));
        const selectedFlatten = [];
        rowsData.forEach(item => {
            flattenRows.push(item);
            if (item.subRows.length > 0) {
                item.subRows.forEach(itemSub => {
                    flattenRows.push(itemSub);
                });
            }
        });
        dtAccessUp(flattenRows);
    }, [selectedRows, rowsData]);

    const table = useReactTable({
        data: rowsData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: row => row.id,
        getRowCanExpand: () => true,
        onRowSelectionChange: setSelectedRows,
        getExpandedRowModel: getExpandedRowModel(),
        getSubRows: row => row.subRows,
        enableRowSelection: true,
        autoResetPageIndex,
        enableSubRowSelection: true,
        state: {
            rowSelection: selectedRows,
        },
        meta: {
            checkedUserPermission: (rowIndex, columnId, value, rowTable) => {
                skipAutoResetPageIndex();
                const depth = rowTable.depth;
                setRows(prev =>
                    prev.map((row, index) => {
                        if (rowIndex === index && depth === 0) {
                            console.log("value parent triggered");
                            row[columnId] = value;
                            rowTable.toggleSelected(true);
                            // if (
                            //     row.fcreate
                            //     // row.fupdate ||
                            //     // row.fdelete ||
                            //     // row.fread
                            // ) {
                            //     rowTable.toggleSelected(true);
                            // } else {
                            //     rowTable.(false);
                            // }
                            return { ...prev[rowIndex], [columnId]: value };
                        } else if (depth === 1) {
                            console.log("value child triggered");
                            const parent = rowTable.getParentRow();
                            if (parent.index === index) {
                                const dataRow = row.subRows[rowIndex];
                                dataRow[columnId] = value;
                                rowTable.toggleSelected(true);
                                // if (
                                //     dataRow.fcreate
                                //     // row.fupdate ||
                                //     // row.fdelete ||
                                //     // row.fread
                                // ) {
                                //     rowTable.toggleSelected(true);
                                // } else {
                                //     rowTable.toggleSelected(false);
                                // }
                                return {
                                    ...prev[parent.index],
                                    subRows: prev[parent.index].subRows.map(
                                        (item, index) => {
                                            if (index === rowIndex) {
                                                return {
                                                    ...item,
                                                    [columnId]: value,
                                                };
                                            } else {
                                                return {
                                                    ...item,
                                                };
                                            }
                                        }
                                    ),
                                };
                            }
                        }
                        return row;
                    })
                );
            },
            headerOnChecked: (rowData, value) => {
                skipAutoResetPageIndex();
                const depth = rowData.depth;
                const indexDt = rowData.index;
                setRows(prev =>
                    prev.map((row, index) => {
                        if (depth === 0 && indexDt === index) {
                            return {
                                ...prev[indexDt],
                                fcreate: value,
                                fupdate: value,
                                fdelete: value,
                                fread: value,
                                subRows: prev[indexDt].subRows.map(item => ({
                                    ...item,
                                    fcreate: value,
                                    fupdate: value,
                                    fdelete: value,
                                    fread: value,
                                })),
                            };
                        } else if (depth === 1) {
                            const parent = rowData.getParentRow();
                            if (parent.index === index) {
                                return {
                                    ...prev[parent.index],
                                    subRows: prev[parent.index].subRows.map(
                                        (item, index) => {
                                            if (index === indexDt) {
                                                return {
                                                    ...item,
                                                    fcreate: value,
                                                    fupdate: value,
                                                    fdelete: value,
                                                    fread: value,
                                                };
                                            } else {
                                                return item;
                                            }
                                        }
                                    ),
                                };
                            }
                        }
                        return row;
                    })
                );
            },
        },
    });
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
