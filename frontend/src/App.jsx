import "./App.css";
import { RouterProvider } from "react-router-dom";
import { routes } from "./route/routes";
import ThemeProvider from "./theme";
// import { LocalizationProvider } from "@mui/x-date-pickers";
// import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
// import { Worker } from "@react-pdf-viewer/core";
import { Suspense } from "react";
import LoadingSuspense from "./pages/loadingscreen/Loading";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./ErrorFallback";

function App() {
    return (
        <ErrorBoundary fallback={ErrorFallback}>
            <Suspense fallback={<LoadingSuspense />}>
                <ThemeProvider>
                    {/* <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js"> */}
                    {/* <LocalizationProvider dateAdapter={AdapterMoment}> */}
                    <RouterProvider router={routes} />
                    {/* </LocalizationProvider> */}
                    {/* </Worker> */}
                </ThemeProvider>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
