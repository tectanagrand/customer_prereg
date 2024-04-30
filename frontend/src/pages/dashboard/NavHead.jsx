import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import { Suspense, lazy } from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
// import * as MuiItemIcon from "@mui/icons-material";

// const MuiItemIcons = Object.keys(require("@mui/icons-material"));

const getIcon = icon => {
    // add as many icons as you need
    switch (icon) {
        case "VpnKey":
            return lazy(() => import("@mui/icons-material/VpnKey"));
        case "Summarize":
            return lazy(() => import("@mui/icons-material/Summarize"));
        case "Source":
            return lazy(() => import("@mui/icons-material/Source"));
        case "Calculate":
            return lazy(() => import("@mui/icons-material/Calculate"));
        case "Functions":
            return lazy(() => import("@mui/icons-material/Functions"));
        case "Cloud":
            return lazy(() => import("@mui/icons-material/Cloud"));
        case "Bluetooth":
            return lazy(() => import("@mui/icons-material/Bluetooth"));
        case "Lock":
            return lazy(() => import("@mui/icons-material/Lock"));
        default:
            return HelpOutlineIcon;
    }
};

export default function NavHead({ keyhead, text, icon, curstate, upNav }) {
    const updateNavcol = item => () => {
        upNav(item);
    };

    const SelectedIcon = getIcon(icon);

    return (
        <ListItem
            disablePadding
            key={`item-${keyhead}`}
            sx={{ display: "block" }}
        >
            <ListItemButton
                key={`button-${keyhead}`}
                onClick={updateNavcol(keyhead)}
                selected={keyhead === curstate.head}
            >
                <ListItemIcon key={`icon-${keyhead}`}>
                    <Suspense fallback={<HelpOutlineIcon />}>
                        <SelectedIcon />
                    </Suspense>
                </ListItemIcon>
                <ListItemText key={`text-${keyhead}`} primary={text} />
            </ListItemButton>
        </ListItem>
    );
}
