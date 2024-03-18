import { createContext, useContext, useState, useEffect, useMemo } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import Cookies from "js-cookie";

const MenuContext = createContext();

const MenuProvider = ({ children }) => {
    const [permission, _setMenu] = useState(
        localStorage.getItem("permission")
            ? new Map(
                  Object.entries(JSON.parse(localStorage.getItem("permission")))
              )
            : {}
    );

    const axiosPrivate = useAxiosPrivate();

    const setMenu = permission => {
        _setMenu(new Map(Object.entries(permission)));
    };

    useEffect(() => {
        // const simFetch = setTimeout(() => {
        //     _setMenu(Menu);
        //     localStorage.setItem("menu", JSON.stringify(Menu));
        // }, 2000);
        const simFetch = async () => {
            const getData = await axiosPrivate.post("/page/showall", {
                role_id: Cookies.get("role"),
            });
            _setMenu(new Map(Object.entries(getData.data)));
            localStorage.setItem("permission", JSON.stringify(getData.data));
        };
        if (Cookies.get("role")) {
            simFetch();
        }
        //fetch data menu
    }, []);

    const contextValue = useMemo(() => ({ permission, setMenu }), [permission]);
    return (
        <MenuContext.Provider value={contextValue}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => {
    return useContext(MenuContext);
};

export default MenuProvider;
