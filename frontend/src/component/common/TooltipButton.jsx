import { Tooltip, IconButton } from "@mui/material";

import React from "react";

export default function TooltipButton({ TooltipText, Icon, OnClick, ...rest }) {
    return (
        <Tooltip title={TooltipText}>
            <span>
                <IconButton onClick={OnClick} {...rest}>
                    {Icon}
                </IconButton>
            </span>
        </Tooltip>
    );
}
