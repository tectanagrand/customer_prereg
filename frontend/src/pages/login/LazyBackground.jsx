import { useState } from "react";

export default function LazyBackground({ img, children, style, noblur }) {
    const [loaded, setLoaded] = useState(false);
    const handleLoad = () => {
        setLoaded(true);
    };

    return (
        <div
            style={{
                backgroundImage: `url(${img})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                backgroundSize: "cover",
                filter: noblur ? "none" : loaded ? "none" : "blur(20px)",
                transition: !noblur && "filter 0.5s",
                ...style,
            }}
        >
            <img
                src={img}
                alt=""
                onLoad={handleLoad}
                style={{ display: "none" }}
            />
            {loaded && children}
        </div>
    );
}
