import { axiosPrivate } from "../api/axios";
import { useEffect } from "react";
import useRefreshToken from "./useRefreshToken";
import useRefreshTokenApproval from "./useRefreshTokenApproval";
import { useSession } from "../provider/sessionProvider";
import axios from "axios";

const notNeeded = ["POST"];
const useAxiosPrivate = () => {
    const refresh = useRefreshToken();
    const refreshApproval = useRefreshTokenApproval();
    const { session } = useSession();
    const csrfTokenSet = new Set(notNeeded.map(method => method.toUpperCase()));

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            async config => {
                if (!config.headers["Authorization"]) {
                    config.headers["Authorization"] =
                        `Bearer ${session?.access_token}`;
                }
                if (
                    csrfTokenSet.has(config.method.toUpperCase()) ||
                    !config.headers["X-CSRF-Token"]
                ) {
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
                    let newAccessToken;
                    if (window.location.pathname.split("/")[1] !== "approval") {
                        newAccessToken = await refresh();
                    } else {
                        newAccessToken = await refreshApproval();
                    }
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
    }, [refresh, session]);

    return axiosPrivate;
};

export default useAxiosPrivate;
