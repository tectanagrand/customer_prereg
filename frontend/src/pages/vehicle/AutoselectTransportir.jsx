import { LazySelectComp } from "../../component/input/LazySelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState, useRef, useEffect, useCallback } from "react";
import { debounce } from "lodash";

export default function AutoSelectTransportir({
    name,
    label,
    control,
    rules,
    plant,
    ...props
}) {
    console.log(plant);
    const axiosPrivate = useAxiosPrivate();
    const limit = 20;
    const [dataRow, setDataRow] = useState([]);
    const plantCode = useRef(plant);
    let paginationRef = useRef({
        offset: 0,
        hasMore: true,
    });

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q, plant) => {
        console.log("fetchData runs");
        console.log(limit, offset, q, plant);
        if (plant !== "") {
            setLoading(true);
            try {
                const { data: rowData } = await axiosPrivate.get(
                    `master/transpwbnet?plant=${plant}&limit=${limit}&offset=${offset}&q=${q}`
                );
                const max = rowData.count;
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
        }
    };
    const fetchMore = debounce(async searchQuery => {
        if (!paginationRef.current.hasMore) return;
        setLoading(true);
        try {
            const { list, pagination: resPagination } = await fetchData(
                limit,
                paginationRef.current.offset,
                searchQuery,
                plantCode.current
            );
            const dataList = list?.map(item => ({
                ...item,
                value: item.transporter_code,
                id: item.transporter_code,
                label: item.transporter_code + " - " + item.transporter_name,
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
    }, 500);
    useEffect(() => {
        (async () => {
            plantCode.current = plant;
            paginationRef.current.offset = 0;
            try {
                const { list, pagination: resPagination } = await fetchData(
                    limit,
                    paginationRef.current.offset,
                    searchQuery,
                    plantCode.current
                );
                const dataList = list?.map(item => ({
                    ...item,
                    value: item.transporter_code,
                    id: item.transporter_code,
                    label:
                        item.transporter_code + " - " + item.transporter_name,
                }));
                setDataRow([...dataList]);
                console.log(resPagination);
                paginationRef.current = resPagination;
            } catch (error) {
                console.error(error);
            }
        })();
    }, [searchQuery, plant]);

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
                searchQuery={searchQuery}
                {...props}
            />
        </>
    );
}
