import TableRecapReport from "../../component/table/TableRecapReport";

export default function RecapLoadingNote() {
    return (
        <div
            style={{
                display: "flex",
                minWidth: "100%",
                minHeight: "100%",
                width: 0,
                height: 0,
            }}
        >
            <TableRecapReport />;
        </div>
    );
}
