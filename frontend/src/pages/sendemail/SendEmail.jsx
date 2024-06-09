import TableSelectDriver from "../../component/table/TableSelectDriver";
import TableSelectVehicle from "../../component/table/TableSelectVehicle";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { LoadingButton } from "@mui/lab";
import { useForm } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import RefreshButton from "../../component/common/RefreshButton";
export default function SendEmail() {
    const axiosPrivate = useAxiosPrivate();
    const {
        control,
        handleSubmit,
        register,
        setValue,
        setError,
        clearErrors,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            driver: [],
            vehicle: [],
        },
    });

    const setSelectDrv = value => {
        setValue("driver", value);
        clearErrors();
    };

    const setSelectVh = value => {
        setValue("vehicle", value);
        clearErrors();
    };

    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);

    const submitSendEmail = async values => {
        if (values.driver.length === 0 && values.vehicle.length === 0) {
            setError("root", { message: "Please select at least 1 data" });
        } else {
            try {
                setLoading(true);
                const { data } = await axiosPrivate.post("/file/sendtolog", {
                    ...values,
                });
                toast.success(data?.message);
                reset({
                    driver: [],
                    vehicle: [],
                });
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message);
            } finally {
                setLoading(false);
                setRefresh(true);
            }
        }
    };

    const setRefreshBtn = () => {
        setRefresh(false);
    };

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };

    return (
        <Box>
            <form
                onSubmit={handleSubmit(submitSendEmail)}
                onKeyDown={e => checkKeyDown(e)}
            >
                <Toaster />
                <div style={{ display: "flex", gap: "1rem" }}>
                    <Typography variant="h4">
                        Email Request Create Master Vehicle and Driver
                    </Typography>
                    <RefreshButton
                        setRefreshbtn={setRefresh}
                        isLoading={refresh}
                    />
                </div>
                {errors.root && (
                    <h5 style={{ color: "red" }}>{errors.root.message}</h5>
                )}
                <br />
                <Box sx={{ display: "flex", gap: 2 }}>
                    <TableSelectDriver
                        setSelectedRowsUp={setSelectDrv}
                        refresh={refresh}
                        setRefr={setRefreshBtn}
                        sx={{ height: "30rem" }}
                    />
                    <TableSelectVehicle
                        setSelectedRowsUp={setSelectVh}
                        refresh={refresh}
                        setRefr={setRefreshBtn}
                        sx={{ height: "30rem" }}
                    />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <input {...register("driver")} hidden />
                    <input {...register("vehicle")} hidden />
                    <LoadingButton
                        type="submit"
                        variant={errors.root ? "outlined" : "contained"}
                        sx={{ m: 4 }}
                        color={errors.root ? "error" : "primary"}
                        loading={refresh || loading}
                    >
                        Send Email
                    </LoadingButton>
                </Box>
            </form>
        </Box>
    );
}
