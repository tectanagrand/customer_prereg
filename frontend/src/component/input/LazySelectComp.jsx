import LoadingButton from "@mui/lab/LoadingButton";
import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import React, { forwardRef, useCallback, useRef } from "react";
import { Controller } from "react-hook-form";

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

export const LazySelectComp = ({
    options,
    loading,
    onFetchMore,
    hasMore,
    label,
    control,
    name,
    rules,
    onChangeovr,
    onBlurovr,
    defaultValue,
    ...props
}) => {
    const observer = useRef();

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
        <Controller
            name={name}
            control={control}
            rules={rules}
            onChange={([, data]) => data}
            defaultValue={defaultValue}
            render={({
                field: { onChange, value, ref },
                fieldState: { error },
            }) => (
                <Autocomplete
                    options={options}
                    loading={loading}
                    onChange={(e, newValue) => onChange(newValue)}
                    value={value}
                    error={error}
                    fullWidth
                    getOptionLabel={option => {
                        if (option !== null) return option.label;
                        return "";
                    }}
                    isOptionEqualToValue={(option, value) => {
                        if (value !== null || option !== null) {
                            if (value.value === "") {
                                return true;
                            }
                            return option.value === value.value;
                        } else if (value.value === "") {
                            return true;
                        }
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
                            label={label}
                            error={error}
                            inputRef={ref}
                            onChange={onChangeovr}
                            onBlur={onBlurovr}
                        />
                    )}
                    {...props}
                />
            )}
        />
    );
};
