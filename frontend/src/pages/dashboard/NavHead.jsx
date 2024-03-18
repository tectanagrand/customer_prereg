import PropTypes from "prop-types";
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import * as MuiItemIcon from "@mui/icons-material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

export default function NavHead({ keyhead, text, icon, curstate, upNav }) {
    const updateNavcol = item => () => {
        upNav(item);
    };
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
                    {MuiItemIcon[icon].type.render()}
                </ListItemIcon>
                <ListItemText key={`text-${keyhead}`} primary={text} />
            </ListItemButton>
        </ListItem>
    );
}
