import AutoCompleteCustomerTol from "./AutoCompleteCustomerTol";
import AutoCompleteSTOListTol from "./AutoCompleteSTOListTol";
import TableTollingApproval from "../../component/table/TableTollingApproval";
import { useForm } from "react-hook-form";
import { useTheme } from "@mui/material/styles";
import { Box, Paper, TextField } from "@mui/material";
import ResultDialog from "../../component/common/ResultDialog";
import { debounce } from "lodash";
import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { LoadingButton } from "@mui/lab";
import { NumericFormat } from "react-number-format";
import DialogFormConfirmation from "../../component/common/DialogFormConfirmation";
import ConfirmApprovalTol from "./ConfirmApprovalTol";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const ResponseDialogText = (textresult, lnnum) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: "100%",
            }}
        >
            <h2 style={{ marginBottom: "0px", marginTop: "0px" }}>
                {textresult}
            </h2>
            <p style={{ marginBottom: "0px" }}>List of loading note :</p>
            <p style={{ fontSize: "8pt" }}>{lnnum}</p>
        </Box>
    );
};

export default function TollingApproval() {
    const axiosPrivate = useAxiosPrivate();
    const {
        handleSubmit,
        register,
        setValue,
        reset,
        getValues,
        formState: { errors, isValid },
    } = useForm({
        defaultValues: {
            selected_req: [],
        },
    });
    const [STONum, setSTONum] = useState("");
    const [CustNum, setCustNum] = useState("");
    const [resetRow, setResetRow] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [remainingQty, setRemaining] = useState(0);

    //DialogResult
    const [isOpen, setOpen] = useState(false);
    const [state, setState] = useState("");
    const [text, setText] = useState(<></>);

    //Dialog Confirmation
    const [openConf, setOpenConf] = useState(false);

    function openDialog(state, text) {
        setState(state);
        setText(text);
        setOpen(true);
    }

    function closeDialog() {
        setOpen(false);
    }

    //

    const setSelected = value => {
        setValue(
            "selected_req",
            value.map(item => ({
                ...item,
                plan_qty: item.plan_qty.replace(/,/g, ""),
            }))
        );
    };

    const setDataSTO = useCallback(value => {
        setSTONum(value);
    }, []);
    const setdataCust = debounce(value => {
        setCustNum(value?.split("-")[1]?.trim());
    }, 1000);

    const approveTol = async value => {
        setLoading(true);
        try {
            const payload = {
                data_req: value.selected_req,
            };
            const { data } = await axiosPrivate.post(
                "/tol/approvetol",
                payload
            );
            openDialog(
                "success",
                ResponseDialogText(
                    "Successfully Created Loading Note",
                    data.created.join(", ")
                )
            );
            setOpenConf(false);
            reset({
                selected_req: [],
            });
            return;
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
            setResetRow(!resetRow);
        }
    };

    const submitTol = () => {
        setOpenConf(true);
    };

    const cancelTol = () => {
        setOpenConf(false);
    };
    return (
        <>
            <Toaster />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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
                    <AutoCompleteCustomerTol
                        sx={{ minWidth: "30rem", maxWidth: "15rem" }}
                        label="Customer Code"
                        onChangeovr={setdataCust}
                    />
                    <AutoCompleteSTOListTol
                        sx={{ minWidth: "12rem", maxWidth: "15rem" }}
                        label="Nomor STO"
                        onChangeovr={setDataSTO}
                        cust={CustNum}
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
            </Box>
            {!!errors.selected_req && (
                <p style={{ color: "red" }}>{errors.selected_req.message}</p>
            )}
            <ResultDialog
                modalOpen={isOpen}
                State={state}
                Text={text}
                onCloseModal={closeDialog}
            />
            <TableTollingApproval
                STONum={STONum}
                CustNum={CustNum}
                setLoading={setLoading}
                setSelectedRowsUp={setSelected}
                setRemainingUp={setRemaining}
                remaining={remainingQty}
                resetRows={resetRow}
            />
            <form onSubmit={handleSubmit(submitTol)}>
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
                    Approve Request
                </LoadingButton>
            </form>
            <DialogFormConfirmation
                open={openConf}
                setOpen={setOpenConf}
                Content={
                    <ConfirmApprovalTol rows={getValues("selected_req")} />
                }
                onYes={approveTol}
                onNo={cancelTol}
                values={getValues()}
                Title={"Confirm Approval Tolling"}
            />
        </>
    );
}
