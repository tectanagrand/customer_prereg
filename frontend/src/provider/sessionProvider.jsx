import axios from "axios";
import { useContext, createContext, useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";

const SessionContext = createContext();

const SessionProvider = ({ children }) => {
    const [session, setSession_] = useState({
        fullname:
            Cookies.get("fullname") === undefined
                ? ""
                : Cookies.get("fullname"),
        username:
            Cookies.get("username") === undefined
                ? ""
                : Cookies.get("username"),
        email: Cookies.get("email") === undefined ? "" : Cookies.get("email"),
        access_token:
            Cookies.get("access_token") === undefined
                ? ""
                : Cookies.get("access_token"),
        id_user:
            Cookies.get("id_user") === undefined ? "" : Cookies.get("id_user"),
        role: Cookies.get("role") === undefined ? "" : Cookies.get("role"),
        permission:
            localStorage.getItem("permission") === undefined
                ? {}
                : JSON.parse(localStorage.getItem("permission")),
        auth:
            localStorage.getItem("auth") === undefined
                ? ""
                : JSON.parse(localStorage.getItem("auth")),
    });

    const setSession = data => {
        Cookies.set("access_token", data.access_token);
        Cookies.set("fullname", data.fullname);
        Cookies.set("email", data.email);
        Cookies.set("username", data.username);
        Cookies.set("id_user", data.id_user);
        Cookies.set("role", data.role);
        localStorage.setItem("permission", JSON.stringify(data.permission));
        localStorage.setItem("auth", JSON.stringify(data.auth));
        setSession_({
            fullname: data.fullname,
            username: data.username,
            email: data.email,
            access_token: data.access_token,
            id_user: data.id_user,
            role: data.role,
            permission: data.permission,
            auth: data.auth,
        });
    };

    const setAccessToken = act => {
        // setSession_({
        //     fullname: Cookies.get("fullname"),
        //     username: Cookies.get("username"),
        //     email: Cookies.get("email"),
        //     access_token: act,
        //     id_user: Cookies.get("id_user"),
        //     role: Cookies.get("role"),
        //     permission: JSON.parse(localStorage.getItem("permission")),
        //     groupid: Cookies.get("groupid"),
        // });
        setSession_({
            ...session,
            access_token: act,
        });
    };
    const logOut = () => {
        localStorage.clear();
        Cookies.remove("fullname");
        Cookies.remove("email");
        Cookies.remove("username");
        Cookies.remove("id_user");
        Cookies.remove("role");
        Cookies.remove("access_token");
        Cookies.remove("groupid");
        Cookies.remove("auth");
    };

    const getPermission = page => {
        if (
            localStorage.getItem("auth") === null ||
            localStorage.getItem("auth") === undefined
        ) {
            return "";
        }
        const permissions = JSON.parse(localStorage.getItem("auth"));
        const curPermission = permissions[page];
        return curPermission;
    };

    useEffect(() => {
        // console.log(Cookies.get('accessToken'));
        if (session.access_token) {
            axios.defaults.headers.common["Authorization"] =
                "Bearer " + session.access_token;
            Cookies.set("access_token", session.access_token);
            Cookies.set("fullname", session.fullname);
            Cookies.set("email", session.email);
            Cookies.set("username", session.username);
            Cookies.set("id_user", session.id_user);
            Cookies.set("role", session.role);
            localStorage.setItem(
                "permission",
                JSON.stringify(session.permission)
            );
            localStorage.setItem("auth", JSON.stringify(session.auth));
        }
    }, [session]);

    const contextValue = useMemo(
        () => ({ session, setSession, logOut, getPermission, setAccessToken }),
        [session]
    );

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    return useContext(SessionContext);
};

export default SessionProvider;
