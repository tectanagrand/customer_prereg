import SelectComp from "../../component/input/SelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SelectDOFRCComp({
    control,
    name,
    label,
    preop,
    onChangeOvr,
    getValue,
    comp_group,
}) {
    const axiosPrivate = useAxiosPrivate();
    const [isLoading, setLoading] = useState(false);
    const [doOP, setDOOp] = useState([]);

    useEffect(() => {
        setDOOp([{ value: preop, label: preop }]);
    }, [preop]);

    const getDataDO = async () => {
        try {
            const comp_grp = comp_group ? `&comp_group=${comp_group}` : "";
            setLoading(true);
            const { data } = await axiosPrivate.get(
                "/master/frcdocgrp?sto=" + getValue("sto_num") + comp_grp,
                {
                    withCredentials: true,
                }
            );
            setDOOp(data.data);
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
