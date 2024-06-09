import SessionProvider from "../../provider/sessionProvider";
import MenuProvider from "../../provider/MenuProvider";
import { Outlet } from "react-router-dom";

const AuthDashboard = () => {
    return (
        <SessionProvider>
            <MenuProvider>
                <Outlet />
            </MenuProvider>
        </SessionProvider>
    );
};

export default AuthDashboard;
