import LoadingButton from "@mui/lab/LoadingButton";
import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import React, {
    forwardRef,
    useCallback,
    useRef,
    useState,
    useMemo,
    useEffect,
} from "react";

const OptionComponent = forwardRef(
    (
        { option, index, showLoadingBelow, isLastItem, hasMore, ...props },
        ref
    ) => {
        return (
            <Box ref={ref} {...props}>
                {option !== null && option.label}
                {isLastItem && showLoadingBelow && hasMore && (
                    <>
                        Load more <LoadingButton loading={true} />
                    </>
                )}
            </Box>
        );
    }
);

export const LazySelectCompNoCont = ({
    options,
    loading,
    onFetchMore,
    hasMore,
    onChangeovr,
    onBlurovr,
    defaultValue,
    ...props
}) => {
    const observer = useRef();
    const [value, setValue] = useState(null);

    // useEffect(() => {
    //     console.log("value changed :" + value);
    // }, [value]);

    // const valueMemo = useMemo(() => value, [value]);

    const lastOptionElementRef = useCallback(async node => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(async entries => {
            if (entries[0].isIntersecting && hasMore) {
                await onFetchMore();
            }
        });
        if (node) observer.current.observe(node);
    }, []);

    return (
        <>
            <Autocomplete
                options={options}
                loading={loading}
                fullWidth
                value={value}
                onChange={(e, newValue) => {
                    onChangeovr(e);
                    setValue(newValue);
                }}
                getOptionLabel={option => {
                    if (option !== null) return option.value;
                    return "";
                }}
                isOptionEqualToValue={(option, value) => {
                    return true;
                }}
                renderOption={(props, option, { index }) => {
                    return (
                        <OptionComponent
                            {...props}
                            isLastItem={index === options.length - 1}
                            showLoadingBelow={loading}
                            option={option}
                            hasMore={hasMore}
                            ref={
                                index === options.length - 1
                                    ? lastOptionElementRef
                                    : null
                            }
                        />
                    );
                }}
                renderInput={params => (
                    <TextField
                        {...params}
                        label={props.label}
                        onChange={onChangeovr}
                        onBlur={onBlurovr}
                    />
                )}
                {...props}
            />
        </>
    );
};
