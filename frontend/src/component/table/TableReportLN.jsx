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
    TableView,
    Scale,
    CloudCircle,
    RefreshOutlined,
} from "@mui/icons-material";

import {
    TableContainer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableFooter,
    Tooltip,
    Button,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AutocompleteFilter from "../input/AutocompleteFilterComp";
import { useTheme } from "@mui/material/styles";

import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { debounce } from "lodash";
import moment from "moment";
import DatePickerNoComp from "../common/DatePickerNoCont";
import AutoCompleteDODB from "../input/AutoCompleteDODB";
import toast from "react-hot-toast";
import { LoadingButton } from "@mui/lab";
import ModalSyncWBNET from "../../pages/recap/ModalSyncWBNET";

export default function TableReportLN({ onsetFilterData, isLoading }) {
    const formatNumber = (number, uom) => {
        if (number) {
            return `${number?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${uom}`;
        } else {
            return "";
        }
    };
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const initialDateRange = useRef({ from: moment(), to: moment() });
    const paginate = useRef({
        limit: 20,
        offset: 0,
        max: 0,
    });
    const tableContainerRef = useRef(null);
    const [modalSync, _setModalSync] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [isFetch, setIsFetch] = useState(false);
    const [onMount, setOnMount] = useState(false);
    const [issyncwb, setSyncWB] = useState(false);
    const [issyncsap, setSyncSAP] = useState(false);
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
    const [do_number, _setDoNum] = useState("");
    const setDoNum = value => {
        _setDoNum(value);
    };

    const setModalSync = value => {
        _setModalSync(value);
    };

    const refreshTable = () => {
        setRefresh(true);
    };
    const [summary, setSum] = useState({
        plan_qty: 0,
        plan_qty_sap: 0,
        fac_qty_sap: 0,
        pending_qty: 0,
        bruto: 0,
        tarra: 0,
        netto: 0,
        receive: 0,
        deduction: 0,
        postedTotal: 0,
        unpostedTotal: 0,
        os_sap: 0,
        os_web: 0,
        os_wbpost: 0,
        os_wbunpost: 0,
    });
    const column = useMemo(
        () => [
            {
                header: "Do Number",
                accessorKey: "id_do",
                enableColumnFilter: false,
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
                header: "Pending Plan Qty",
                accessorFn: row =>
                    `${row.pending_plan_qty?.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )}  ${row.uom}`,
                cell: props => props.getValue(),
                enableColumnFilter: false,
            },
            {
                header: "Plan Qty SAP",
                accessorKey: "plan_qty_sap",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Fac. Qty SAP",
                accessorKey: "fac_qty_sap",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Bruto",
                accessorKey: "bruto",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Tarra",
                accessorKey: "tarra",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Netto",
                accessorKey: "netto",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Receive",
                accessorKey: "receive",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Deduction",
                accessorKey: "deduction",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Posted Quantity",
                accessorKey: "receive_posted",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
                enableColumnFilter: false,
            },
            {
                header: "Unposted Quantity",
                accessorKey: "receive_unposted",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
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
            if (do_number !== "") {
                filters = [
                    ...filters,
                    {
                        id: "id_do",
                        value: do_number,
                    },
                ];
            }

            const { data } = await axiosPrivate.post("/ln/getinfln", {
                filters: filters,
                limit: limit,
                offset: offset,
            });
            paginate.current.max = data.count;
            paginate.current.offset = limit + offset;
            return {
                data: data.data,
                summary: data.sum_data,
                outstanding: data.outstanding,
            };
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
            let dataSummary = {
                plan_qty: formatNumber(sumData.plan_qty, uom),
                plan_qty_sap: formatNumber(sumData.plan_qty_sap, uom),
                fac_qty_sap: formatNumber(sumData.fac_qty_sap, uom),
                pending_qty: formatNumber(sumData.pending_qty, uom),
                bruto: formatNumber(sumData.bruto, uom),
                tarra: formatNumber(sumData.tarra, uom),
                netto: formatNumber(sumData.netto, uom),
                deduction: formatNumber(sumData.deduction, uom),
                receive: formatNumber(sumData.receive, uom),
                postedTotal: formatNumber(sumData.postedTotal, uom),
                unpostedTotal: formatNumber(sumData.unpostedTotal, uom),
            };
            if (resultData?.outstanding) {
                dataSummary = {
                    ...dataSummary,
                    os_sap: formatNumber(
                        resultData.outstanding.os_sap.toString(),
                        uom
                    ),
                    os_web: formatNumber(
                        resultData.outstanding.osweb.toString(),
                        uom
                    ),
                    os_wbpost: formatNumber(
                        resultData.outstanding.osposted.toString(),
                        uom
                    ),
                    os_wbunpost: formatNumber(
                        resultData.outstanding.osunposted.toString(),
                        uom
                    ),
                };
            }
            setSum(dataSummary);
        } catch (error) {
            console.error(error);
        }
    }, 500);

    const generateExcel = async () => {
        try {
            let filters = dataColFilter;
            if (rangeDate.current != null) {
                filters = [...filters, ...rangeDate.current];
            }
            if (do_number === "") {
                throw new Error("Please provide SO Number for exporting excel");
            } else {
                filters = [
                    ...filters,
                    {
                        id: "id_do",
                        value: do_number,
                    },
                ];
            }
            const response = await axiosPrivate.post(
                "/ln/genexcelv2",
                {
                    filters: filters,
                },
                {
                    responseType: "blob",
                }
            );
            const filename = response.headers
                .get("Content-Disposition")
                .split("filename=")[1]
                .replace(/['"]+/g, "");
            const url = window.URL.createObjectURL(new Blob([response.data]));
            // Create a link element and simulate a click to trigger the download
            const link = document.createElement("a");
            link.setAttribute("download", filename);
            link.href = url;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            URL.revokeObjectURL(url);
        } catch (error) {
            if (error.response) {
                toast.error(error.response.data.message);
            } else {
                toast.error(error.message);
            }
            console.error(error);
        }
    };

    const syncWbnet = async () => {
        setSyncWB(true);
        try {
            const { data } = await axiosPrivate.post("/ln/syncwbnet");
            toast.success(data.message);
            setRefresh(true);
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setSyncWB(false);
        }
    };

    const syncLnsap = async () => {
        setSyncSAP(true);
        try {
            const { data } = await axiosPrivate.post("/ln/synclnsap");
            toast.success(data.message);
            setRefresh(true);
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setSyncSAP(false);
        }
    };

    useEffect(() => {
        onsetFilterData({
            filters: dataColFilter,
            customer_id: "",
        });
        setIsFetch(true);
        (async () => {
            try {
                const resultData = await fetchData(40, 0);
                console.log(resultData);
                setData(resultData.data);
                const sumData = resultData.summary;
                const uom = sumData.uom;
                let dataSummary = {
                    plan_qty: formatNumber(sumData.plan_qty, uom),
                    plan_qty_sap: formatNumber(sumData.plan_qty_sap, uom),
                    fac_qty_sap: formatNumber(sumData.fac_qty_sap, uom),
                    pending_qty: formatNumber(sumData.pending_qty, uom),
                    bruto: formatNumber(sumData.bruto, uom),
                    tarra: formatNumber(sumData.tarra, uom),
                    netto: formatNumber(sumData.netto, uom),
                    deduction: formatNumber(sumData.deduction, uom),
                    receive: formatNumber(sumData.receive, uom),
                    postedTotal: formatNumber(sumData.postedTotal, uom),
                    unpostedTotal: formatNumber(sumData.unpostedTotal, uom),
                };
                if (resultData?.outstanding) {
                    dataSummary = {
                        ...dataSummary,
                        os_sap: formatNumber(
                            resultData.outstanding.os_sap.toString(),
                            uom
                        ),
                        os_web: formatNumber(
                            resultData.outstanding.osweb.toString(),
                            uom
                        ),
                        os_wbpost: formatNumber(
                            resultData.outstanding.osposted.toString(),
                            uom
                        ),
                        os_wbunpost: formatNumber(
                            resultData.outstanding.osunposted.toString(),
                            uom
                        ),
                    };
                }
                setSum(dataSummary);
                if (rangeDate.current === null) {
                    _setStartDate(moment(sumData.min_tgl_muat));
                    _setEndDate(moment(sumData.max_tgl_muat));
                    initialDateRange.current = {
                        from: moment(sumData.min_tgl_muat),
                        to: moment(sumData.max_tgl_muat),
                    };
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (refresh) {
                    setRefresh(false);
                }
            }
        })();
    }, [columnFilter, refresh, isLoading, do_number]);

    const fetchMoreOnBottom = debounce(async containerRef => {
        if (containerRef) {
            const { scrollHeight, scrollTop, clientHeight } = containerRef;
            if (
                scrollHeight - scrollTop - clientHeight < 680 &&
                data.length < paginate.current.max &&
                !isFetch &&
                onMount
            ) {
                setIsFetch(true);
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

    const resetFilterDate = () => {
        _setStartDate(initialDateRange.current.from);
        _setEndDate(initialDateRange.current.to);
        refreshTableData(
            initialDateRange.current.from,
            initialDateRange.current.to
        );
    };

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
        <>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "100%",
                    minHeight: "100%",
                    width: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        margin: "0 0 1rem 0",
                        gap: "1rem",
                    }}
                >
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
                    <Tooltip title="Reset Date">
                        <Button
                            sx={{ width: "4rem", height: "4rem" }}
                            variant="contained"
                            onClick={e => {
                                resetFilterDate();
                            }}
                        >
                            <RefreshOutlined />
                        </Button>
                    </Tooltip>
                    <AutoCompleteDODB
                        onChangeovr={setDoNum}
                        label="SO Number"
                        sx={{ width: "20rem" }}
                    />
                    <Tooltip title="Sync WBNET">
                        <Button
                            onClick={() => {
                                setModalSync(true);
                            }}
                            variant="contained"
                            sx={{
                                minWidth: "4rem",
                                mb: 1,
                                color: theme.palette.success.contrastText,
                                backgroundColor: theme.palette.success.main,
                                ":hover": {
                                    backgroundColor:
                                        theme.palette.success.light,
                                },
                            }}
                        >
                            <Scale></Scale>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Sync LN SAP">
                        <LoadingButton
                            onClick={async () => {
                                await syncLnsap();
                            }}
                            variant="contained"
                            sx={{
                                minWidth: "4rem",
                                mb: 1,
                                color: theme.palette.success.contrastText,
                                backgroundColor: theme.palette.success.main,
                                ":hover": {
                                    backgroundColor:
                                        theme.palette.success.light,
                                },
                            }}
                            loading={issyncsap}
                        >
                            <CloudCircle></CloudCircle>
                        </LoadingButton>
                    </Tooltip>
                    <Tooltip title="Generate Excel">
                        <Button
                            onClick={async () => {
                                await generateExcel();
                            }}
                            variant="contained"
                            sx={{
                                minWidth: "4rem",
                                mb: 1,
                                color: theme.palette.success.contrastText,
                                backgroundColor: theme.palette.success.main,
                                ":hover": {
                                    backgroundColor:
                                        theme.palette.success.light,
                                },
                            }}
                        >
                            <TableView></TableView>
                        </Button>
                    </Tooltip>
                </div>
                <div
                    style={{
                        display: "flex",
                        minWidth: "100%",
                        width: 0,
                    }}
                >
                    <TableContainer
                        sx={{
                            width: "100%",
                            height: "580px",
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
                                                                    display:
                                                                        "flex",
                                                                }}
                                                                onClick={header.column.getToggleSortingHandler()}
                                                            >
                                                                {flexRender(
                                                                    header
                                                                        .column
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
                                                            cell.column
                                                                .columnDef.cell,
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
                                        {summary.pending_qty}
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
                                        {summary.plan_qty_sap}
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
                                        {summary.fac_qty_sap}
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
                                        {summary.postedTotal}
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
                                        {summary.unpostedTotal}
                                    </TableCell>
                                    <TableCell
                                        colSpan={column.length - 7 - 3}
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
                {do_number !== "" && (
                    <TableContainer sx={{ width: "40rem" }}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell
                                        rowSpan={4}
                                        sx={{
                                            bgcolor:
                                                theme.palette.primary.light,
                                            color: theme.palette.primary
                                                .contrastText,
                                        }}
                                    >
                                        Outstanding
                                    </TableCell>
                                    <TableCell>SAP</TableCell>
                                    <TableCell>{summary.os_sap}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Web</TableCell>
                                    <TableCell>{summary.os_web}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>WBNET Posted</TableCell>
                                    <TableCell>{summary.os_wbpost}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </div>
            <ModalSyncWBNET
                is_open={modalSync}
                setOpen={setModalSync}
                refreshTable={refreshTable}
            />
        </>
    );
}
