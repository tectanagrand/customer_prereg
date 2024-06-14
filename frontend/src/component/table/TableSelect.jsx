import {
    Table,
    TableRow,
    TableCell,
    TableBody,
    TableHead,
    TableContainer,
} from "@mui/material";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useSession } from "../../provider/sessionProvider";
import { CheckBoxTable } from "../input/CheckBoxTable";
import { useTheme } from "@mui/material/styles";
import { checkboxClasses } from "@mui/material";

import { useEffect, useMemo, useState } from "react";

const TableSelect = ({
    data,
    columns,
    setSelected,
    sx,
    notselect,
    uniform,
    refresh,
    ...props
}) => {
    const [rowSelected, setSelectedRows] = useState([]);
    const { session } = useSession();
    const theme = useTheme();

    const uniformSelection = (table, row) => {
        const data_selected = table
            .getSelectedRowModel()
            .rows.map(item => item.original);
        let x = row.original;
        //check is different
        if (uniform) {
            if (data_selected.length > 0) {
                let different = !data_selected.some(item => uniform(item, x));
                if (different) {
                    table.resetRowSelection();
                }
            }
        }
    };

    const setSelectedRowsUp = value => {
        setSelected(value);
    };
    const tableColumns = useMemo(
        () => [
            {
                id: "select",
                header: ({ table }) => {
                    return <></>;
                },
                cell: ({ row }) => {
                    if (notselect(row.original)) {
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
                    } else {
                        return <></>;
                    }
                },
            },
            ...columns,
        ],
        [columns]
    );

    const table = useReactTable({
        data: data,
        columns: tableColumns,
        getRowId: row => row.id,
        getCoreRowModel: getCoreRowModel(),
        // onColumnFiltersChange: onColumnFilterChange,
        onRowSelectionChange: setSelectedRows,
        state: {
            rowSelection: rowSelected,
        },
    });

    useEffect(() => {
        console.log(refresh);
        if (refresh) {
            table.resetRowSelection();
            setSelectedRowsUp([]);
        } else {
            if (table.getSelectedRowModel()) {
                const dataSelected = table
                    .getSelectedRowModel()
                    .rows.map(item => item.original);
                setSelectedRowsUp(dataSelected);
            }
        }
    }, [data, rowSelected, refresh]);

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
};

export default TableSelect;
