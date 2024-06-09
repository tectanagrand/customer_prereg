import TableTemplate from "../../component/table/TableTemplate";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useState, useMemo } from "react";
import {
    IconButton,
    Tooltip,
    Backdrop,
    CircularProgress,
    setRef,
} from "@mui/material";
import {
    ChecklistRounded,
    CheckBoxOutlined,
    CancelOutlined,
} from "@mui/icons-material";
import ModalVehicle from "../approvalreq/ModalVehicle";
import ModalDriver from "../approvalreq/ModalDriver";
import { useTheme } from "@mui/material/styles";
import toast, { Toaster } from "react-hot-toast";
import RefreshButton from "../../component/common/RefreshButton";
import { useSession } from "../../provider/sessionProvider";

const OSRequestDrvVeh = () => {
    const { session } = useSession();
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [rows, setRows] = useState([]);
    const [modalVeh, _setModalVeh] = useState(false);
    const [modalDrv, _setModalDrv] = useState(false);
    const [vehUuid, setVehuuid] = useState("");
    const [drvUuid, setDrvuuid] = useState("");
    const [loadedData, setLoadedData] = useState(false);
    const [refresh, setRefresh] = useState(true);
    const [openBackdrop, _setOpenBackdrop] = useState(false);
    const setModalVeh = value => {
        _setModalVeh(value);
    };
    const setModalDrv = value => {
        _setModalDrv(value);
    };
    const setOpenBackdrop = value => {
        _setOpenBackdrop(value);
    };
    const getVehDetail = vehuuid => {
        setVehuuid(vehuuid);
    };
    const getDrvDetail = vehuuid => {
        setDrvuuid(vehuuid);
    };
    const refreshButton = () => {
        setRefresh(true);
    };

    const processedKrani = async req_uuid => {
        try {
            setOpenBackdrop(true);
            const { data } = await axiosPrivate.post(`/file/prcskrani`, {
                req_uuid: req_uuid,
            });
            toast.success("Master Data is completed");
        } catch (error) {
            console.error(error);
            toast.error(
                error.response ? error.response.data.message : error.message
            );
        } finally {
            setOpenBackdrop(false);
        }
    };

    const approveRequest = value => {
        window.open(
            `${window.location.protocol}/approval/reqdrvveh?action=approve&ticket_id=${value}`
        );
    };
    const rejectRequest = value => {
        window.open(
            `${window.location.protocol}/approval/reqdrvveh?action=reject&ticket_id=${value}`
        );
    };
    const columns = useMemo(() => {
        return [
            {
                header: "Req. Number",
                accessorKey: "request_id",
                cell: ({ getValue }) => getValue(),
            },
            {
                header: "Vehicle",
                accessorKey: "vehicle",
                cell: ({ getValue, row }) => {
                    return (
                        <a
                            onClick={() => {
                                getVehDetail(row.original.vehuuid);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {getValue()}
                        </a>
                    );
                },
            },
            {
                header: "Driver",
                accessorKey: "driver",
                cell: ({ getValue, row }) => {
                    return (
                        <a
                            onClick={() => {
                                getDrvDetail(row.original.drvuuid);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {getValue()}
                        </a>
                    );
                },
            },
            {
                header: "Status",
                accessorKey: "status",
                cell: ({ getValue }) => getValue(),
            },
            {
                header: "Action",
                accessorKey: "uuid",
                cell: props => {
                    if (
                        props.row.original.status === "Completed" ||
                        session.role === "CUSTOMER"
                    ) {
                        return "";
                    } else {
                        if (props.row.original.status === "On Logistic") {
                            return [
                                <Tooltip title="Approve">
                                    <IconButton
                                        sx={{
                                            width: "4rem",
                                            height: "4rem",
                                            m: 1,
                                            backgroundColor:
                                                theme.palette.primary.main,
                                            ":hover": {
                                                backgroundColor:
                                                    theme.palette.primary.dark,
                                            },
                                        }}
                                        onClick={() => {
                                            approveRequest(props.getValue());
                                        }}
                                    >
                                        <CheckBoxOutlined
                                            sx={{
                                                width: "4rem",
                                                height: "4rem",
                                                color: theme.palette.primary
                                                    .contrastText,
                                                p: 1,
                                            }}
                                        />
                                    </IconButton>
                                </Tooltip>,
                                <Tooltip title="Reject">
                                    <IconButton
                                        sx={{
                                            width: "4rem",
                                            height: "4rem",
                                            m: 1,
                                            backgroundColor:
                                                theme.palette.error.main,
                                            ":hover": {
                                                backgroundColor:
                                                    theme.palette.error.dark,
                                            },
                                        }}
                                        onClick={() => {
                                            rejectRequest(props.getValue());
                                        }}
                                    >
                                        <CancelOutlined
                                            sx={{
                                                width: "4rem",
                                                height: "4rem",
                                                color: theme.palette.error
                                                    .contrastText,
                                                p: 1,
                                            }}
                                        />
                                    </IconButton>
                                </Tooltip>,
                            ];
                        } else {
                            return (
                                <Tooltip title="Complete">
                                    <IconButton
                                        sx={{
                                            width: "4rem",
                                            height: "4rem",
                                            m: 1,
                                            backgroundColor:
                                                theme.palette.primary.main,
                                            ":hover": {
                                                backgroundColor:
                                                    theme.palette.primary.dark,
                                            },
                                        }}
                                        onClick={() => {
                                            processedKrani(props.getValue());
                                        }}
                                    >
                                        <ChecklistRounded
                                            sx={{
                                                width: "4rem",
                                                height: "4rem",
                                                color: theme.palette.primary
                                                    .contrastText,
                                                p: 1,
                                            }}
                                        />
                                    </IconButton>
                                </Tooltip>
                            );
                        }
                    }
                },
            },
        ];
    }, []);
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate("/master/reqdrvveh");
                setRows(data);
                setLoadedData(true);
            } catch (error) {
                console.error(error);
            } finally {
                if (refresh) {
                    setRefresh(false);
                }
            }
        })();
    }, [openBackdrop, refresh]);
    return (
        <div>
            <Toaster />
            <div
                style={{ display: "flex", gap: "1rem", padding: "0 0 1rem 0" }}
            >
                <h3>Outstanding Request Driver Vehicle</h3>
                <RefreshButton
                    setRefreshbtn={refreshButton}
                    isLoading={refresh}
                />
            </div>
            <TableTemplate
                data={rows}
                columns={columns}
                sx={{ width: "98%", height: "70vh" }}
            />
            <ModalVehicle
                isOpen={modalVeh}
                modalCtrl={setModalVeh}
                uuid={vehUuid}
                setOpenBackdrop={setOpenBackdrop}
                loadedData={loadedData}
            />
            <ModalDriver
                isOpen={modalDrv}
                modalCtrl={setModalDrv}
                uuid={drvUuid}
                setOpenBackdrop={setOpenBackdrop}
                loadedData={loadedData}
            />
            <Backdrop
                sx={{ color: "#fff", zIndex: theme => theme.zIndex.drawer + 1 }}
                open={openBackdrop}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </div>
    );
};

export default OSRequestDrvVeh;
