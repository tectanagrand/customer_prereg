import TableSelectDriver from "../../component/table/TableSelectDriver";
import TableSelectVehicle from "../../component/table/TableSelectVehicle";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { LoadingButton } from "@mui/lab";
import { useForm } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Axios } from "../../api/axios";
export default function SendEmail() {
    const {
        control,
        handleSubmit,
        register,
        setValue,
        getValues,
        setError,
        clearErrors,
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
            setLoading(true);
            try {
                const { data } = await Axios.post("/file/sendemail", values);
                toast.success(data?.message);
            } catch (error) {
                console.error(error);
                toast.error(error?.response?.data?.message);
            } finally {
                setLoading(false);
                setRefresh(!refresh);
            }
        }
        console.log(values);
    };

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    return (
        <Box>
            <Toaster />
            <Typography variant="h4">
                Email Request Create Master Vehicle and Driver{" "}
            </Typography>
            {errors.root && (
                <h5 style={{ color: "red" }}>{errors.root.message}</h5>
            )}
            <br />
            <Box sx={{ display: "flex", gap: 2 }}>
                <TableSelectDriver
                    setSelectedRowsUp={setSelectDrv}
                    refresh={refresh}
                />
                <TableSelectVehicle
                    setSelectedRowsUp={setSelectVh}
                    refresh={refresh}
                />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <form
                    onSubmit={handleSubmit(submitSendEmail)}
                    onKeyDown={e => checkKeyDown(e)}
                >
                    <input {...register("driver")} hidden />
                    <input {...register("vehicle")} hidden />
                    <LoadingButton
                        type="submit"
                        variant={errors.root ? "outlined" : "contained"}
                        sx={{ m: 4 }}
                        color={errors.root ? "error" : "primary"}
                        loading={loading}
                    >
                        Send Email
                    </LoadingButton>
                </form>
            </Box>
        </Box>
    );
}
