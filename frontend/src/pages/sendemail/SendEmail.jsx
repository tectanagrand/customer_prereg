import TableSelectDriver from "../../component/table/TableSelectDriver";
import TableSelectVehicle from "../../component/table/TableSelectVehicle";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { LoadingButton } from "@mui/lab";
import { useForm } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
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
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            driver: [],
            vehicle: [],
            plant: "",
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
    const [plantOp, setPlantOp] = useState([]);

    const submitSendEmail = async values => {
        if (values.driver.length === 0 && values.vehicle.length === 0) {
            setError("root", { message: "Please select at least 1 data" });
        } else {
            setLoading(true);
            try {
                const { data } = await Axios.post("/file/sendemail", {
                    ...values,
                    plant: values.plant.value,
                });
                toast.success(data?.message);
                reset({
                    driver: [],
                    vehicle: [],
                    plant: "",
                });
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

    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get("/master/plt");
                setPlantOp(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    return (
        <Box>
            <form
                onSubmit={handleSubmit(submitSendEmail)}
                onKeyDown={e => checkKeyDown(e)}
            >
                <Toaster />
                <Typography variant="h4">
                    Email Request Create Master Vehicle and Driver{" "}
                </Typography>
                {errors.root && (
                    <h5 style={{ color: "red" }}>{errors.root.message}</h5>
                )}
                <br />
                <AutocompleteComp
                    name="plant"
                    label="Plant"
                    control={control}
                    options={plantOp}
                    sx={{ maxWidth: "40rem", m: 2 }}
                    rules={{
                        required: "Please insert this field",
                    }}
                />
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
                </Box>
            </form>
        </Box>
    );
}
