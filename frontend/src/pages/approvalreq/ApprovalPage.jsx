import {
    Container,
    Box,
    SvgIcon,
    Stack,
    Dialog,
    Typography,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";
import KpnNav from "../../images/kpn-logo.svg?react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useSearchParams } from "react-router-dom";
import TableSelectDriver from "../../component/table/TableSelectDriver";
import TableSelectVehicle from "../../component/table/TableSelectVehicle";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import toast from "react-hot-toast";

const ApprovalPage = () => {
    const axiosPrivate = useAxiosPrivate();
    const theme = useTheme();
    const [searchParams] = useSearchParams();
    const [plantOp, setPlantOp] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [dataReq, setDataReq] = useState();
    const [modalScs, setScsModal] = useState(false);
    const [someSelVeh, _setSomeVeh] = useState(false);
    const [someSelDrv, _setSomeDrv] = useState(false);

    const setSomeVeh = value => {
        _setSomeVeh(value);
    };

    const setSomeDrv = value => {
        _setSomeDrv(value);
    };

    const {
        register,
        handleSubmit,
        control,
        setValue,
        clearErrors,
        formState: { errors },
    } = useForm({
        defaultValues:
            searchParams.get("action") === "approve"
                ? {
                      driver: [],
                      vehicle: [],
                      plant: "",
                  }
                : {
                      reject_remark: "",
                  },
    });
    const setRefreshBtn = () => {
        setRefresh(false);
    };
    useEffect(() => {
        setRefresh(true);
        if (!searchParams.get("ticket_id")) {
            throw new Error("Ticket Number Not Valid");
        }
        (async () => {
            try {
                const { data } = await axiosPrivate(
                    `/file/reqdrvveh?ticket_id=${searchParams.get("ticket_id")}`
                );
                setDataReq({
                    ticket_number: data.request_id,
                    requestor: data?.fullname,
                    emails: data?.email,
                });
                if (data.position === "ADM") {
                    setScsModal(true);
                }
            } catch (error) {
                console.error(error);
                throw error;
            } finally {
                setRefresh(false);
            }
        })();
    }, []);
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get("/master/plt");
                setPlantOp(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);
    const setSelectDrv = value => {
        setValue("driver", value);
        clearErrors();
    };
    const setSelectVh = value => {
        setValue("vehicle", value);
        clearErrors();
    };

    const approveRequest = async values => {
        let payload = {};

        let endpoint = "";

        if (searchParams.get("action") === "approve") {
            payload = {
                plant: values.plant.value,
                driver: values.driver,
                vehicle: values.vehicle,
                action: "APPROVE",
                id: searchParams.get("ticket_id"),
                reject_remark: values.reject_remark ?? "",
            };
            endpoint = `/file/approvereq`;
        } else {
            payload = {
                action: "REJECT",
                id: searchParams.get("ticket_id"),
                reject_remark: values.reject_remark,
            };
            endpoint = `/file/rejectreq`;
        }
        setRefresh(true);
        try {
            const { data } = await axiosPrivate.post(endpoint, payload);
            setScsModal(true);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setRefresh(false);
        }
    };
    return (
        <Container>
            <Box
                sx={{
                    backgroundColor: theme.palette.secondary.lighter,
                    paddingY: 2,
                }}
            >
                <div style={{ display: "flex", alignItems: "center" }}>
                    <SvgIcon
                        component={KpnNav}
                        sx={{
                            width: "2rem",
                            height: "2rem",
                            mt: "0.1rem",
                            mx: 3,
                        }}
                        viewBox="0 0 5000 5000"
                        color="white"
                    />
                    <h4>Customer Pre Registration App</h4>
                </div>
                <div
                    style={{
                        margin: "0 0 0 2rem",
                        padding: "0 2rem 0 0 ",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <h2>
                        Request Master Driver & Vehicle :
                        {dataReq?.ticket_number}
                    </h2>
                    <div style={{ textAlign: "right" }}>
                        <h4>Requestor : {dataReq?.requestor}</h4>
                        <h4>Emails : {dataReq?.emails}</h4>
                    </div>
                </div>
            </Box>
            <Stack sx={{ paddingY: 2, gap: 4 }}>
                <form onSubmit={handleSubmit(approveRequest)}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        {searchParams.get("action") === "approve" && (
                            <AutocompleteComp
                                control={control}
                                name="plant"
                                label="Plant Target"
                                rules={{ required: "Please insert this field" }}
                                options={plantOp}
                                sx={{ minWidth: "8rem", maxWidth: "30rem" }}
                            />
                        )}
                        {(searchParams.get("action") === "reject" ||
                            someSelDrv ||
                            someSelVeh) && (
                            <TextFieldComp
                                control={control}
                                name="reject_remark"
                                label="Rejection Remarks"
                                rules={{
                                    required: "Please insert this field",
                                    maxLength: {
                                        value: 500,
                                        message: "Max 500 Character",
                                    },
                                }}
                                sx={{ minWidth: "8rem" }}
                                multiline
                            />
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <TableSelectVehicle
                            setSelectedRowsUp={setSelectVh}
                            sx={{ height: "20rem", width: "20rem" }}
                            req_id={searchParams.get("ticket_id")}
                            setRefr={setRefreshBtn}
                            notselect={searchParams.get("action") === "reject"}
                            setSomeVeh={setSomeVeh}
                        />
                        <TableSelectDriver
                            setSelectedRowsUp={setSelectDrv}
                            sx={{ height: "20rem", width: "50rem" }}
                            req_id={searchParams.get("ticket_id")}
                            setRefr={setRefreshBtn}
                            notselect={searchParams.get("action") === "reject"}
                            setSomeDrv={setSomeDrv}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <input {...register("driver")} hidden />
                        <input {...register("vehicle")} hidden />
                        <LoadingButton
                            type="submit"
                            variant={errors.root ? "outlined" : "contained"}
                            sx={{ m: 4 }}
                            color={
                                searchParams.get("action") === "approve"
                                    ? "primary"
                                    : "error"
                            }
                            loading={refresh}
                        >
                            {searchParams.get("action") === "approve"
                                ? "Approve Request"
                                : "Reject Request"}
                        </LoadingButton>
                    </Box>
                </form>
            </Stack>
            <Dialog
                open={modalScs}
                maxWidth="sm"
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
                            color:
                                searchParams.get("action") === "approve"
                                    ? "green"
                                    : "red",
                        }}
                    />
                    <Typography variant="h4">
                        {dataReq?.ticket_number} Request Driver / Vehicle{" "}
                        {searchParams.get("action") === "approve"
                            ? "is Approved"
                            : "is Rejected"}
                    </Typography>
                </Box>
            </Dialog>
        </Container>
    );
};

export default ApprovalPage;
