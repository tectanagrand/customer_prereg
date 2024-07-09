import { LazySelectComp } from "../../component/input/LazySelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash";

export default function AutoSelectDriver({
    name,
    label,
    control,
    rules,
    ...props
}) {
    const axiosPrivate = useAxiosPrivate();
    const limit = 10;
    const max = 0;
    const [dataRow, setDataRow] = useState([]);
    let paginationRef = useRef({
        offset: 99999,
        hasMore: true,
    });

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q) => {
        setLoading(true);
        try {
            const { data: rowData } = await axiosPrivate.get(
                `master/driver?q=${q}`
            );
            return {
                list: rowData.data,
                pagination: {
                    offset: offset + limit,
                    hasMore: offset + limit < max,
                },
            };
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async () => {
        if (!paginationRef.current.hasMore) return;
        setLoading(true);
        try {
            const { list, pagination: resPagination } = await fetchData(
                limit,
                paginationRef.current.offset,
                searchQuery
            );
            const dataList = list?.map(item => ({
                ...item,
                value: item.SNOSIM,
                id: item.SNOSIM,
                label: item.SNOSIM + " - " + item.SNAMA,
            }));

            setDataRow(prev => [
                ...prev,
                ...dataList.filter(
                    x => !prev.map(u => u.value).includes(x.value)
                ),
            ]);

            paginationRef.current = resPagination;
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery !== "") {
            (async () => {
                paginationRef.current.offset = 1;
                try {
                    const { list, pagination: resPagination } = await fetchData(
                        limit,
                        paginationRef.current.offset,
                        searchQuery
                    );
                    const dataList = list?.map(item => ({
                        ...item,
                        value: item.SNOSIM,
                        id: item.SNOSIM,
                        label: item.SNOSIM + " - " + item.SNAMA,
                    }));
                    setDataRow([...dataList]);
                    paginationRef.current = resPagination;
                } catch (error) {
                    console.error(error);
                }
            })();
        } else {
            setDataRow([]);
        }
    }, [searchQuery]);

    return (
        <>
            <LazySelectComp
                loading={isLoading}
                options={dataRow}
                onFetchMore={fetchMore}
                hasMore={paginationRef.current.hasMore}
                name={name}
                label={label}
                control={control}
                rules={rules}
                defaultValue={null}
                onChangeovr={debounce(e => {
                    setQuery(e.target.value);
                }, 1000)}
                onBlurovr={debounce(e => {
                    setQuery(e.target.value);
                }, 1000)}
                {...props}
            />
        </>
    );
}
