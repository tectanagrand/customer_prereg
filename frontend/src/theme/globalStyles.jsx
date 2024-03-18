// @mui
import { GlobalStyles as MUIGlobalStyles } from "@mui/material";

// ----------------------------------------------------------------------

export default function GlobalStyles() {
    const inputGlobalStyles = (
        <MUIGlobalStyles
            styles={{
                "*": {
                    boxSizing: "border-box",
                },
                html: {
                    margin: 0,
                    padding: 0,
                    width: "100vw",
                    height: "100%",
                    WebkitOverflowScrolling: "touch",
                },
                body: {
                    margin: 0,
                    padding: 0,
                    width: "100%",
                    height: "100%",
                },
                "div#root": {
                    width: "100%",
                    height: "100%",
                },
                input: {
                    "&[type=number]": {
                        MozAppearance: "textfield",
                        "&::-webkit-outer-spin-button": {
                            margin: 0,
                            WebkitAppearance: "none",
                        },
                        "&::-webkit-inner-spin-button": {
                            margin: 0,
                            WebkitAppearance: "none",
                        },
                    },
                },
                "div.app": {
                    height: "100%",
                },
                img: {
                    display: "block",
                    maxWidth: "100%",
                },
                ul: {
                    margin: 0,
                    padding: 0,
                },
                "& .MuiDataGrid-main": {
                    width: 0,
                    minWidth: "95%",
                },
            }}
        />
    );

    return inputGlobalStyles;
}
