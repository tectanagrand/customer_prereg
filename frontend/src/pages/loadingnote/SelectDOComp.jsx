import SelectComp from "../../component/input/SelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useState } from "react";

export default function SelectDOComp({ control, name, label, preop }) {
    const axiosPrivate = useAxiosPrivate();
    const [isLoading, setLoading] = useState(false);
    const [doOP, setDOOp] = useState([]);

    useEffect(() => {
        setDOOp([{ value: preop, label: preop }]);
    }, [preop]);

    const getDataDO = async () => {
        try {
            setLoading(true);
            const { data } = await axiosPrivate.get("/master/dolist", {
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
                }}
                lazy={true}
                isLoading={isLoading}
            />
        </>
    );
}
