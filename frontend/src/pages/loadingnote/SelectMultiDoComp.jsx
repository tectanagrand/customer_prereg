import SelectComp from "../../component/input/SelectComp";
import { Axios } from "../../api/axios";
import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { getSelectUtilityClasses } from "@mui/material";

export default function SelectMultiDOComp({
    control,
    name,
    label,
    preop,
    disabled,
}) {
    const [isLoading, setLoading] = useState(false);
    const [doOP, setDOOp] = useState([]);
    const theme = useTheme();

    useEffect(() => {
        if (preop) {
            setDOOp(preop.map(item => ({ value: item, label: item })));
        }
    }, [preop]);

    const getDataDO = async () => {
        try {
            setLoading(true);
            const { data } = await Axios.get("/master/dolist", {
                withCredentials: true,
            });
            setDOOp(data);
            // toast.success("Success Load DO");
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SelectComp
                name={name}
                label={label}
                fullWidth
                control={control}
                options={doOP}
                onOpen={() => getDataDO()}
                sx={{
                    mr: 3,
                    maxWidth: "16rem",
                    minWidth: "10rem",
                    label: {
                        "&.Mui-disabled": {
                            color: theme.palette.action.disabled,
                        },
                    },
                    "& .MuiInputBase-root.Mui-disabled": {
                        "& > fieldset": {
                            borderColor: theme.palette.action.disabled,
                        },
                    },
                }}
                lazy={true}
                isLoading={isLoading}
                multiple={true}
                disabled={disabled}
            />
        </>
    );
}
