import { useState } from "react";

export default function LazyBackgroundA({ img, children, style, noblur }) {
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
                backgroundImage: `url(${img})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                backgroundSize: "cover",
                ...style,
            }}
        >
            <img
                src={img}
                alt=""
                loading="lazy"
                onLoad={handleLoad}
                style={{ display: "none" }}
            />
            {loaded && children}
        </div>
    );
}
