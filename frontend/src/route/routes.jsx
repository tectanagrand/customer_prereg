import { createBrowserRouter, Navigate } from "react-router-dom";
import Dashboard from "../pages/dashboard/Dashboard";
import Home from "../pages/home/Home";
import LoginPage from "../pages/login/LoginPage";
import RegistrationPage from "../pages/registration/RegistrationPage";
import User from "../pages/usermaster/UserPage";
import FormUserPage from "../pages/usermaster/FormUserPage";
import ListUserGroup from "../pages/menuaccess/ListUserGroup";
import MenuAccessPage from "../pages/menuaccess/MenuAccessPage";
import LoadingNoteForm from "../pages/loadingnote/LoadingNoteForm";
import MasterLoadingNote from "../pages/loadingnote/MasterLoadingNote";
import FormCreateLoadingNote from "../pages/osreq/FormCreateLoadingNote";
import TableParentCustDashboard from "../component/table/TableParentCustDashboardLN";
import RecapLoadingNote from "../pages/recap/RecapLoadingNote";
import NewUserRegFormPage from "../pages/usermaster/NewUserRegFormPage";
import NewUserValidateOTP from "../pages/usermaster/NewUserValidateOTP";
import NewUserPass from "../pages/usermaster/NewUserPass";

export const routes = createBrowserRouter([
    {
        path: "/",
        children: [{ path: "", element: <Navigate to="login" /> }],
    },
    {
        path: "login",
        element: <LoginPage />,
    },
    {
        path: "newverif",
        element: <NewUserValidateOTP />,
    },
    {
        path: "setnewpwd",
        element: <NewUserPass />,
    },
    {
        path: "dashboard",
        element: <Dashboard />,
        children: [
            {
                path: "users",
                element: <User />,
            },
            {
                path: "users/create",
                element: <NewUserRegFormPage />,
            },
            {
                path: "rolegroup",
                element: <ListUserGroup />,
            },
            {
                path: "rolegroup/create",
                element: <MenuAccessPage />,
            },
            {
                path: "loadingnote/",
                element: <TableParentCustDashboard />,
            },
            {
                path: "loadingnote/create",
                element: <LoadingNoteForm />,
            },
            {
                path: "osreq/",
                element: <FormCreateLoadingNote />,
            },
            {
                path: "account/edit",
                element: <FormUserPage />,
            },
            {
                path: "lnview",
                element: <RecapLoadingNote />,
            },
        ],
    },
]);
