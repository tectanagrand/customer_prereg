import TableWithDetail from "../../component/table/TableWithDetail";
import { createColumnHelper } from "@tanstack/react-table";
import { Box, Button, Backdrop, CircularProgress } from "@mui/material";
import {
    EditOutlined,
    DeleteOutlined,
    OutboxOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import RefreshButton from "../../component/common/RefreshButton";
import TooltipButton from "../../component/common/TooltipButton";
import useToggleBackdrop from "../../store/useToggleBackdrop";
import TableSimple from "../../component/table/TableSimple";
import { formatNumber } from "../../helper/formatting";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
const columnHelper = createColumnHelper();

const TableChildMultiLOCO = ({ dataChild }) => {
    const columns = useMemo(() => {
        return [
            columnHelper.accessor("company", {
                header: "Company",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("plant", {
                header: "Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_do", {
                header: "DO",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_sto", {
                header: "STO",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_so", {
                header: "SO",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("inco_1", {
                header: "INCO",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("planned_qty", {
                header: "Planning Qty",
                cell: ({ getValue, row }) => {
                    return `${formatNumber(getValue(), row.original.uom)}`;
                },
            }),
        ];
    }, []);
    return <TableSimple rowsData={dataChild} columns={columns} />;
};

const ButtonAction = ({ id, setRefresh }) => {
    const { openBackdrop, closeBackdrop } = useToggleBackdrop(state => state);
    const axiosPrivate = useAxiosPrivate();
    const buttonAction = useCallback(
        async (id, action) => {
            switch (action) {
                case "edit":
                    navigate("create?id=" + id);
                    break;
                case "tolog":
                    openBackdrop();
                    try {
                        await axiosPrivate.post(`/multi/tolog`, {
                            hd_id: id,
                        });
                        toast.success("Success Send to Logistic");
                    } catch (error) {
                        let errormsg = error.response?.data?.messsage;
                        if (!errormsg) {
                            errormsg = error.message;
                        }
                        toast.error(errormsg);
                    } finally {
                        closeBackdrop();
                        setRefresh(true);
                    }
                    break;
                default:
                    console.log(id, action);
                    break;
            }
        },
        [id]
    );
    return (
        <Box sx={{ display: "flex", gap: 1 }}>
            <TooltipButton
                Icon={<EditOutlined />}
                onClick={e => buttonAction(id, "edit")}
            />
            <TooltipButton
                Icon={<DeleteOutlined />}
                onClick={e => buttonAction(id, "delete")}
            />
            <TooltipButton
                Icon={<OutboxOutlined />}
                onClick={e => buttonAction(id, "tolog")}
            />
        </Box>
    );
};
export default function DashboardMultiLNLOCO() {
    const navigate = useNavigate();
    const backdropState = useToggleBackdrop(state => state.backdropState);
    const axiosPrivate = useAxiosPrivate();
    const [refresh, setRefresh] = useState(true);
    const [paginate, setPaginate] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const [data, setData] = useState({
        count: 0,
        rows: [],
    });
    const columns = useMemo(
        () => [
            columnHelper.accessor("tanggal_surat_jalan", {
                header: "Tanggal Pengambilan",
                cell: props => props.getValue(),
            }),
            columnHelper.accessor("vehicle_id", {
                header: "Nomor Plat",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("driver", {
                header: "Driver",
                cell: props => {
                    return `${props.row.original.driver_id} - ${props.row.original.driver_name} `;
                },
            }),
            columnHelper.accessor("media_tp", {
                header: "Media Transport",
                cell: props => props.getValue(),
            }),
            columnHelper.display({
                id: "action",
                header: "Action",
                cell: props => (
                    <ButtonAction
                        id={props.row.original.hd_id}
                        setRefresh={setRefresh}
                    />
                ),
            }),
        ],
        []
    );

    const createNewRequest = e => () => {
        navigate("create");
    };

    useEffect(() => {
        (async () => {
            if (refresh) {
                try {
                    const { data } = await axiosPrivate(`/multi/showcust`);
                    setData({
                        count: data.data.length,
                        rows: data.data,
                    });
                } catch (error) {
                    console.error(error);
                    let errmsg = error.response?.data?.message;
                    if (!errmsg) {
                        errmsg = error.message;
                    }
                    toast.error(errmsg);
                } finally {
                    setRefresh(false);
                }
            }
        })();
    }, [refresh]);
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
            }}
        >
            <Toaster />
            <Backdrop
                open={backdropState}
                sx={{ zIndex: theme => theme.zIndex.modal + 2 }}
            >
                <CircularProgress />
            </Backdrop>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <RefreshButton isLoading={refresh} setRefreshbtn={setRefresh} />
                <Button variant="contained" onClick={createNewRequest()}>
                    Create Request
                </Button>
            </Box>
            <TableWithDetail
                data={data}
                columns={columns}
                paginate={paginate}
                setPaginate={setPaginate}
                TableChild={TableChildMultiLOCO}
                sx={{ height: "88%" }}
            />
        </Box>
    );
}
