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

    const [menuName, setMenuName] = useState(
        localStorage.getItem("menuname")
            ? new Map(
                  Object.entries(JSON.parse(localStorage.getItem("menuname")))
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
            try {
                const isRoleUp = await axiosPrivate.post("/user/isroleup");
                if (isRoleUp.status === 200) {
                    const getData = await axiosPrivate.post("/page/showall", {
                        role_id: Cookies.get("role_id"),
                    });
                    _setMenu(new Map(Object.entries(getData.data.jsonMenu)));
                    localStorage.setItem(
                        "permission",
                        JSON.stringify(getData.data.jsonMenu)
                    );
                    setMenuName(new Map(Object.entries(getData.data.nameMenu)));
                    localStorage.setItem(
                        "menuname",
                        JSON.stringify(getData.data.nameMenu)
                    );
                }
            } catch (error) {
                if (error.response.status === 303) {
                    console.log("role updated");
                } else {
                    console.error(error);
                }
            }
        };
        if (Cookies.get("role")) {
            simFetch();
        }
        // fetch data menu
    }, []);

    const contextValue = useMemo(
        () => ({ permission, setMenu, menuName }),
        [permission]
    );
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
