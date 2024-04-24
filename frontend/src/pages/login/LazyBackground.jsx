import { useState } from "react";

export default function LazyBackground({ img, children, style, noblur }) {
    const [loaded, setLoaded] = useState(false);
    const handleLoad = () => {
        setLoaded(true);
    };

    return (
        <div
            style={{
                filter: noblur ? "none" : loaded ? "none" : "blur(20px)",
                transition: !noblur && "filter 0.5s",
                minWidth: "50vw",
                ...style,
            }}
        >
            <img
                src={img}
                alt=""
                loading="lazy"
                onLoad={handleLoad}
                style={{
                    minHeight: "100vh",
                    objectFit: "cover",
                }}
            />
            {loaded && children}
        </div>
    );
}
