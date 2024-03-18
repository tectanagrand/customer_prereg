import "./App.css";
import MenuProvider from "./provider/MenuProvider";
import { RouterProvider } from "react-router-dom";
import { routes } from "./route/routes";
import ThemeProvider from "./theme";
import SessionProvider from "./provider/sessionProvider";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

function App() {
    return (
        <ThemeProvider>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <SessionProvider>
                    <MenuProvider>
                        <RouterProvider router={routes} />
                    </MenuProvider>
                </SessionProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
}

export default App;
