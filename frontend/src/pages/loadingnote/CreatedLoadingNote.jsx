import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import moment from "moment";
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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import RefreshButton from "../../component/common/RefreshButton";

const CreatedLoadingNote = () => {
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
        control: controlDel,
        reset: resetRemark,
    } = useForm({
        defaultValues: {
            remark_delete: "",
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
    const [modalOpen, setModalOpen] = useState(false);
    const axiosPrivate = useAxiosPrivate();
    const setSelectedRows = value => {
        console.log(value);
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
    const deleteLoadingNote = async value => {
        let payload = {
            selected: getValues().selected,
            remark_delete: value.remark_delete,
        };
        try {
            let message;
            setLoading(true);
            const { data } = await axiosPrivate.post(`/ln/requestdel`, payload);
            message = data.message;
            setSelectedRows([]);
            resetSelected({
                selected: [],
            });
            resetRemark({
                remark_delete: "",
            });
            setRefresh(true);
            setModalOpen(false);
            _setModalResp({
                open: true,
                message: message,
            });
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message ?? error.message);
        } finally {
            setLoading(false);
        }
    };
    const uniformRule = (row, x) => {
        return false;
    };
    const notselectRule = row => {
        if (row.delete_req) {
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
            header: "Status",
            accessorKey: "is_active",
            cell: ({ getValue, row }) => {
                let backgroundcolor = "";
                let textColor = "";
                let status = "";
                if (getValue()) {
                    if (row.original.delete_req) {
                        backgroundcolor = theme.palette.grey[300];
                        textColor = theme.palette.grey[500];
                        status = "Del. Req.";
                    } else {
                        backgroundcolor = theme.palette.primary.main;
                        textColor = theme.palette.primary.contrastText;
                        status = "Active";
                    }
                } else {
                    backgroundcolor = theme.palette.error.main;
                    textColor = theme.palette.error.contrastText;
                    status = "Inactive";
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

    console.log(selectedRows);

    return (
        <div style={{ width: "100%" }}>
            <Toaster />
            <form onSubmit={handleSubmit(stagedDeleted)}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "96%",
                    }}
                >
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <RefreshButton
                            sx={{
                                minWidth: "1rem",
                                minHeight: "1rem",
                            }}
                            setRefreshbtn={_setRefresh}
                            isLoading={refresh}
                        />
                        <h3>Created Loading Note</h3>
                    </div>
                    <LoadingButton
                        color="error"
                        variant="contained"
                        type="submit"
                        disabled={!selectedRows.length > 0}
                        sx={{ m: 1 }}
                    >
                        Request Delete
                    </LoadingButton>
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
                    sx={{
                        height: "65vh",
                        overflowX: "scroll",
                        width: "97%",
                    }}
                    uniform={uniformRule}
                    notselect={notselectRule}
                    refresh={refresh}
                />
            </form>
            <Dialog open={modalOpen} maxWidth="xl">
                <form onSubmit={submitDeletion(deleteLoadingNote)}>
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
                            <TextFieldComp
                                control={controlDel}
                                label="Delete Reason"
                                name="remark_delete"
                                rules={{
                                    required: "Please provide delete reason",
                                }}
                            />
                        </div>
                        <TableSelected
                            rowsData={selectedRows}
                            columns={columns}
                        />
                    </Box>
                    <DialogActions>
                        <LoadingButton
                            type="submit"
                            color="primary"
                            variant="contained"
                            loading={loading}
                        >
                            Submit
                        </LoadingButton>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancel
                        </Button>
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
        </div>
    );
};

export default CreatedLoadingNote;
