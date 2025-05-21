import SelectComp from "../../component/input/SelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SelectDOComp({
    control,
    name,
    label,
    preop,
    onChangeOvr,
    type,
    cust_id,
    cgrp,
    rules,
}) {
    const axiosPrivate = useAxiosPrivate();
    const [isloading, setLoading] = useState(false);
    const [doOP, setDOOp] = useState([]);

    useEffect(() => {
        setDOOp([{ value: preop, label: preop }]);
    }, [preop]);

    // useEffect(() => {
    //     (async () => {
    //         getDataDO();
    //     })();
    // }, [cust_id]);
    const getDataDO = async () => {
        try {
            setLoading(true);
            const URLParams = new URLSearchParams();
            if (type) {
                URLParams.append("type", type);
            }
            if (cust_id) {
                URLParams.append("cust", cust_id);
            }
            if (cgrp) {
                URLParams.append("bu", cgrp);
            }
            const { data } = await axiosPrivate.get(
                `/master/dolist?${URLParams.toString()}`,
                {
                    withCredentials: true,
                }
            );
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
                onChangeovr={onChangeOvr}
                name={name}
                label={label}
                fullWidth
                control={control}
                options={doOP}
                onOpen={() => {
                    getDataDO();
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
