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
    IconButton,
    Tooltip,
    Typography,
    Box,
} from "@mui/material";
import { useState, useEffect, useMemo, useRef } from "react";
import { Edit, Delete } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
// import PaginationActionButton from "./PaginationActionButton";

export default function TableDriver({ refresh, editData, deleteData }) {
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const rowData = useMemo(() => rows, [rows]);
    const axiosPrivate = useAxiosPrivate();
    const source = useRef("");
    // const { onPaginationChange, pagination, limit, skip } = usePagination();
    // const { sorting, onSortingChange, order, field } = useSorting();
    // const { filters, onColumnFilterChange } = useFilter();
    const columns = useMemo(
        () => [
            {
                header: "Nomor SIM",
                accessorKey: "driver_id",
                cell: props => props.getValue(),
            },
            {
                header: "Nama",
                accessorKey: "driver_name",
                cell: props => props.getValue(),
            },
            {
                header: "Tempat Lahir",
                accessorKey: "tempat_lahir",
                cell: props => props.getValue(),
            },
            {
                header: "Tanggal Lahir",
                accessorKey: "tanggal_lahir",
                cell: props => props.getValue(),
            },
            {
                header: "Alamat",
                accessorKey: "alamat",
                cell: props => props.getValue(),
            },
            {
                header: "No. Telfon",
                accessorKey: "no_telp",
                cell: props => props.getValue(),
            },
            {
                header: "Foto SIM",
                accessorKey: "foto_sim",
                cell: props => props.getValue(),
            },
            {
                header: "Foto Driver",
                accessorKey: "foto_driver",
                cell: ({ getValue }) => {
                    console.log(`${source.current}${getValue()}`);
                    return (
                        <>
                            <div>
                                <img
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        objectFit: "cover",
                                        position: "relative",
                                        objectPosition: "25% 25%",
                                    }}
                                    src={`${source.current}/${getValue()}`}
                                    alt={getValue()}
                                ></img>
                            </div>
                        </>
                    );
                },
            },
            {
                header: "Status",
                accessorKey: "is_send",
                cell: ({ row }) => {
                    if (row.original.is_send) {
                        return <p>Sudah Dikirim Email</p>;
                    } else {
                        return "";
                    }
                },
            },
            {
                id: "action",
                cell: ({ row }) => {
                    let buttons = [];
                    if (!row.original.is_send) {
                        buttons.push(
                            <Tooltip
                                key={row.id + "-edit"}
                                title={<Typography>Edit</Typography>}
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "primary.main",
                                        color: theme.palette.primary
                                            .contrastText,
                                        ":hover": {
                                            color: theme.palette.grey[800],
                                        },
                                        mx: 1,
                                    }}
                                    onClick={() => editData(row.original.id)}
                                >
                                    <Edit></Edit>
                                </IconButton>
                            </Tooltip>
                        );
                        buttons.push(
                            <Tooltip
                                key={row.id + "-delete"}
                                title={<Typography>Delete</Typography>}
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "error.main",
                                        color: theme.palette.error.contrastText,
                                        ":hover": {
                                            color: theme.palette.grey[800],
                                        },
                                        mx: 1,
                                    }}
                                    onClick={() => deleteData(row.original.id)}
                                >
                                    <Delete></Delete>
                                </IconButton>
                            </Tooltip>
                        );
                    }
                    return buttons;
                },
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
    });

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get("/master/drvr");
                source.current = data.source;
                setRows(data.data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [refresh]);

    // useEffect(() => {
    //     console.log(rows);
    // }, [rows]);

    return (
        <>
            <TableContainer
                sx={{
                    height: "38rem",
                    maxWidth: "90rem",
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
