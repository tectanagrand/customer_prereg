import { LazySelectComp } from "../../component/input/LazySelectComp";
import { Axios } from "../../api/axios";
import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash";

export default function AutoSelectUserSAP({
    name,
    label,
    control,
    rules,
    ...props
}) {
    const limit = 10;
    const [dataRow, setDataRow] = useState([]);
    let paginationRef = useRef({
        offset: 0,
        hasMore: true,
    });

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q) => {
        setLoading(true);
        try {
            const { data: rowData } = await Axios.get(
                `master/cust?limit=${limit}&offset=${offset}&q=${q}`
            );

            return {
                list: rowData.data,
                pagination: {
                    offset: offset + limit,
                    hasMore: offset + limit < rowData.count,
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
                value: item.kunnr,
                id: item.kunnr,
                label: item.name,
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
        (async () => {
            paginationRef.current.offset = 0;
            try {
                const { list, pagination: resPagination } = await fetchData(
                    limit,
                    paginationRef.current.offset,
                    searchQuery
                );
                const dataList = list?.map(item => ({
                    ...item,
                    value: item.kunnr,
                    id: item.kunnr,
                    label: item.name,
                }));
                setDataRow([...dataList]);
                paginationRef.current = resPagination;
            } catch (error) {
                console.error(error);
            }
        })();
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
