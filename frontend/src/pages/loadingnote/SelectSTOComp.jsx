import SelectComp from "../../component/input/SelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SelectSTOComp({ control, name, label, preop, do_num }) {
    const axiosPrivate = useAxiosPrivate();
    const [isLoading, setLoading] = useState(false);
    const [stoOP, setSTOOp] = useState([]);
    console.log(do_num);

    useEffect(() => {
        setSTOOp([{ value: preop, label: preop }]);
    }, [preop]);

    const getDataSTO = async () => {
        if (!do_num) {
            toast.error("Please provide DO Number");
            return;
        }
        try {
            setLoading(true);
            const { data } = await axiosPrivate.get(
                "/master/stolist?do_num=" + do_num,
                {
                    withCredentials: true,
                }
            );
            setSTOOp(data);
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
                options={stoOP}
                onOpen={() => getDataSTO()}
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
