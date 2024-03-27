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
import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

export default function TableChildCustLN({ dataChild }) {
    const theme = useTheme();
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
            {
                header: "Error Message",
                accessorKey: "error_msg",
                cell: props => props.getValue(),
            },
            {
                header: "Current Position",
                accessorKey: "current_pos",
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
