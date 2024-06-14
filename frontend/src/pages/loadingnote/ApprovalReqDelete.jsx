import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import TableSelect from "../../component/table/TableSelect";
import { useTheme } from "@mui/material/styles";
import { useForm } from "react-hook-form";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import TableSelected from "../../component/table/TableSelected";
import { CheckCircleOutline } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Box,
    Typography,
    Button,
    Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import RefreshButton from "../../component/common/RefreshButton";
import { useSession } from "../../provider/sessionProvider";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";

const ApprovalReqDelete = () => {
    const {
        handleSubmit,
        register,
        setValue,
        getValues,
        reset: resetSelected,
    } = useForm({
        defaultValues: {
            selected: [],
        },
    });
    const {
        handleSubmit: submitDeletion,
        getValues: remarkValue,
        control: controlDel,
        reset: resetRemark,
        setValue: setValuePrcs,
    } = useForm({
        defaultValues: {
            remark_reject: "",
            action: "",
        },
    });

    const {
        control: controlAuth,
        handleSubmit: handleAuth,
        getValues: authValue,
        reset: resetAuth,
    } = useForm({
        defaultValues: {
            password: "",
        },
    });
    const [selectedRows, _setSelectedRows] = useState([]);
    const [modalResp, _setModalResp] = useState({
        open: false,
        message: "",
    });
    const theme = useTheme();
    const [rows, setRows] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalAuth, setModalAuth] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingPush, setLoadingPush] = useState(false);
    const axiosPrivate = useAxiosPrivate();
    const { session } = useSession();
    const setSelectedRows = value => {
        _setSelectedRows(value);
        setValue("selected", value);
    };
    const stagedDeleted = value => {
        setModalOpen(true);
    };
    const _setRefresh = () => {
        setRefresh(true);
    };
    const onCloseModal = () => {
        _setModalResp({
            open: false,
            message: "",
        });
    };
    const processLoadingNote = async () => {
        let payload = {
            selected: getValues().selected,
            remark_reject: remarkValue().remark_reject,
            password: authValue().password,
            action: remarkValue().action,
        };
        try {
            let message;
            setLoading(true);
            const { data } = await axiosPrivate.post(`/ln/processdel`, payload);
            message = data.message;
            setSelectedRows([]);
            resetSelected({
                selected: [],
            });
            resetRemark({
                remark_reject: "",
            });
            setRefresh(true);
            setModalAuth(false);
            setModalOpen(false);
            _setModalResp({
                open: true,
                message: message,
            });
        } catch (error) {
            console.error(error);
            if (
                [
                    "Role Not Authorized",
                    "Provide password",
                    "SAP Credential Not Valid",
                    "Session Expired",
                ].includes(error.response?.data.message)
            ) {
                setModalAuth(true);
            }
            toast.error(error.response.data.message ?? error.message);
        } finally {
            setLoading(false);
        }
    };
    const uniformRule = (row, x) => {
        return row.plant === x.plant;
    };
    const notselectRule = row => {
        if (session.role !== "LOGISTIC") {
            return false;
        } else return true;
    };
    const columns = [
        {
            header: "Loading Note Num",
            accessorKey: "ln_num",
            cell: props => props.getValue(),
        },
        {
            header: "SO Num.",
            accessorKey: "id_do",
            cell: props => props.getValue(),
        },
        {
            header: "Plant",
            accessorKey: "plant",
            cell: props => props.getValue(),
        },
        {
            header: "Inco.",
            accessorKey: "inco_1",
            cell: props => props.getValue(),
        },
        {
            header: "Tgl Surat Jalan",
            accessorKey: "tanggal_surat_jalan",
            cell: props => props.getValue(),
        },
        {
            header: "Driver",
            cell: ({ row }) => {
                return `${row.original.driver_name} (${row.original.driver_id})`;
            },
        },
        {
            header: "Vehicle",
            accessorKey: "vhcl_id",
            cell: ({ getValue }) => getValue(),
        },
        {
            header: "Media TP",
            accessorKey: "media_tp",
            cell: ({ getValue }) => getValue(),
        },
        {
            header: "Planning Qty",
            accessorKey: "plan_qty",
            cell: ({ row }) =>
                `${row.original.plan_qty?.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                )} ${row.original.uom}`,
        },
        {
            header: "Fac. Plant",
            accessorKey: "fac_plant",
            cell: props => props.getValue(),
        },
        {
            header: "Oth. Plant",
            accessorKey: "oth_plant",
            cell: props => props.getValue(),
        },
        {
            header: "Fac. Batch",
            accessorKey: "fac_batch",
            cell: props => props.getValue(),
        },
        {
            header: "Oth. Batch",
            accessorKey: "oth_batch",
            cell: props => props.getValue(),
        },
        {
            header: "Fac. Val. Type",
            accessorKey: "fac_valtype",
            cell: props => props.getValue(),
        },
        {
            header: "Oth. Val. Type",
            accessorKey: "oth_valtype",
            cell: props => props.getValue(),
        },
        {
            header: "Delete Remark",
            accessorKey: "remark_delete",
            cell: props => props.getValue(),
        },
    ];

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get(`/ln/createdln`);
                setRows(data.data);
            } catch (error) {
                console.error(error);
            } finally {
                if (refresh) {
                    setRefresh(false);
                }
            }
        })();
    }, [refresh]);

    return (
        <div>
            <Toaster />
            <form onSubmit={handleSubmit(stagedDeleted)}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <RefreshButton
                            sx={{
                                minWidth: "1rem",
                                minHeight: "1rem",
                            }}
                            setRefreshbtn={_setRefresh}
                            isLoading={refresh}
                        />
                        <h3>Approval Req. Delete Loading Note</h3>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <LoadingButton
                            color="error"
                            variant="contained"
                            disabled={!selectedRows.length > 0}
                            sx={{ m: 1 }}
                            type="submit"
                            onClick={() => {
                                setValuePrcs("action", "REJECT");
                            }}
                        >
                            Reject Request
                        </LoadingButton>
                        <LoadingButton
                            color="primary"
                            variant="contained"
                            disabled={!selectedRows.length > 0}
                            sx={{ m: 1 }}
                            type="submit"
                            onClick={() => {
                                setValuePrcs("action", "APPROVE");
                            }}
                        >
                            Approve Request
                        </LoadingButton>
                    </div>
                </Box>
                <input
                    {...register("selected", {
                        validate: selected => {
                            return (
                                selected.length > 0 ||
                                "Please check data below at least 1"
                            );
                        },
                    })}
                    hidden
                />
                <TableSelect
                    data={rows}
                    columns={columns}
                    setSelected={setSelectedRows}
                    sx={{ height: "65vh", overflowX: "scroll", width: "92vw" }}
                    uniform={uniformRule}
                    notselect={notselectRule}
                    refresh={refresh}
                />
            </form>
            <Dialog open={modalOpen} maxWidth="xl">
                <form onSubmit={submitDeletion(processLoadingNote)}>
                    <DialogTitle>Delete Created Loading Note</DialogTitle>

                    <Box
                        sx={{
                            width: "80em",
                            height: "30rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            p: 2,
                            mb: 3,
                        }}
                    >
                        <Typography variant="h4">
                            Request Delete Loading Note
                        </Typography>
                        <div
                            style={{
                                display: "flex",
                                gap: "3rem",
                                paddingLeft: "1rem",
                            }}
                        >
                            {remarkValue("action") === "REJECT" && (
                                <TextFieldComp
                                    control={controlDel}
                                    label="Delete Reason"
                                    name="remark_reject"
                                    rules={{
                                        required:
                                            "Please provide delete reason",
                                    }}
                                />
                            )}
                        </div>
                        <TableSelected
                            rowsData={selectedRows}
                            columns={columns}
                        />
                    </Box>
                    <DialogActions>
                        <Button
                            color="error"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            type="submit"
                            color={
                                remarkValue("action") === "REJECT"
                                    ? "error"
                                    : "primary"
                            }
                            variant="contained"
                            loading={loading}
                        >
                            {remarkValue("action") === "REJECT"
                                ? "Reject"
                                : "Approve"}
                        </LoadingButton>
                    </DialogActions>
                </form>
            </Dialog>
            <Dialog
                open={modalResp.open}
                maxWidth="sm"
                onClose={onCloseModal}
                sx={{ zIndex: theme => theme.zIndex.drawer - 2 }}
            >
                <Box
                    sx={{
                        minWidth: "30rem",
                        minHeight: "15rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        p: 4,
                    }}
                >
                    <CheckCircleOutline
                        sx={{
                            height: "4rem",
                            width: "4rem",
                            color: "green",
                        }}
                    />
                    <Typography variant="h4">{modalResp.message}</Typography>
                </Box>
            </Dialog>
            <Dialog open={modalAuth} maxWidth="m">
                <DialogTitle>Authorize SAP Credentials</DialogTitle>

                <form onSubmit={handleAuth(processLoadingNote)}>
                    <Box
                        sx={{
                            width: "40rem",
                            height: "15rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            p: 2,
                            mb: 3,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "3rem",
                                paddingLeft: "1rem",
                            }}
                        >
                            <div>
                                <div>
                                    <Alert
                                        variant="filled"
                                        severity="warning"
                                        sx={{ width: "96%" }}
                                    >
                                        <strong>
                                            Currently you're not authorized to
                                            push data to SAP, please insert
                                            registered SAP Password according to
                                            username displayed
                                        </strong>{" "}
                                    </Alert>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                        margin: "1rem 0 0 0",
                                    }}
                                >
                                    <strong>Username :</strong>{" "}
                                    <em>
                                        <strong>{session.username}</strong>
                                    </em>
                                </div>
                            </div>
                        </div>
                        <PasswordWithEyes
                            control={controlAuth}
                            label="SAP Password"
                            name="password"
                            rules={{ required: "Please insert this field" }}
                        />
                    </Box>
                    <DialogActions>
                        <LoadingButton
                            type="submit"
                            color="primary"
                            variant="contained"
                            loading={loadingPush}
                        >
                            Continue
                        </LoadingButton>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setModalAuth(false)}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </div>
    );
};

export default ApprovalReqDelete;
