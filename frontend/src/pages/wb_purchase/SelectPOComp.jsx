import SelectComp from "../../component/input/SelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SelectPOComp({
    control,
    name,
    label,
    preop,
    cust_id,
    rules,
}) {
    const axiosPrivate = useAxiosPrivate();
    const [isloading, setLoading] = useState(false);
    const [poOP, setPOOp] = useState([]);

    useEffect(() => {
        setPOOp([{ value: preop, label: preop }]);
    }, [preop]);

    // useEffect(() => {
    //     (async () => {
    //         getDataDO();
    //     })();
    // }, [cust_id]);
    const getDataPO = async () => {
        try {
            setLoading(true);
            const URLParams = new URLSearchParams();
            if (cust_id) {
                URLParams.append("cust", cust_id);
            }
            const { data } = await axiosPrivate.get(
                `/master/pocust?${URLParams.toString()}`,
                {
                    withCredentials: true,
                }
            );
            setPOOp(
                data.result.map(item => ({
                    value: item.po_num,
                    label: item.po_num,
                }))
            );
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
                options={poOP}
                onOpen={() => {
                    getDataPO();
                }}
                sx={{
                    mr: 1,
                    maxWidth: "10rem",
                    minWidth: "6rem",
                }}
                lazy={true}
                isLoading={isloading}
                rules={rules}
            />
        </>
    );
}
