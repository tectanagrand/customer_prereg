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
import { ErrorRouter } from "../ErrorRouter";
import AuthSessionModal from "../pages/approvalreq/AuthSessionModal";
import AuthDashboard from "../pages/dashboard/AuthDashboard";
import ApprovalPage from "../pages/approvalreq/ApprovalPage";
import ErrorPage from "../pages/error/ErrorPage";
import { Axios } from "../api/axios";
const OSRequestDrvVeh = lazy(
    () => import("../pages/sendemail/OSRequestDrvVeh")
);
// import DashboardCustomer from "../pages/dashboard/DashboardCustomer";

const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const LoginPage = lazy(() => import("../pages/login/LoginPage"));
const User = lazy(() => import("../pages/usermaster/UserPage"));
const ListUserGroup = lazy(() => import("../pages/menuaccess/ListUserGroup"));
const MenuAccessPage = lazy(() => import("../pages/menuaccess/MenuAccessPage"));
const LoadingNoteForm = lazy(
    () => import("../pages/loadingnote/LoadingNoteForm")
);
const LoadingNoteFormFRC = lazy(
    () => import("../pages/loadingnote/LoadingNoteFormFRC")
);
const FormCreateLoadingNote = lazy(
    () => import("../pages/osreq/FormCreateLoadingNote")
);
const TableParentCustDashboard = lazy(
    () => import("../component/table/TableParentCustDashboardLN")
);
const TableParentCustDashboardFRC = lazy(
    () => import("../component/table/TableParentCustDashboardFRC")
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
const DashboardCustomer = lazy(
    () => import("../pages/dashboard/DashboardCustomer")
);
const LoadingNoteFormLOCOFRC = lazy(
    () => import("../pages/loadingnote/LoadingNoteFormLOCOFRC")
);
const HistoricalLoadingNote = lazy(
    () => import("../pages/loadingnote/HistoricalLoadingNote")
);
const ApprovalRoutes = lazy(
    () => import("../pages/approvalreq/ApprovalRoutes")
);
export const routes = createBrowserRouter([
    {
        path: "/",
        children: [{ path: "", element: <Navigate to="login" /> }],
        errorElement: <ErrorRouter />,
    },
    {
        path: "login",
        element: <AuthDashboard />,
        errorElement: <ErrorRouter />,
        children: [
            {
                path: "",
                element: <LoginPage />,
            },
        ],
    },
    {
        path: "verif",
        element: <NewUserValidateOTP />,
        errorElement: <ErrorRouter />,
    },
    {
        path: "setnewpwd",
        element: <NewUserPass />,
        errorElement: <ErrorRouter />,
    },
    {
        path: "dashboard",
        element: <AuthDashboard />,
        errorElement: <ErrorRouter />,
        children: [
            {
                path: "",
                element: <Dashboard />,
                errorElement: <ErrorRouter />,
                children: [
                    {
                        path: "",
                        element: <DashboardCustomer />,
                    },
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
                        path: "loco/",
                        element: <TableParentCustDashboard />,
                    },
                    {
                        path: "loco/create",
                        element: <LoadingNoteForm />,
                    },
                    {
                        path: "franco/",
                        element: <TableParentCustDashboardFRC />,
                    },
                    {
                        path: "franco/create",
                        element: <LoadingNoteFormFRC />,
                    },
                    {
                        path: "locofranco/",
                        element: <TableParentCustDashboardFRC />,
                    },
                    {
                        path: "locofranco/create",
                        element: <LoadingNoteFormLOCOFRC />,
                    },
                    {
                        path: "osreq",
                        element: <FormCreateLoadingNote />,
                    },
                    {
                        path: "editln",
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
                    {
                        path: "reqdrvveh",
                        element: <OSRequestDrvVeh />,
                    },
                    {
                        path: "historical",
                        element: <HistoricalLoadingNote />,
                    },
                ],
            },
        ],
    },
    {
        path: "/approval",
        element: <ApprovalRoutes />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: "",
                element: <AuthSessionModal />,
                children: [
                    {
                        path: "reqdrvveh",
                        element: <ApprovalPage />,
                        loader: async ({ request }) => {
                            const url = new URL(request.url);
                            try {
                                const { data } = await Axios(
                                    `/file/reqdrvveh?ticket_id=${url.searchParams.get("ticket_id")}`
                                );
                                if (!data.is_active) {
                                    throw new Error(
                                        `Request ${data.request_id} not active`
                                    );
                                }
                                return "";
                            } catch (error) {
                                throw error;
                            }
                        },
                    },
                ],
            },
        ],
    },
]);
