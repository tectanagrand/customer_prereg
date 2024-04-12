import { axiosPrivate, Axios } from "../api/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import { useSession } from "../provider/sessionProvider";

const useAxiosPrivate = () => {
    const refresh = useRefreshToken();
    const { session } = useSession();

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            async config => {
                if (!config.headers["Authorization"]) {
                    config.headers["Authorization"] =
                        `Bearer ${session.access_token}`;
                }
                // try {
                //     const response = await Axios.get("/getcsrftoken");
                //     const csrfToken = response.data.csrfToken;
                //     config.headers["X-CSRF-Token"] = csrfToken;
                // } catch (error) {
                //     console.error(error);
                // }
                return config;
            },
            error => Promise.reject(error)
        );

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async error => {
                const prevRequest = error?.config;
                if (error?.response?.status === 403 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    const newAccessToken = await refresh();
                    prevRequest.headers["Authorization"] =
                        `Bearer ${newAccessToken}`;
                    return axiosPrivate(prevRequest);
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept);
            axiosPrivate.interceptors.response.eject(responseIntercept);
        };
    }, [session, refresh]);

    return axiosPrivate;
};

export default useAxiosPrivate;
