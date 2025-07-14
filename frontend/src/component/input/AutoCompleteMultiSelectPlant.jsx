import { Autocomplete, TextField, Box } from "@mui/material";

import { Controller } from "react-hook-form";
import { useMemo } from "react";
import useFetchData from "../../hooks/useFetchData";

export default function AutoCompleteMultiSelectPlant({
    name,
    control,
    label,
    sx,
    disabled,
}) {
    const { data: data_plant, loading: loading_cust } = useFetchData({
        initData: { data: [], count: 0 },
        url: "/master/plantora",
    });
    const plantOp = useMemo(
        () =>
            data_plant.data.length > 0
                ? data_plant.data.map(value => ({
                      label: value.plant_code,
                      value: value.plant_code,
                      ...value,
                  }))
                : [],
        [data_plant]
    );

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => {
                return (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            border: "solid",
                            borderWidth: "2px",
                            p: 2,
                            borderRadius: "6px",
                            gap: 2,
                        }}
                    >
                        <Autocomplete
                            multiple
                            disabled={disabled}
                            value={value}
                            options={plantOp}
                            getOptionLabel={option => option.label}
                            renderInput={params => (
                                <TextField {...params} label={label} />
                            )}
                            sx={sx}
                            onChange={(event, newValue) => {
                                onChange(newValue);
                            }}
                            disableCloseOnSelect={true}
                            isOptionEqualToValue={(option, value) =>
                                option.value === value.value
                            }
                        />
                    </Box>
                );
            }}
        />
    );
}
