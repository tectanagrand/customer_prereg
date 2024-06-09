import SessionProvider from "../../provider/sessionProvider";
import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import LoadingSuspense from "../loadingscreen/Loading";
import { Toaster } from "react-hot-toast";

const ApprovalRoutes = () => {
    return (
        <SessionProvider>
            <Toaster />
            <Suspense fallback={<LoadingSuspense />}>
                <Outlet />
            </Suspense>
        </SessionProvider>
    );
};

export default ApprovalRoutes;
