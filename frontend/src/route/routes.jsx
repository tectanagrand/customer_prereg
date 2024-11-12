import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
import { ErrorRouter } from "../ErrorRouter";
import AuthSessionModal from "../pages/approvalreq/AuthSessionModal";
import AuthDashboard from "../pages/dashboard/AuthDashboard";
// import ApprovalPage from "../pages/approvalreq/ApprovalPage";
const ApprovalPage = lazy(() => import("../pages/approvalreq/ApprovalPage"));
import ErrorPage from "../pages/error/ErrorPage";
import { Axios } from "../api/axios";
const PrintTolling = lazy(() => import("../pages/recap/PrintTolling"));
const TollingDashboard = lazy(
    () => import("../pages/tolling/TollingDashboard")
);
const TollingApproval = lazy(() => import("../pages/tolling/TollingApproval"));
const TollingRequest = lazy(() => import("../pages/tolling/TollingRequest"));
const FormApprovalLNUPS = lazy(
    () => import("../pages/approvalupsln/FormApprovalLNUPS")
);
const LoadingNoteFormFRCUPS = lazy(
    () => import("../pages/loadingnoteups/LoadingNoteFormFRCUPS")
);
const OSRequestDrvVeh = lazy(
    () => import("../pages/sendemail/OSRequestDrvVeh")
);
const CreatedLoadingNote = lazy(
    () => import("../pages/loadingnote/CreatedLoadingNote")
);
const ApprovalReqDelete = lazy(
    () => import("../pages/loadingnote/ApprovalReqDelete")
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
const ReportLoadingNote = lazy(
    () => import("../pages/recap/ReportLoadingNote")
);
const MasterContractDO = lazy(
    () => import("../pages/do_contract/MasterContractDO")
);
const ApprovalReqDeleteTol = lazy(
    () => import("../pages/tolling/ApprovalReqDeleteTol")
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
        path: "/",
        element: <AuthDashboard />,
        errorElement: <ErrorRouter />,
        children: [
            {
                path: "verif",
                element: <NewUserValidateOTP />,
            },
        ],
    },
    {
        path: "/",
        element: <AuthDashboard />,
        errorElement: <ErrorRouter />,
        children: [
            {
                path: "setnewpwd",
                element: <NewUserPass />,
            },
        ],
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
                        element: <TableParentCustDashboard key="DOWNSTREAM" />,
                        loader: () => {
                            return {
                                C_GRP: "DOWNSTREAM",
                            };
                        },
                    },
                    {
                        path: "locoups/",
                        element: <TableParentCustDashboard key="UPSTREAM" />,
                        loader: () => {
                            return {
                                C_GRP: "UPSTREAM",
                            };
                        },
                    },
                    {
                        path: "loco/create",
                        element: <LoadingNoteForm />,
                    },
                    {
                        path: "franco/",
                        element: (
                            <TableParentCustDashboardFRC key="DOWNSTREAM" />
                        ),
                        loader: () => {
                            return {
                                C_GRP: "DOWNSTREAM",
                            };
                        },
                    },
                    {
                        path: "francoups/",
                        element: <TableParentCustDashboardFRC key="UPSTREAM" />,
                        loader: () => {
                            return {
                                C_GRP: "UPSTREAM",
                            };
                        },
                    },
                    {
                        path: "franco/create",
                        element: <LoadingNoteFormFRC />,
                    },
                    {
                        path: "francoups/create",
                        element: <LoadingNoteFormFRCUPS />,
                    },
                    {
                        path: "locofranco/",
                        element: (
                            <TableParentCustDashboardFRC key="DOWNSTREAM" />
                        ),
                        loader: () => {
                            return {
                                C_GRP: "DOWNSTREAM",
                            };
                        },
                    },
                    {
                        path: "locofranco/create",
                        element: <LoadingNoteFormLOCOFRC />,
                    },
                    {
                        path: "locofrancoups/",
                        element: <TableParentCustDashboardFRC key="UPSTREAM" />,
                        loader: () => {
                            return {
                                C_GRP: "UPSTREAM",
                            };
                        },
                    },
                    {
                        path: "locofrancoups/create",
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
                    {
                        path: "created",
                        element: <CreatedLoadingNote />,
                    },
                    {
                        path: "approvedel",
                        element: <ApprovalReqDelete />,
                    },
                    {
                        path: "report",
                        element: <ReportLoadingNote />,
                    },
                    {
                        path: "contract_do",
                        element: <MasterContractDO />,
                    },
                    {
                        path: "osrequps",
                        element: <FormApprovalLNUPS />,
                    },
                    {
                        path: "tolling/create",
                        element: <TollingRequest />,
                    },
                    {
                        path: "tolling",
                        element: <TollingDashboard />,
                    },
                    {
                        path: "aprtol",
                        element: <TollingApproval />,
                    },
                    {
                        path: "printtol",
                        element: <PrintTolling />,
                    },
                    {
                        path: "apprdeltol",
                        element: <ApprovalReqDeleteTol />,
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
