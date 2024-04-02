import "./App.css";
import MenuProvider from "./provider/MenuProvider";
import { RouterProvider } from "react-router-dom";
import { routes } from "./route/routes";
import ThemeProvider from "./theme";
import SessionProvider from "./provider/sessionProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

function App() {
    return (
        <ThemeProvider>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <LocalizationProvider dateAdapter={AdapterMoment}>
                    <SessionProvider>
                        <MenuProvider>
                            <RouterProvider router={routes} />
                        </MenuProvider>
                    </SessionProvider>
                </LocalizationProvider>
            </Worker>
        </ThemeProvider>
    );
}

export default App;
