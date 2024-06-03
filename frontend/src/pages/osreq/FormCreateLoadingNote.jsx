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
    TextField,
} from "@mui/material";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import TableSelectedLNReq from "../../component/table/TableSelectedLNReq";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { debounce } from "lodash";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useSession } from "../../provider/sessionProvider";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { NumericFormat } from "react-number-format";

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
            fac_batch: "",
            fac_valtype: "",
            oth_sloc: "",
            oth_batch: "",
            oth_valtype: "",
            selected_req: [],
        },
    });
    const {
        control: controlCancel,
        handleSubmit: cancelSubmit,
        clearErrors: cancelClearErrors,
        setValue: setCancelValue,
    } = useForm({
        defaultValues: {
            cancel_remark: "",
            selected_cancel: [],
        },
    });
    const axiosPrivate = useAxiosPrivate();
    const [DoNum, setDoNum] = useState("");
    const [CustNum, setCustNum] = useState("");
    const [slocopfac, setSlocopfac] = useState([]);
    const [slocopoth, setSlocopoth] = useState([]);
    const [facBatchOp, setFacBatchOp] = useState([]);
    const [othBatchOp, setOthBatchOp] = useState([]);
    const [valtypeOp, setvpOp] = useState([]);
    const [isLoading, _setLoading] = useState(false);
    const [loadingPush, setLoadingPush] = useState(false);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [selectedRows, _setSelected] = useState([]);
    const [resetRow, setResetRow] = useState(false);
    const [modalSuccess, setModalscs] = useState(false);
    const [firstRow, setFirstRow] = useState(null);
    const [remainingQty, _setRemaining] = useState(0);
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
        setValue(
            "selected_req",
            value.map(item => ({
                ...item,
                plan_qty: item.plan_qty.replace(/,/g, ""),
            }))
        );
        setFirstRow(value[0] ?? null);
        _setSelected(value);
    };

    function setRemaining(value) {
        _setRemaining(value);
    }

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
        if (!firstRow) {
            reset({
                fac_sloc: "",
                fac_valtype: "",
                oth_sloc: "",
                oth_valtype: "",
                fac_batch: "",
                oth_batch: "",
                selected_req: [],
            });
        } else {
            _setLoading(true);
            (async () => {
                try {
                    const { data: getSloc } = await axiosPrivate.get(
                        `/master/sloc?plant=${firstRow.plant}&itemrule=${firstRow.rules}`
                    );
                    const slocfac = getSloc.factory;
                    const slocoth = getSloc.other;
                    const { data: getValtype } = await axiosPrivate.get(
                        `/master/valtype?plant=${firstRow.plant}&material=${firstRow.material}`
                    );
                    const valType = getValtype;
                    const { data: getBatch } = await axiosPrivate.get(
                        `/master/batchdb?company=${firstRow.company}`
                    );
                    const batch = getBatch.batch.map(item => ({
                        value: item,
                        label: item,
                    }));
                    if (getBatch.group === "UPSTREAM") {
                        setValue(
                            "fac_batch",
                            firstRow.fac_batch
                                ? {
                                      value: firstRow.fac_batch,
                                      label: firstRow.fac_batch,
                                  }
                                : batch[0]
                        );
                        setFacBatchOp(batch);
                        setValue("oth_batch", {
                            value: firstRow.id_do,
                            label: firstRow.id_do,
                        });
                    } else {
                        setValue("fac_batch", {
                            value: firstRow.company,
                            label: firstRow.company,
                        });
                        setValue(
                            "oth_batch",
                            firstRow.oth_batch
                                ? {
                                      value: firstRow.oth_batch,
                                      label: firstRow.oth_batch,
                                  }
                                : null
                        );
                    }
                    if (firstRow.fac_sloc !== "" && firstRow.fac_sloc) {
                        setValue("fac_sloc", {
                            value: firstRow.fac_sloc,
                            label:
                                firstRow.fac_sloc +
                                " - " +
                                firstRow.fac_sloc_desc,
                        });
                    } else {
                        setValue("fac_sloc", {
                            value: slocfac[0].value,
                            label: slocfac[0].value + " - " + slocfac[0].label,
                        });
                    }
                    if (firstRow.oth_sloc !== "" && firstRow.oth_sloc) {
                        setValue("oth_sloc", {
                            value: firstRow.oth_sloc,
                            label:
                                firstRow.oth_sloc +
                                " - " +
                                firstRow.oth_sloc_desc,
                        });
                    } else {
                        setValue("oth_sloc", {
                            value: slocoth[0].value,
                            label: slocoth[0].value + " - " + slocoth[0].label,
                        });
                    }
                    if (firstRow.fac_valtype !== "" && firstRow.fac_valtype) {
                        setValue("fac_valtype", {
                            value: firstRow.fac_valtype,
                            label: firstRow.fac_valtype,
                        });
                    } else {
                        setValue("fac_valtype", {
                            value: getValtype[0].value,
                            label: getValtype[0].label,
                        });
                    }
                    if (firstRow.oth_valtype !== "" && firstRow.oth_valtype) {
                        setValue("oth_valtype", {
                            value: firstRow.oth_valtype,
                            label: firstRow.oth_valtype,
                        });
                    } else {
                        setValue("oth_valtype", {
                            value: getValtype[0].value,
                            label: getValtype[0].label,
                        });
                    }
                    setSlocopfac(slocfac);
                    setSlocopoth(slocoth);
                    setvpOp(valType);
                    clearErrors();
                } catch (error) {
                    console.error(error);
                } finally {
                    _setLoading(false);
                }
            })();
        }
    }, [firstRow]);

    // useEffect(() => {
    //     (async () => {
    //         if (!firstRow) {
    //             reset({
    //                 fac_sloc: "",
    //                 fac_valtype: "",
    //                 oth_sloc: "",
    //                 oth_valtype: "",
    //                 fac_batch: "",
    //                 oth_batch: "",
    //                 selected_req: [],
    //             });
    //         } else {
    //             let fac_sloc,
    //                 fac_valtype,
    //                 oth_sloc,
    //                 oth_valtype,
    //                 fac_sloc_desc,
    //                 oth_sloc_desc;
    //             try {
    //                 _setLoading(true);
    //                 if (who === "wb") {
    //                     fac_sloc = firstRow.fac_sloc;
    //                     fac_sloc_desc = firstRow.fac_sloc_desc;
    //                     fac_valtype = firstRow.fac_valtype;
    //                     oth_sloc = firstRow.oth_sloc;
    //                     oth_sloc_desc = firstRow.oth_sloc_desc;
    //                     oth_valtype = firstRow.oth_valtype;
    //                 } else {
    //                     const { data } = await axiosPrivate.get(
    //                         `/ln/defslocvtp?plant=${firstRow.plant}`
    //                     );
    //                     const { data: Op } = await axiosPrivate.get(
    //                         `/master/sloc?plant=${firstRow?.plant}&material=${firstRow?.material}`
    //                     );
    //                     if (data !== "") {
    //                         fac_sloc = data.fac_sloc;
    //                         fac_sloc_desc = data.fac_sloc_desc;
    //                         fac_valtype = data.fac_valtype;
    //                         oth_sloc = data.oth_sloc;
    //                         oth_sloc_desc = data.oth_sloc_desc;
    //                         oth_valtype = data.oth_valtype;
    //                     } else {
    //                         fac_sloc = Op.sloc[0].value;
    //                         fac_sloc_desc = Op.sloc[0].label;
    //                         fac_valtype = Op.valtype[0].value;
    //                         oth_sloc = Op.sloc[0].value;
    //                         oth_sloc_desc = Op.sloc[0].label;
    //                         oth_valtype = Op.valtype[0].value;
    //                     }
    //                 }
    //                 setValue("fac_sloc", {
    //                     value: fac_sloc,
    //                     label: fac_sloc + " - " + fac_sloc_desc,
    //                 });

    //                 setValue("fac_valtype", {
    //                     value: fac_valtype,
    //                     label: fac_valtype,
    //                 });
    //                 setValue("oth_valtype", {
    //                     value: oth_valtype,
    //                     label: oth_valtype,
    //                 });
    //                 setValue("oth_sloc", {
    //                     value: oth_sloc,
    //                     label: oth_sloc + " - " + oth_sloc_desc,
    //                 });
    //                 clearErrors();
    //             } catch (error) {
    //                 console.error(error);
    //             } finally {
    //                 _setLoading(false);
    //             }
    //         }
    //     })();
    // }, [firstRow]);

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    const submitItem = values => {
        setModalOpen(true);
    };

    const cancelModal = e => {
        setCancelOpen(true);
        setCancelValue("selected_cancel", selectedRows);
    };

    const cancelReq = async values => {
        setLoadingCancel(true);
        try {
            const cancelData = await axiosPrivate.post("/ln/cancel", values);
            toast.success("Data request cancelled");
            setCancelOpen(false);
            setResetRow(!resetRow);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoadingCancel(false);
        }
    };

    const pushSAP = async () => {
        const payload = getValues();
        const newPayload = {
            ...payload,
            fac_sloc: payload.fac_sloc.value,
            fac_sloc_desc: payload.fac_sloc.label.split("-")[1].trim(),
            fac_valtype: payload.fac_valtype.value,
            oth_sloc: payload.oth_sloc.value,
            oth_sloc_desc: payload.oth_sloc.label.split("-")[1].trim(),
            oth_valtype: payload.oth_valtype.value,
            fac_batch: payload.fac_batch.value,
            oth_batch: payload.oth_batch.value,
        };

        setLoadingPush(true);
        // setTimeout(() => {
        //     setLoadingPush(false);
        // }, 3000);
        try {
            const { data } = await axiosPrivate.post(
                "/ln/pushmultisap",
                newPayload
            );
            setModalOpen(false);
            setModalscs(true);
            reset({
                fac_sloc: "",
                fac_valtype: "",
                fac_batch: "",
                oth_batch: "",
                oth_sloc: "",
                oth_valtype: "",
                selected_req: [],
            });
            setResetRow(!resetRow);
            setTimeout(() => {
                setModalscs(false);
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
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            gap: 2,
                            mb: 2,
                            maxWidth: "60rem",
                        }}
                    >
                        <NumericFormat
                            customInput={TextField}
                            sx={{ input: { cursor: "default" } }}
                            label="O/S Quantity"
                            value={remainingQty}
                            inputProps={{ readOnly: true }}
                            thousandSeparator
                            error={remainingQty < 0}
                            helperText={remainingQty < 0 && "Quantity Exceeded"}
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
                        setRemainingUp={setRemaining}
                        remaining={remainingQty}
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
                            options={slocopfac}
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
                            options={slocopoth}
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
                            name="fac_batch"
                            label="Factory Batch"
                            control={control}
                            options={facBatchOp}
                            rules={{ required: "Please Insert" }}
                            freeSolo={true}
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
                            // disabled={who === "log"}
                        />
                        <AutocompleteComp
                            name="oth_batch"
                            label="Other Party Batch"
                            control={control}
                            options={othBatchOp}
                            freeSolo
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
                            // disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="fac_valtype"
                            label="Factory Party Val. Type"
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
                            rules={{ required: "Please Insert" }}
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
                    <Box>
                        {who === "log" && (
                            <>
                                <Button
                                    color="warning"
                                    onClick={cancelModal}
                                    disabled={selectedRows.length === 0}
                                >
                                    Cancel Request
                                </Button>
                            </>
                        )}

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
                            disabled={remainingQty < 0}
                        >
                            Push To SAP
                        </LoadingButton>
                    </Box>
                </form>
                <Dialog open={modalOpen} maxWidth="xl">
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
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <p>Factory Batch :</p>{" "}
                                    <p>{getValues("fac_batch")?.value}</p>
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
                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <p>Other Party Batch :</p>{" "}
                                    <p>{getValues("oth_batch")?.value}</p>
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
                <Dialog
                    open={cancelOpen}
                    onClose={() => {
                        setCancelOpen(false);
                        cancelClearErrors();
                    }}
                    maxWidth="xl"
                >
                    <DialogTitle>Cancel Loading Note</DialogTitle>
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
                            Cancel Loading Note Request :
                        </Typography>
                        <form onSubmit={cancelSubmit(cancelReq)}>
                            <TextFieldComp
                                control={controlCancel}
                                name="cancel_remark"
                                label="Cancel Reason"
                                sx={{ mb: "1rem" }}
                                rules={{
                                    required:
                                        "Please write cancellation reason",
                                }}
                            />
                            <TableSelectedLNReq
                                rowsData={selectedRows}
                                sx={{ height: "15rem" }}
                            />
                            <DialogActions>
                                <Button
                                    onClick={() => {
                                        setCancelOpen(false);
                                        cancelClearErrors();
                                    }}
                                >
                                    Close
                                </Button>
                                <LoadingButton
                                    loading={loadingCancel}
                                    type="submit"
                                >
                                    Process
                                </LoadingButton>
                            </DialogActions>
                        </form>
                    </Box>
                </Dialog>
            </>
        );
    } else {
        return <></>;
    }
}
