import { createBrowserRouter, Navigate } from "react-router-dom";
// import Dashboard from "../pages/dashboard/Dashboard";
// import LoginPage from "../pages/login/LoginPage";
// import User from "../pages/usermaster/UserPage";
// import ListUserGroup from "../pages/menuaccess/ListUserGroup";
// import MenuAccessPage from "../pages/menuaccess/MenuAccessPage";
// import LoadingNoteForm from "../pages/loadingnote/LoadingNoteForm";
// import FormCreateLoadingNote from "../pages/osreq/FormCreateLoadingNote";
// import TableParentCustDashboard from "../component/table/TableParentCustDashboardLN";
// import RecapLoadingNote from "../pages/recap/RecapLoadingNote";
// import NewUserRegFormPage from "../pages/usermaster/NewUserRegFormPage";
// import NewUserValidateOTP from "../pages/usermaster/NewUserValidateOTP";
// import NewUserPass from "../pages/usermaster/NewUserPass";
// import VehicleDashboard from "../pages/vehicle/VehicleDashboard";
// import DriverDashboard from "../pages/driver/DriverDashboard";
// import SendEmail from "../pages/sendemail/SendEmail";
import { lazy } from "react";

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const LoginPage = lazy(() => import("../pages/login/LoginPage"));
const User = lazy(() => import("../pages/usermaster/UserPage"));
const ListUserGroup = lazy(() => import("../pages/menuaccess/ListUserGroup"));
const MenuAccessPage = lazy(() => import("../pages/menuaccess/MenuAccessPage"));
const LoadingNoteForm = lazy(
    () => import("../pages/loadingnote/LoadingNoteForm")
);
const FormCreateLoadingNote = lazy(
    () => import("../pages/osreq/FormCreateLoadingNote")
);
const TableParentCustDashboard = lazy(
    () => import("../component/table/TableParentCustDashboardLN")
);
const RecapLoadingNote = lazy(() => import("../pages/recap/RecapLoadingNote"));
const NewUserRegFormPage = lazy(
    () => import("../pages/usermaster/NewUserRegFormPage")
);
const NewUserValidateOTP = lazy(
    () => import("../pages/usermaster/NewUserValidateOTP")
);
const NewUserPass = lazy(() => import("../pages/usermaster/NewUserPass"));
const VehicleDashboard = lazy(
    () => import("../pages/vehicle/VehicleDashboard")
);
const DriverDashboard = lazy(() => import("../pages/driver/DriverDashboard"));
const SendEmail = lazy(() => import("../pages/sendemail/SendEmail"));

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
        path: "verif",
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
                path: "editln/",
                element: <FormCreateLoadingNote />,
            },
            {
                path: "account/edit",
                element: <NewUserRegFormPage />,
            },
            {
                path: "lnview",
                element: <RecapLoadingNote />,
            },
            {
                path: "vehicle",
                element: <VehicleDashboard />,
            },
            {
                path: "driver",
                element: <DriverDashboard />,
            },
            {
                path: "sendemail",
                element: <SendEmail />,
            },
        ],
    },
]);
