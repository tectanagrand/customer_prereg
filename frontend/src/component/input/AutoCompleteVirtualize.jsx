import {
    Typography,
    useMediaQuery,
    Autocomplete,
    TextField,
} from "@mui/material";
import {
    createContext,
    forwardRef,
    useContext,
    useRef,
    useEffect,
} from "react";
import { useTheme } from "@mui/material/styles";
import { VariableSizeList } from "react-window";

const LISTBOX_PADDING = 10;

// Modified Row component with a direct event handler approach
const Row = ({ data, index, style }) => {
    const inlineStyle = {
        ...style,
        top: style.top + LISTBOX_PADDING,
    };

    // The renderOption function now returns an array with [props, option, stateIndex]
    const { props, option } = data[index];

    // Create a custom click handler that will properly trigger the Autocomplete's selection
    const handleClick = event => {
        if (props.onClick) {
            props.onClick(event);
        }
    };

    return (
        <Typography component="li" {...props} style={inlineStyle} noWrap>
            {option.label ?? option}
        </Typography>
    );
};

const OuterElementContext = createContext({});

const OuterElementType = forwardRef((props, ref) => {
    const outerProps = useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current != null) {
            ref.current.resetAfterIndex(0, true);
        }
    }, [data]);
    return ref;
}

const ListBoxComponent = forwardRef((props, ref) => {
    const { children, ...other } = props;
    const itemData = [];

    // Extract the data properly from children
    children.forEach(child => {
        if (child) {
            // Reformat the data for easier handling in the Row component
            itemData.push({
                props: child[0], // The props object
                option: child[1], // The option object
                index: child[2], // The state index
            });
        }
    });

    const itemCount = itemData.length;
    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up("sm"), { noSsr: true });
    const itemSize = smUp ? 36 : 48;

    const getHeight = () => {
        return Math.min(8, itemCount) * itemSize;
    };

    const gridRef = useResetCache(itemCount);

    return (
        <div ref={ref}>
            <OuterElementContext.Provider value={other}>
                <VariableSizeList
                    itemData={itemData}
                    height={getHeight() + 2 * LISTBOX_PADDING}
                    width="100%"
                    ref={gridRef}
                    outerElementType={OuterElementType}
                    innerElementType="ul"
                    itemSize={() => itemSize}
                    overscanCount={5}
                    itemCount={itemCount}
                >
                    {Row}
                </VariableSizeList>
            </OuterElementContext.Provider>
        </div>
    );
});

/**
 *
 * @param {import("@mui/material").AutocompleteProps} rest
 *
 */
const AutoCompleteVirtualize = ({ sx, ...rest }) => {
    return (
        <Autocomplete
            fullWidth
            sx={sx}
            {...rest}
            disableListWrap
            ListboxComponent={ListBoxComponent}
            renderOption={(props, option, state) => [
                props,
                option,
                state.index,
            ]}
            renderInput={params => <TextField {...params} label={rest.label} />}
        />
    );
};

export default AutoCompleteVirtualize;
