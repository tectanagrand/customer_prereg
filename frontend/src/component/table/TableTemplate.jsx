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
    Box,
} from "@mui/material";
import { useMemo } from "react";

const TableTemplate = ({ data, columns, sx }) => {
    const dataFeed = useMemo(() => data, [data]);

    const table = useReactTable({
        columns,
        data: dataFeed,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <Box sx={{ ...sx }}>
            <TableContainer sx={{ ...sx }}>
                <Table stickyHeader>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        return (
                                            <TableCell key={header.id}>
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext()
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
                                        if (cell.column.id === "Action") {
                                            console.log(cell.getValue());
                                        }
                                        if (
                                            cell.column.id === "request_id" ||
                                            cell.column.id === "status"
                                        ) {
                                            if (
                                                cell.getValue() !== "" &&
                                                cell.getValue()
                                            ) {
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        rowSpan={
                                                            row.original.span
                                                        }
                                                        align={
                                                            cell.column.id ===
                                                            "Action"
                                                                ? "center"
                                                                : "left"
                                                        }
                                                        sx={{
                                                            borderUpper:
                                                                "1px solid black",
                                                            borderBottom:
                                                                "1px solid black",
                                                            borderRight:
                                                                "1px solid black",
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                );
                                            }
                                        } else if (cell.column.id === "uuid") {
                                            if (cell.getValue() === "") {
                                                return "";
                                            } else {
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        rowSpan={
                                                            row.original.span
                                                        }
                                                        align={
                                                            cell.column.id ===
                                                            "Action"
                                                                ? "center"
                                                                : "left"
                                                        }
                                                        sx={{
                                                            borderUpper:
                                                                "1px solid black",
                                                            borderBottom:
                                                                "1px solid black",
                                                            borderRight:
                                                                "1px solid black",
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                );
                                            }
                                        } else {
                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{
                                                        borderUpper:
                                                            "1px solid black",
                                                        borderBottom:
                                                            "1px solid black",
                                                        borderRight:
                                                            "1px solid black",
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        }
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default TableTemplate;
