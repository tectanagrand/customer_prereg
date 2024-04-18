import axios from "axios";
import { useSession } from "../provider/sessionProvider";
import { useCallback } from "react";
import Cookies from "js-cookie";

const useRefreshToken = () => {
    const { setAccessToken, logOut } = useSession();
    const refresh = useCallback(async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_URL_LOC}/user/refresh`,
                {
                    withCredentials: true,
                }
            );
            setAccessToken(response.data.access_token);
            return response.data.access_token;
        } catch (error) {
            console.log(error);
            Object.keys(Cookies.get()).map(item => {
                Cookies.remove(item);
            });
            localStorage.clear();
            setTimeout(() => {
                window.location.replace(`/login`);
            }, 100);
        }
    }, [setAccessToken]);

    return refresh;
};

export default useRefreshToken;
