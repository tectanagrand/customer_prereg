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
        path: "register",
        element: <RegistrationPage />,
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
                element: <FormUserPage />,
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
        ],
    },
]);
