import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { LazySelectCompNoCont } from "../../component/input/LazySelectCompNoCont";
import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash";

export default function AutoCompleteCustomer({
    onChangeovr,
    do_num,
    who,
    ...props
}) {
    const axiosPrivate = useAxiosPrivate();
    const limit = 10;
    const [dataRow, setDataRow] = useState([]);
    let paginationRef = useRef({
        offset: 0,
        hasMore: true,
    });

    let overrideChange = debounce(e => {
        setQuery(e.target.value);
    }, 1000);

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q) => {
        setLoading(true);
        try {
            let custData;
            if (who === "wb") {
                custData = await axiosPrivate.get(
                    `master/oscustwb?q=${q}&limit=${limit}&offset=${offset}`
                );
            } else {
                custData = await axiosPrivate.get(
                    `master/oscust?q=${q}&limit=${limit}&offset=${offset}`
                );
            }
            const { data: rowData } = custData;
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
                value: item.name_1 + " - " + item.kunnr,
                id: item.kunnr,
                label: item.name_1 + " - " + item.kunnr,
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
                    value: item.name_1 + " - " + item.kunnr,
                    id: item.kunnr,
                    label: item.name_1 + " - " + item.kunnr,
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
            <LazySelectCompNoCont
                loading={isLoading}
                options={dataRow}
                onFetchMore={fetchMore}
                hasMore={paginationRef.current.hasMore}
                defaultValue={null}
                onChangeovr={e => {
                    onChangeovr(e.target.value);
                    overrideChange(e);
                }}
                onBlurovr={e => {
                    onChangeovr(e.target.value);
                    overrideChange(e);
                }}
                {...props}
            />
        </>
    );
}
