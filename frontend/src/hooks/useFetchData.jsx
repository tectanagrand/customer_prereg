import useAxiosPrivate from "./useAxiosPrivate";
import { useEffect, useState } from "react";

export default function useFetchData({ url, initData }) {
    const axiosPrivate = useAxiosPrivate();
    const [refresh, setRefresh] = useState(true);
    const [data, setData] = useState(initData ?? {});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const refreshData = () => setRefresh(true);
    useEffect(() => {
        (async () => {
            if (refresh) {
                setLoading(true);
                try {
                    const { data } = await axiosPrivate.get(url);
                    setData(data);
                } catch (error) {
                    console.error(error);
                    setError(error);
                } finally {
                    setLoading(false);
                    setRefresh(false);
                }
            }
        })();
    }, [url, refresh]);

    return { data, loading, error, refreshData };
}
