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
    KeyboardArrowRight,
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
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import AutocompleteFilter from "../input/AutocompleteFilterComp";
import { Axios } from "../../api/axios";
import moment from "moment/moment";

export default function TableRecapReport({ onsetFilterData }) {
    const exportData = async id_loadnote => {
        try {
            const response = await Axios.post(
                "/ln/pdf",
                {
                    loadnote: id_loadnote,
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
    const column = useMemo(
        () => [
            {
                id: "exportln",
                cell: ({ row }) => {
                    if (moment(row.original.cre_date) > moment()) {
                        return (
                            <Tooltip title="Download PDF">
                                <IconButton
                                    onClick={async () => {
                                        await exportData(row.original.id);
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
                header: "Loading Note",
                accessorKey: "ln_num",
            },
            {
                header: "Loading Note Date",
                accessorKey: "cre_date",
            },
            {
                header: "Do Number",
                accessorKey: "id_do",
            },
            {
                header: "Incoterms",
                accessorFn: row => `${row.inco_1} - ${row.inco_2}`,
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
                header: "Contract Quantity",
                accessorFn: row =>
                    `${row.con_qty?.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )}  ${row.uom}`,
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
                header: "Planning Quantity",
                accessorFn: row =>
                    `${row.plan_qty?.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )}  ${row.uom}`,
                cell: props => props.getValue(),
            },
            {
                header: "Bruto",
                accessorKey: "bruto",
                cell: props => props.getValue(),
            },
            {
                header: "Tarra",
                accessorKey: "tarra",
                cell: props => props.getValue(),
            },
            {
                header: "Netto",
                accessorKey: "netto",
                cell: props => props.getValue(),
            },
            {
                header: "Receive",
                accessorKey: "receive",
                cell: props => props.getValue(),
            },
            {
                header: "Deduction",
                accessorKey: "deduction",
                cell: props => props.getValue(),
            },
        ],
        []
    );

    const [data, setData] = useState([]);
    const dataRows = useMemo(() => data, [data]);
    const [sorting, setSorting] = useState([]);
    const dataSorting = useMemo(() => sorting, [sorting]);
    const [columnFilter, setColumnfilter] = useState([]);
    const dataColFilter = useMemo(() => columnFilter, [columnFilter]);

    useEffect(() => {}, [columnFilter]);

    useEffect(() => {
        onsetFilterData({
            filters: dataColFilter,
            customer_id: "",
        });
        (async () => {
            try {
                const { data } = await Axios.post("/ln/recapss", {
                    filters: dataColFilter,
                    customer_id: "",
                });
                setData(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [columnFilter]);

    const table = useReactTable({
        data: dataRows,
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
            sorting: dataSorting,
            columnFilters: dataColFilter,
        },
    });

    return (
        <TableContainer
            sx={{
                maxWidth: "85vw",
                height: "80vh",
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
                                                        column={header.column}
                                                    />
                                                </div>
                                            ) : (
                                                <></>
                                            )}
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignContent: "center",
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef
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
    );
}
