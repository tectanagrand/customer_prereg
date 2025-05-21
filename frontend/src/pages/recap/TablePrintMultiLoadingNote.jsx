import TableSpanPin from "../../component/table/TableSpanPin";
import useFetchData from "../../hooks/useFetchData";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { createColumnHelper } from "@tanstack/react-table";
import TooltipButton from "../../component/common/TooltipButton";
import { PrintOutlined } from "@mui/icons-material";
import { formatNumber } from "../../helper/formatting";
import moment from "moment";

import { useCallback, useMemo, useState } from "react";
import { Box } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";

const columnHelper = createColumnHelper();

export default function TablePrintMultiLoadingNote() {
    const axiosPrivate = useAxiosPrivate();
    const [refresh, setRefresh] = useState(true);
    const { data, error, loading, refreshData } = useFetchData({
        url: `multi/printreq`,
        initData: {
            data: [],
            colspan_names: [],
            pin_col: {
                right: [],
                left: [],
            },
        },
    });

    const exportData = useCallback(async hd_id => {
        try {
            const response = await axiosPrivate.post(
                "/multi/exportsj",
                {
                    hd_id: hd_id,
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
            setRefresh(true);
            refreshData();
        } catch (error) {
            if (error.response) {
                toast.error(error.response.statusText);
            }
            console.log(error.response);
        }
    });

    const columns = useMemo(() => [
        columnHelper.accessor("hd_id", {
            header: "",
            cell: ({ row }) => {
                let tooltip_text = "Download Surat Jalan";
                let disabled = false;
                if (row.original.count_lnnum < row.original.count_req) {
                    tooltip_text =
                        "Tidak dapat men-download surat jalan karena nomor loading note belum lengkap";
                    disabled = true;
                }
                if (row.original.print_count >= 3) {
                    tooltip_text =
                        "Tidak dapat men-download, sudah mencapai limit download";
                    disabled = true;
                }
                return (
                    <TooltipButton
                        TooltipText={tooltip_text}
                        Icon={<PrintOutlined />}
                        OnClick={e => {
                            // console.log(row.original.hd_id);
                            exportData(row.original.hd_id);
                        }}
                        disabled={disabled}
                    />
                );
            },
        }),
        columnHelper.accessor("ln_num", {
            header: "LN. Num",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("driver_id", {
            header: "Driver",
            cell: ({ row }) =>
                `${row.original.driver_id} - ${row.original.driver_name}`,
        }),
        columnHelper.accessor("vehicle_id", {
            header: "Plate Number",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("tanggal_pembuatan", {
            header: "Create Date",
            cell: ({ getValue }) => moment(getValue()).format("DD-MM-YYYY"),
        }),
        columnHelper.accessor("tanggal_surat_jalan", {
            header: "Loading Date",
            cell: ({ getValue }) => moment(getValue()).format("DD-MM-YYYY"),
        }),
        columnHelper.accessor("id_do", {
            header: "DO Num",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("id_so", {
            header: "SO Num",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("id_sto", {
            header: "STO Num",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("plant", {
            header: "Plant",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("company", {
            header: "Company",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("material", {
            header: "Material",
            cell: ({ row }) =>
                `${row.original.desc_mat} (${row.original.material})`,
        }),
        columnHelper.accessor("incoterm", {
            header: "Incoterm",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("planned_qty", {
            header: "Plan Qty.",
            cell: ({ getValue, row }) =>
                `${formatNumber(getValue().toString(), row.original.uom)} `,
        }),
    ]);

    return (
        <Box>
            <Toaster />
            <TableSpanPin
                data={data.data}
                columns={columns}
                spanning_col={new Set(data.colspan_names)}
                pinned_col={data.pin_col}
            />
        </Box>
    );
}
