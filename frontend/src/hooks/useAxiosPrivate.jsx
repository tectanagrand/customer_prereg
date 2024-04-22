import { axiosPrivate } from "../api/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import { useSession } from "../provider/sessionProvider";
import axios from "axios";

const notNeeded = ["GET", "HEAD", "OPTIONS"];
const useAxiosPrivate = () => {
    const refresh = useRefreshToken();
    const { session } = useSession();

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            async config => {
                console.log(config);
                if (!config.headers["Authorization"]) {
                    config.headers["Authorization"] =
                        `Bearer ${session.access_token}`;
                }
                if (!notNeeded.includes(config.method.toUpperCase())) {
                    // console.log(config.method);
                    try {
                        const response = await axios.get(
                            `${import.meta.env.VITE_URL_LOC}/getcsrftoken`,
                            { withCredentials: true }
                        );
                        const csrfToken = response.data.csrfToken;
                        config.headers["X-CSRF-Token"] = csrfToken;
                    } catch (error) {
                        console.error(error);
                    }
                }
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
            console.log("clean up  axios private");
            axiosPrivate.interceptors.request.eject(requestIntercept);
            axiosPrivate.interceptors.response.eject(responseIntercept);
        };
    }, [refresh, session]);

    return axiosPrivate;
};

export default useAxiosPrivate;
