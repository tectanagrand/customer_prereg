import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function GetMultiLN(id) {
    const axiosPrivate = useAxiosPrivate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        (async () => {
            try {
                if (id) {
                    const { data } = await axiosPrivate.get(`/multi/id/${id}`);
                    setData(data.data);
                }
            } catch (error) {
                toast.error(error.response.data.message);
                setError(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { data, loading, error };
}
