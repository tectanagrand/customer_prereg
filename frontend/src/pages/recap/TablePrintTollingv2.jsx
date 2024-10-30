import { Box, IconButton, Tooltip } from "@mui/material";
import { PrintOutlined } from "@mui/icons-material";
import TableRowGrouping from "../../component/table/TableRowGrouping";
import { createColumnHelper } from "@tanstack/react-table";
import { formatNumber } from "../../helper/formatting";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useCallback, useEffect, useState } from "react";
import { CheckBoxTable } from "../../component/input/CheckBoxTable";
import { useTheme } from "@mui/material/styles";

const columnHelper = createColumnHelper();

export default function TablePrintTollingv2({
    setSelectDel,
    refresh,
    setRefresh,
}) {
    const theme = useTheme();
    const [selected, setSelected] = useState({});
    const [data, setData] = useState([]);
    const [id_merge, setIdMerge] = useState("");
    const axiosPrivate = useAxiosPrivate();

    const onSelectChange = selected => {
        setSelectDel(selected);
    };

    const PrintSuratJalan = useCallback(
        async value => {
            try {
                const response = await axiosPrivate.post(
                    "/tol/printv3",
                    {
                        id: value.merged,
                    },
                    { responseType: "blob", withCredentials: true }
                );
                const filename = response.headers
                    .get("Content-Disposition")
                    .split("filename=")[1]
                    .replace(/['"]+/g, "");
                const url = window.URL.createObjectURL(
                    new Blob([response.data])
                );

                // Create a link element and simulate a click to trigger the download
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();

                // Cleanup
                URL.revokeObjectURL(url);
                setRefresh(true);
            } catch (error) {
                console.log(error);
            }
        },
        [refresh]
    );

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.post("/tol/getprintv2", {
                    filters: [],
                });
                setData(data.data);
                setIdMerge(data.merged_code);
            } catch (error) {
                console.error(error);
            } finally {
                if (refresh) {
                    setRefresh(false);
                }
            }
        })();
    }, [refresh]);

    const columns = [
        columnHelper.accessor("batch_code", {
            header: "Batch Code",
            cell: props => {
                const can_print = props.row.original.can_print;
                const print_count = props.row.original.print_count;
                let tooltipMsg = "Download Batch";
                let disable_print = false;
                if (!can_print) {
                    disable_print = true;
                    tooltipMsg =
                        "Loading Note only can be download if there's no outstanding delete request";
                }
                if (print_count > 2) {
                    disable_print = true;
                    tooltipMsg = "Download exceeding limit (3 times download)";
                }
                return (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Tooltip title={tooltipMsg} placement="right-start">
                            <span>
                                <IconButton
                                    disabled={disable_print}
                                    onClick={e => {
                                        PrintSuratJalan(props.row.original);
                                    }}
                                >
                                    <PrintOutlined />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <p>{props.getValue()}</p>
                    </Box>
                );
            },
        }),
        columnHelper.accessor("ln_num", {
            header: "Loading Num",
            cell: props => {
                return (
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            flexShrink: 0,
                            alignItems: "center",
                        }}
                    >
                        {!props.row.original.delete_req && (
                            <CheckBoxTable
                                {...{
                                    checked: props.row.getIsSelected(),
                                    onChange: e => {
                                        props.row.toggleSelected();
                                    },
                                    sx: { width: "2rem", height: "2rem" },
                                }}
                            />
                        )}
                        <p>{props.getValue()}</p>
                    </Box>
                );
            },
        }),
        columnHelper.accessor("id_sto", {
            header: "STO Num",
            cell: props => props.getValue(),
        }),
        columnHelper.accessor("tanggal_surat_jalan", {
            header: "Tanggal Loading",
            cell: props => props.getValue(),
        }),
        columnHelper.display({
            id: "Driver",
            header: "Driver",
            cell: props => {
                return `${props.row.original.driver_id} - ${props.row.original.driver_name}`;
            },
        }),
        columnHelper.accessor("vhcl_id", {
            header: "No Plat",
            cell: props => props.getValue(),
        }),
        columnHelper.accessor("plan_qty", {
            header: "Plan. Qty.",
            cell: props =>
                formatNumber(props.getValue(), props.row.original.uom),
        }),
        columnHelper.accessor("desc_con", {
            header: "Material",
            cell: props => props.getValue(),
        }),
        columnHelper.display({
            id: "Status",
            header: "Status",
            cell: props => {
                let backgroundcolor = "";
                let textColor = "";
                let status = "";

                if (props.row.original.delete_req) {
                    backgroundcolor = theme.palette.grey[300];
                    textColor = theme.palette.grey[500];
                    status = "Del. Req.";
                } else {
                    backgroundcolor = theme.palette.primary.main;
                    textColor = theme.palette.primary.contrastText;
                    status = "Active";
                }

                return (
                    <div
                        style={{
                            background: backgroundcolor,
                            borderRadius: "12px",
                            width: "fit-content",
                            padding: "0.5rem 0.5rem 0.5rem 0.5rem",
                            color: textColor,
                        }}
                    >
                        {status}
                    </div>
                );
            },
        }),
    ];
    return (
        <div>
            <TableRowGrouping
                column={columns}
                rows={data}
                id_spanning={id_merge}
                tableconf={{
                    onRowSelectionChange: setSelected,
                    state: {
                        rowSelection: selected,
                    },
                }}
                onSelectChange={onSelectChange}
            />
        </div>
    );
}
