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
    TableFooter,
    IconButton,
    Tooltip,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AutocompleteFilter from "../input/AutocompleteFilterComp";
import { useTheme } from "@mui/material/styles";

import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { debounce } from "lodash";
import moment from "moment";
import DatePickerNoComp from "../common/DatePickerNoCont";

export default function TableReportLN({ onsetFilterData, isLoading }) {
    const formatNumber = (number, uom) => {
        return `${number.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${uom}`;
    };
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const paginate = useRef({
        limit: 20,
        offset: 0,
        max: 0,
    });
    const tableContainerRef = useRef(null);
    const [refresh, setRefresh] = useState(false);
    const [isFetch, setIsFetch] = useState(false);
    const [onMount, setOnMount] = useState(false);
    const [startDate, _setStartDate] = useState(null);
    const rangeDate = useRef(null);
    const setStartDate = value => {
        _setStartDate(moment(value));
        refreshTableData(moment(value), endDate);
    };
    const [endDate, _setEndDate] = useState(null);
    const setEndDate = value => {
        _setEndDate(moment(value));
        refreshTableData(startDate, moment(value));
    };
    const [summary, setSum] = useState({
        plan_qty: 0,
        bruto: 0,
        tarra: 0,
        netto: 0,
        receive: 0,
        deduction: 0,
    });
    const column = useMemo(
        () => [
            {
                header: "Do Number",
                accessorKey: "id_do",
            },
            {
                header: "Loading Note",
                accessorKey: "ln_num",
            },
            {
                header: "Tanggal Request LN",
                accessorKey: "cre_date",
                enableColumnFilter: false,
            },
            {
                header: "Tanggal Pengambilan / Muat",
                accessorKey: "tanggal_surat_jalan",
                enableColumnFilter: false,
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
                enableColumnFilter: false,
            },
            {
                header: "Bruto",
                accessorKey: "bruto",
                cell: props => props.getValue(),
                enableColumnFilter: false,
            },
            {
                header: "Tarra",
                accessorKey: "tarra",
                cell: props => props.getValue(),
                enableColumnFilter: false,
            },
            {
                header: "Netto",
                accessorKey: "netto",
                cell: props => props.getValue(),
                enableColumnFilter: false,
            },
            {
                header: "Receive",
                accessorKey: "receive",
                cell: props => props.getValue(),
                enableColumnFilter: false,
            },
            {
                header: "Deduction",
                accessorKey: "deduction",
                cell: props => props.getValue(),
                enableColumnFilter: false,
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
                enableColumnFilter: false,
            },
        ],
        []
    );

    const [data, setData] = useState([]);
    const memoizeData = useMemo(() => data, [data]);
    const [sorting, setSorting] = useState([]);
    const dataSorting = useMemo(() => sorting, [sorting]);
    const [columnFilter, setColumnfilter] = useState([]);
    const dataColFilter = useMemo(() => columnFilter, [columnFilter]);

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
            sorting: dataSorting,
            columnFilters: dataColFilter,
        },
    });

    const fetchData = async (limit, offset) => {
        try {
            setIsFetch(true);
            console.log("is fetching");
            let filters = dataColFilter;
            if (rangeDate.current != null) {
                filters = [...filters, ...rangeDate.current];
            }
            const { data } = await axiosPrivate.post("/ln/getinfln", {
                filters: filters,
                limit: limit,
                offset: offset,
            });
            paginate.current.max = data.count;
            paginate.current.offset = limit + offset;
            return { data: data.data, summary: data.sum_data };
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const refreshTableData = debounce(async (startDt, endDt) => {
        try {
            rangeDate.current = [
                {
                    id: "start_tsj",
                    value: startDt.format("DD-MM-YYYY"),
                },
                {
                    id: "end_tsj",
                    value: endDt.format("DD-MM-YYYY"),
                },
            ];
            const resultData = await fetchData(40, 0);
            setData(resultData.data);
            const sumData = resultData.summary;
            const uom = sumData.uom;
            setSum({
                plan_qty: formatNumber(sumData.plan_qty, uom),
                bruto: formatNumber(sumData.bruto, uom),
                tarra: formatNumber(sumData.tarra, uom),
                netto: formatNumber(sumData.netto, uom),
                deduction: formatNumber(sumData.deduction, uom),
                receive: formatNumber(sumData.receive, uom),
            });
        } catch (error) {
            console.error(error);
        }
    }, 500);

    useEffect(() => {
        onsetFilterData({
            filters: dataColFilter,
            customer_id: "",
        });
        setIsFetch(true);
        (async () => {
            try {
                const resultData = await fetchData(40, 0);
                setData(resultData.data);
                const sumData = resultData.summary;
                const uom = sumData.uom;
                setSum({
                    plan_qty: formatNumber(sumData.plan_qty, uom),
                    bruto: formatNumber(sumData.bruto, uom),
                    tarra: formatNumber(sumData.tarra, uom),
                    netto: formatNumber(sumData.netto, uom),
                    deduction: formatNumber(sumData.deduction, uom),
                    receive: formatNumber(sumData.receive, uom),
                });
                if (rangeDate.current === null) {
                    _setStartDate(moment(sumData.min_tgl_muat));
                    _setEndDate(moment(sumData.max_tgl_muat));
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }, [columnFilter, refresh, isLoading]);

    const fetchMoreOnBottom = debounce(async containerRef => {
        if (containerRef) {
            const { scrollHeight, scrollTop, clientHeight } = containerRef;
            console.log("is fetching :", isFetch);
            console.log(onMount);
            if (
                scrollHeight - scrollTop - clientHeight < 680 &&
                data.length < paginate.current.max &&
                !isFetch &&
                onMount
            ) {
                setIsFetch(true);
                console.log("mounted");
                try {
                    const resultData = await fetchData(
                        paginate.current.limit,
                        paginate.current.offset
                    );
                    setData(prevData => [...prevData, ...resultData.data]);
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }, 200);

    useEffect(() => {
        if (isFetch) {
            setIsFetch(false);
        }
        if (data.length > 0) {
            setOnMount(true);
        }
    }, [data]);

    // console.log(rows);
    return (
        <div
            style={{
                minWidth: "100%",
                minHeight: "100%",
                width: 0,
                height: 0,
            }}
        >
            <div style={{ display: "flex", margin: "0 0 1rem 0" }}>
                <DatePickerNoComp
                    label={"From"}
                    value={startDate}
                    onChange={setStartDate}
                    format={"DD-MM-YYYY"}
                />
                <DatePickerNoComp
                    label={"To"}
                    value={endDate}
                    onChange={setEndDate}
                    format={"DD-MM-YYYY"}
                />
            </div>
            <div
                style={{
                    display: "flex",
                    minWidth: "100%",
                    minHeight: "100%",
                    width: 0,
                    height: 0,
                }}
            >
                <TableContainer
                    sx={{
                        width: "100%",
                        height: "600px",
                    }}
                    ref={tableContainerRef}
                    onScroll={e => fetchMoreOnBottom(e.target)}
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
                                                    sx={{
                                                        width: header.getSize(),
                                                    }}
                                                >
                                                    {header.column.getCanFilter() ? (
                                                        <div>
                                                            <AutocompleteFilter
                                                                column={
                                                                    header.column
                                                                }
                                                                sx={{
                                                                    width: header.getSize(),
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <></>
                                                    )}
                                                    {header.isPlaceholder ? null : (
                                                        <div
                                                            style={{
                                                                alignContent:
                                                                    "center",
                                                                cursor: "pointer",
                                                                display: "flex",
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
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{
                                                        width: cell.column.getSize(),
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                            {isFetch && (
                                <TableRow rowSpan={2}>
                                    <TableCell colSpan={column.length}>
                                        Is Loading...
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell
                                    colSpan={7}
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
                                    Total
                                </TableCell>
                                <TableCell
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
                                    {summary.plan_qty}
                                </TableCell>
                                <TableCell
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
                                    {summary.bruto}
                                </TableCell>
                                <TableCell
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
                                    {summary.tarra}
                                </TableCell>
                                <TableCell
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
                                    {summary.netto}
                                </TableCell>
                                <TableCell
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
                                    {summary.receive}
                                </TableCell>
                                <TableCell
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
                                    {summary.deduction}
                                </TableCell>
                                <TableCell
                                    colSpan={column.length - 7 - 6}
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
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
