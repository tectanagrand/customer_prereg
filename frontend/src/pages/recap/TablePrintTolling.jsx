import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getSortedRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    FileDownload,
} from "@mui/icons-material";
import {
    TableContainer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Box,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import AutocompleteFilter from "../../component/input/AutocompleteFilterComp";
import SearchFieldComp from "../../component/input/SearchFieldComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

export default function TablePrintTolling() {
    const axiosPrivate = useAxiosPrivate();
    const exportData = async id_loadnote => {
        try {
            const response = await axiosPrivate.post(
                "/tol/print",
                {
                    id: id_loadnote,
                },
                { responseType: "blob", withCredentials: true }
            );
            const filename = response.headers
                .get("Content-Disposition")
                .split("filename=")[1]
                .replace(/['"]+/g, "");
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create a link element and simulate a click to trigger the download
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            URL.revokeObjectURL(url);
        } catch (error) {
            console.log(error);
        }
    };
    const [refresh, setRefresh] = useState(false);
    const column = useMemo(
        () => [
            {
                id: "exportln",
                cell: ({ row }) => {
                    if (row.original.print_count < 3) {
                        return (
                            <Tooltip title="Download PDF">
                                <IconButton
                                    onClick={async () => {
                                        await exportData(row.original.id);
                                        setRefresh(prev => !prev);
                                    }}
                                >
                                    <FileDownload></FileDownload>
                                </IconButton>
                            </Tooltip>
                        );
                    } else {
                        return <></>;
                    }
                },
            },
            {
                header: "LN. Tolling",
                accessorKey: "ln_num",
            },
            {
                header: "Tanggal Request LN",
                accessorKey: "cre_date",
            },
            {
                header: "Tanggal Pengambilan / Muat",
                accessorKey: "tanggal_surat_jalan",
            },
            {
                header: "STO Number",
                accessorKey: "id_sto",
            },
            {
                header: "Planning Quantity",
                accessorFn: row =>
                    `${row.plan_qty?.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )}  ${row.uom}`,
                cell: props => props.getValue(),
            },
            {
                header: "Company",
                accessorKey: "company",
            },
            {
                header: "Plant",
                accessorKey: "plant",
            },
            {
                header: "Customer",
                accessorFn: row => `${row.kunnr} - ${row.name_1}`,
                cell: props => props.getValue(),
            },
            {
                header: "Material",
                accessorKey: "desc_con",
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
        ],
        []
    );

    const [data, setData] = useState([]);
    const [que, _setQue] = useState("");
    const [sorting, setSorting] = useState([]);
    const [columnFilter, setColumnfilter] = useState([]);

    const setQue = value => {
        _setQue(value);
    };

    useEffect(() => {
        (async () => {
            let filters = columnFilter.slice();
            if (que !== "" && que) {
                filters.push({ id: "q", value: que });
            }
            try {
                const { data } = await axiosPrivate.post("/tol/getprint", {
                    filters: filters,
                    customer_id: "",
                });
                setData(data.data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [columnFilter, refresh, que]);

    const table = useReactTable({
        data: data,
        columns: column,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnfilter,
        getFacetedUniqueValues: getFacetedUniqueValues(),
        manualFiltering: true,
        state: {
            sorting: sorting,
            columnFilters: columnFilter,
        },
    });

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "flex-end",
                }}
            >
                <SearchFieldComp setQuery={setQue} />
            </Box>
            <TableContainer
                sx={{
                    width: "100%",
                    height: "100%",
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
                                                {header.column.getCanFilter() ? (
                                                    <div>
                                                        <AutocompleteFilter
                                                            column={
                                                                header.column
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <></>
                                                )}
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignContent:
                                                                "center",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(
                                                            header.column
                                                                .columnDef
                                                                .header,
                                                            header.getContext()
                                                        )}
                                                        {header.column.getCanSort() ? (
                                                            header.column.getNextSortingOrder() ===
                                                            "asc" ? (
                                                                <KeyboardArrowDown
                                                                    sx={{
                                                                        width: "1.5rem",
                                                                        height: "1.5rem",
                                                                    }}
                                                                />
                                                            ) : header.column.getNextSortingOrder() ===
                                                              "desc" ? (
                                                                <KeyboardArrowUp
                                                                    sx={{
                                                                        width: "1.5rem",
                                                                        height: "1.5rem",
                                                                    }}
                                                                />
                                                            ) : (
                                                                ""
                                                            )
                                                        ) : (
                                                            ""
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
                                <TableRow key={row.id} hover>
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
        </Box>
    );
}
