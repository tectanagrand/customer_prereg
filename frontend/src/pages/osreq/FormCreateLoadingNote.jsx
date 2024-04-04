import TableLoadingNoteReq from "../../component/table/TableLoadingNoteReq";
import AutoCompleteCustomer from "./AutoCompleteCustomer";
import AutoCompleteDOList from "./AutoCompleteDOList";
import { CheckCircleOutline } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Paper,
    Typography,
    Dialog,
    DialogTitle,
    DialogActions,
    Box,
    Button,
} from "@mui/material";
import { useEffect, useState, useMemo, useCallback } from "react";
import SelectComp from "../../component/input/SelectComp";
import { useForm } from "react-hook-form";
import TableSelectedLNReq from "../../component/table/TableSelectedLNReq";
import { Axios } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { debounce } from "lodash";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useSession } from "../../provider/sessionProvider";
const ValuationTypeOp = [
    { value: "TR-SALES", label: "TR-SALES" },
    { value: "LIQD", label: "LIQD" },
    { value: "IN-TS02", label: "IN-TS02" },
    { value: "IN-TS03", label: "IN-TS03" },
    { value: "1011100444", label: "1011100444" },
    { value: "IN-VS51", label: "IN-VS51" },
    { value: "TR-SALES2", label: "TR-SALES2" },
    { value: "MAIN", label: "MAIN" },
];

export default function FormCreateLoadingNote() {
    const {
        control,
        handleSubmit,
        register,
        setValue,
        getValues,
        reset,
        clearErrors,
        formState: { errors, isValid },
    } = useForm({
        defaultValues: {
            fac_sloc: "",
            fac_valtype: "",
            oth_sloc: "",
            oth_valtype: "",
            selected_req: [],
        },
    });
    const [DoNum, setDoNum] = useState("");
    const [CustNum, setCustNum] = useState("");
    const [slocop, setSlocop] = useState([]);
    const [valtypeOp, setvpOp] = useState([]);
    const [isLoading, _setLoading] = useState(false);
    const [loadingPush, setLoadingPush] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRows, _setSelected] = useState([]);
    const [resetRow, setResetRow] = useState(false);
    const [modalSuccess, setModalscs] = useState(false);
    const [firstRow, setFirstRow] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { getPermission } = useSession();
    const [who, setWho] = useState("");
    const isWb = getPermission("Edit Loading Note").fread;
    const isLog = getPermission("Push SAP Req.").fread;
    const theme = useTheme();

    const setdataDo = useCallback(value => {
        setDoNum(value);
    }, []);
    const setdataCust = debounce(value => {
        setCustNum(value?.split("-")[1]?.trim());
    }, 1000);
    const setLoading = value => {
        _setLoading(value);
    };
    const setSelected = value => {
        setValue("selected_req", value);
        setFirstRow(value[0] ?? null);
        _setSelected(value);
    };

    const onCloseModal = () => {
        setModalOpen(false);
    };

    const DoNumVal = useMemo(() => DoNum, [DoNum]);
    const CustNumVal = useMemo(() => CustNum, [CustNum]);

    useEffect(() => {
        const path = location.pathname.split("/");
        setWho(path[path.length - 1] === "editln" ? "wb" : "log");
    }, [location]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get(
                    `/master/sloc?plant=${firstRow?.plant}&material=${firstRow?.material}`
                );
                setSlocop(data.sloc);
                setvpOp(data.valtype);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [firstRow]);

    // useEffect(() => {
    //     (async () => {
    //         try {
    //             const { data } = await Axios.get("/master/valtype");
    //             setvpOp(data);
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     })();
    // }, []);

    useEffect(() => {
        (async () => {
            if (!firstRow) {
                reset({
                    fac_sloc: "",
                    fac_valtype: "",
                    oth_sloc: "",
                    oth_valtype: "",
                    selected_req: [],
                });
            } else {
                let fac_sloc, fac_valtype, oth_sloc, oth_valtype;
                try {
                    _setLoading(true);
                    if (who === "wb") {
                        fac_sloc = firstRow.fac_sloc;
                        fac_valtype = firstRow.fac_valtype;
                        oth_sloc = firstRow.oth_sloc;
                        oth_valtype = firstRow.oth_valtype;
                    } else {
                        const { data } = await Axios.get(
                            `/ln/defslocvtp?plant=${firstRow.plant}`
                        );
                        fac_sloc = data.fac_sloc;
                        fac_valtype = data.fac_valtype;
                        oth_sloc = data.oth_sloc;
                        oth_valtype = data.oth_valtype;
                    }

                    setValue("fac_sloc", {
                        value: fac_sloc,
                        label: fac_sloc,
                    });

                    setValue("fac_valtype", {
                        value: fac_valtype,
                        label: fac_valtype,
                    });
                    setValue("oth_valtype", {
                        value: oth_valtype,
                        label: oth_valtype,
                    });
                    setValue("oth_sloc", {
                        value: oth_sloc,
                        label: oth_sloc,
                    });
                    clearErrors();
                } catch (error) {
                    console.error(error);
                } finally {
                    _setLoading(false);
                }
            }
        })();
    }, [firstRow]);

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    const submitItem = values => {
        console.log(values);
        setModalOpen(true);
    };

    const pushSAP = async () => {
        const payload = getValues();
        const newPayload = {
            ...payload,
            fac_sloc: payload.fac_sloc.value,
            fac_valtype: payload.fac_valtype.value,
            oth_sloc: payload.oth_sloc.value,
            oth_valtype: payload.oth_valtype.value,
        };
        setLoadingPush(true);
        // setTimeout(() => {
        //     setLoadingPush(false);
        // }, 3000);
        try {
            const { data } = await Axios.post("/ln/pushmultisap", newPayload);
            setModalscs(true);
            reset({
                fac_sloc: "",
                fac_valtype: "",
                oth_sloc: "",
                oth_valtype: "",
                selected_req: [],
            });
            setResetRow(!resetRow);
            setTimeout(() => {
                setModalscs(false);
                setModalOpen(false);
            }, 3000);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoadingPush(false);
        }
    };

    if ((isWb && who === "wb") || (isLog && who === "log")) {
        return (
            <>
                <Toaster />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                    }}
                >
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            gap: 2,
                            mb: 2,
                            maxWidth: "60rem",
                        }}
                        elevation={4}
                    >
                        {/* <AutoCompleteDOList
                            sx={{ minWidth: "12rem", maxWidth: "15rem" }}
                            label="Nomor DO"
                            onChangeovr={setdataDo}
                        />
                        <AutoCompleteCustomer
                            sx={{ minWidth: "18rem", maxWidth: "15rem" }}
                            label="Customer Code"
                            onChangeovr={setdataCust}
                            do_num={DoNum}
                        /> */}
                        <AutoCompleteCustomer
                            sx={{ minWidth: "30rem", maxWidth: "15rem" }}
                            label="Customer Code"
                            onChangeovr={setdataCust}
                            who={who}
                        />
                        <AutoCompleteDOList
                            sx={{ minWidth: "12rem", maxWidth: "15rem" }}
                            label="Nomor DO"
                            onChangeovr={setdataDo}
                            cust={CustNum}
                            who={who}
                        />
                    </Paper>
                </div>
                {!!errors.selected_req && (
                    <p style={{ color: "red" }}>
                        {errors.selected_req.message}
                    </p>
                )}
                <div>
                    <TableLoadingNoteReq
                        DoNum={DoNumVal}
                        CustNum={CustNumVal}
                        setLoading={setLoading}
                        setSelectedRowsUp={setSelected}
                        resetRows={resetRow}
                        who={who}
                    />
                </div>
                <form
                    onKeyDown={e => checkKeyDown(e)}
                    onSubmit={handleSubmit(submitItem)}
                    style={{ display: "flex", justifyContent: "space-between" }}
                >
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            flexWrap: "wrap",
                            minWidth: "45rem",
                            gap: 2,
                            mb: 2,
                        }}
                        elevation={4}
                    >
                        <AutocompleteComp
                            name="fac_sloc"
                            label="Factory Store Loc."
                            control={control}
                            options={slocop}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="oth_sloc"
                            label="Other Party Store Loc."
                            control={control}
                            options={slocop}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="fac_valtype"
                            label="Factory Val. Type"
                            control={control}
                            options={valtypeOp}
                            rules={{ required: "Please Insert" }}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            disabled={who === "log"}
                        />
                        <AutocompleteComp
                            name="oth_valtype"
                            label="Other Party Val. Type"
                            control={control}
                            options={valtypeOp}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                    </Paper>
                    <input
                        {...register("selected_req", {
                            validate: selected => {
                                return (
                                    selected.length > 0 ||
                                    "Please check data below at least 1"
                                );
                            },
                        })}
                        hidden
                    />
                    <LoadingButton
                        variant="contained"
                        sx={{ m: 3, maxWidth: "10rem", height: "4rem" }}
                        loading={isLoading}
                        // onClick={() => {
                        //     if (isValid) {
                        //         setModalOpen(true);
                        //     }
                        // }}
                        type="submit"
                    >
                        Push To SAP
                    </LoadingButton>
                </form>
                <Dialog
                    open={modalOpen}
                    maxWidth="xl"
                    sx={{ zIndex: theme => theme.zIndex.drawer - 2 }}
                >
                    <DialogTitle>SAP Generate Loading Note</DialogTitle>

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
                        <Typography variant="h4">Data send to SAP :</Typography>
                        <div
                            style={{
                                display: "flex",
                                gap: "3rem",
                                paddingLeft: "1rem",
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <p>Factory Store Loc :</p>{" "}
                                    <p>{getValues("fac_sloc")?.value}</p>
                                </div>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <p>Factory Val. Type :</p>{" "}
                                    <p>{getValues("fac_valtype")?.value}</p>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <p>Other Party Store Loc :</p>{" "}
                                    <p>{getValues("oth_sloc")?.value}</p>
                                </div>
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <p>Other Party Val. Type :</p>{" "}
                                    <p>{getValues("oth_valtype")?.value}</p>
                                </div>
                            </div>
                        </div>
                        <TableSelectedLNReq rowsData={selectedRows} />
                    </Box>
                    <DialogActions>
                        <LoadingButton
                            onClick={() => pushSAP()}
                            color="primary"
                            variant="contained"
                            loading={loadingPush}
                        >
                            Push
                        </LoadingButton>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={modalSuccess}
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
                        <Typography variant="h4">
                            Loading Note Pushed to Staging
                        </Typography>
                    </Box>
                </Dialog>
            </>
        );
    } else {
        return <></>;
    }
}
