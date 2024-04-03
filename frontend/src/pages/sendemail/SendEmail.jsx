import TableSelectDriver from "../../component/table/TableSelectDriver";
import TableSelectVehicle from "../../component/table/TableSelectVehicle";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import { LoadingButton } from "@mui/lab";
import { useForm } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { useState } from "react";
export default function SendEmail() {
    const {
        control,
        handleSubmit,
        register,
        setValue,
        getValues,
        formState: { errors },
    } = useForm({
        defaultValues: {
            driver: [],
            vehicle: [],
        },
    });

    console.log(errors);

    const setSelectDrv = value => {
        setValue("driver", value);
    };

    const setSelectVh = value => {
        setValue("vehicle", value);
    };

    const submitSendEmail = values => {
        console.log(values);
    };

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    return (
        <Box>
            <Typography variant="h4">
                Email Request Create Master Vehicle and Driver{" "}
            </Typography>
            <br />
            <Box sx={{ display: "flex", gap: 2 }}>
                <TableSelectDriver setSelectedRowsUp={setSelectDrv} />
                <TableSelectVehicle setSelectedRowsUp={setSelectVh} />
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
                        variant="contained"
                        sx={{ m: 4 }}
                    >
                        Send Email
                    </LoadingButton>
                </form>
            </Box>
        </Box>
    );
}
