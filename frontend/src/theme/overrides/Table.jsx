// ----------------------------------------------------------------------

export default function Table(theme) {
    return {
        MuiTableCell: {
            styleOverrides: {
                head: {
                    color: theme.palette.common.white,
                    backgroundColor: theme.palette.primary.main,
                },
                // root: {
                //     "& :hover": {
                //         backgroundColor: theme.palette.primary.light,
                //     },
                // },
            },
        },
        "& .MuiTableHead-root": {
            styleOverrides: {
                backgroundColor: theme.palette.primary.main,
            },
        },
    };
}
