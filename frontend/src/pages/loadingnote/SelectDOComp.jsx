import SelectComp from "../../component/input/SelectComp";
import { Axios } from "../../api/axios";
import { useEffect, useState } from "react";

export default function SelectDOComp({ control, name, label, preop }) {
    const [isLoading, setLoading] = useState(false);
    const [doOP, setDOOp] = useState([]);

    useEffect(() => {
        setDOOp([{ value: preop, label: preop }]);
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
                    mb: 3,
                    mr: 3,
                    maxWidth: "16rem",
                    minWidth: "10rem",
                }}
                lazy={true}
                isLoading={isLoading}
            />
        </>
    );
}
