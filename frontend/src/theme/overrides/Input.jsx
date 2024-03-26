import { alpha } from "@mui/material/styles";

// ----------------------------------------------------------------------

export default function Input(theme) {
    return {
        MuiInputBase: {
            styleOverrides: {
                root: {
                    "&.Mui-disabled": {
                        "& svg": { color: theme.palette.text.primary },
                        color: theme.palette.text.primary,
                    },
                },
                input: {
                    "&::placeholder": {
                        opacity: 1,
                        color: theme.palette.text.primary,
                    },
                    "&.MuiOutlinedInput-input": {
                        "&.Mui-disabled": {
                            color: theme.palette.text.primary,
                            "-webkit-text-fill-color":
                                theme.palette.text.primary,
                        },
                    },
                },
            },
        },
        MuiInput: {
            styleOverrides: {
                underline: {
                    "&:before": {
                        borderBottomColor: alpha(theme.palette.grey[500], 0.56),
                    },
                },
            },
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    backgroundColor: alpha(theme.palette.grey[500], 0.12),
                    "&:hover": {
                        backgroundColor: alpha(theme.palette.grey[500], 0.16),
                    },
                    "&.Mui-focused": {
                        backgroundColor: theme.palette.action.focus,
                    },
                    "&.Mui-disabled": {
                        backgroundColor:
                            theme.palette.action.disabledBackground,
                    },
                },
                underline: {
                    "&:before": {
                        borderBottomColor: alpha(theme.palette.grey[500], 0.56),
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.grey[800],
                    },
                    "&.Mui-disabled": {
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: theme.palette.grey[800],
                        },
                    },
                },
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    color: theme.palette.grey[800],
                    "&.Mui-disabled": {
                        color: theme.palette.text.primary,
                    },
                },
                shrink: {
                    fontSize: "12pt",
                },
            },
        },
        input: {
            "&.Mui-disabled": {
                color: theme.palette.text.primary,
            },
        },
    };
}
