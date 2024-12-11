import useAxiosPrivate from "./useAxiosPrivate";
import { useEffect, useState } from "react";

export const fetchMediaTp = () => {
    const axiosPrivate = useAxiosPrivate();
    const [mediaTp, setMediaTp] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await axiosPrivate.get("/master/mediatp");
                setMediaTp(data);
            } catch (error) {
                console.error(error);
                if (error.response) {
                    setError(error.response.data.message);
                } else {
                    setError(error.message);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return {
        mediaTp,
        loading,
        error,
    };
};
