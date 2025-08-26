// ----------------------------------------------------------------------

export default function SVGIcon(theme) {
    return {
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    width: "20px",
                    height: "20px",
                },
            },
        },
    };
}
