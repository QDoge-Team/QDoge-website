'use client'
import React, { useEffect, useRef, useState } from "react";
import useIsMobile from "../hooks/useIsMobile"

const AUDIO_ENABLED = false;

interface SliderProps {
    multiplier: number;
    elapsedTime: number;
    numbers: number[];
}



const Effect: React.FC<any> = ({ color }) => {
    const canvasRef = useRef<any>(null);
    const audioPlayedRef = useRef<boolean>(false);
    
    useEffect(() => {
        if (!AUDIO_ENABLED) return;
        if (color && color.audio && !audioPlayedRef.current) {
            const audio = color.audio;
            if (audio.currentTime > 0) {
                audio.currentTime = 0;
            }
            audio.muted = true;
            audio.play().then(() => {
                setTimeout(() => {
                    audio.muted = false;
                }, 1000);
                audioPlayedRef.current = true;
            }).catch(() => {});
        }
        return () => {
            audioPlayedRef.current = false;
        };
    }, [color]);
    
    useEffect(() => {
        if (color && canvasRef.current && color.hex) {
            const canvas = document.createElement("canvas");
            canvas.width = canvasRef.current.offsetWidth;
            canvas.height = canvasRef.current.offsetHeight;

            const heximg: any = color.hex;
            if (!heximg || !heximg.width || !color.w || !color.h) {
                return;
            }
            
            const w = heximg.width / color.w;
            const h = heximg.height / color.h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                return;
            }
            
            const width = canvas.width * 1.05;

            let wc = 0;
            let hc = 0;
            let s = false;
            const draw = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.drawImage(heximg, w * wc, h * hc, w, h, -width / 2, -width / 2, width, width);
                if (!s) wc++;
                if (wc === color.w - 1) {
                    if (hc < color.h - 1) {
                        wc = 0;
                        hc++;
                    } else {
                        s = true;
                    }
                }
                ctx.restore();
            };
            const interval = setInterval(draw, 60);
            canvasRef.current.appendChild(canvas);

            return () => {
                clearInterval(interval);
                if (canvasRef.current && canvasRef.current.contains(canvas)) {
                    canvasRef.current.removeChild(canvas);
                }
            };
        }
    }, [color]);


    return <div className="absolute w-full h-full left-0 top-0 z-20" ref={canvasRef} />;
};

/* ─── Currency icon (Qubic logo inline) ─── */
const QubicIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block">
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#00f3ff" fillOpacity="0.15" stroke="#00f3ff" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="12" y="17" textAnchor="middle" fill="#00f3ff" fontSize="13" fontWeight="bold" fontFamily="monospace">≡</text>
    </svg>
);

const Slider: React.FC<SliderProps> = ({ multiplier, elapsedTime, numbers = [] }) => {
    const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);
    const isMobile = useIsMobile();
    const isIdle = !numbers.length || !multiplier;

    const [animationEnded, setAnimationEnded] = useState<boolean>(false);

    // radius for 3D placement
    const radius = 300;

    // Generate idle placeholder cards when no game data is available
    useEffect(() => {
        if (!numbers.length || !multiplier) {
            const placeholders = Array.from({ length: 30 }, () => {
                const vals = [1.0, 1.2, 1.5, 2.0, 3.0, 5.0, 8.0, 10.0, 15.0, 20.0];
                return vals[Math.floor(Math.random() * vals.length)];
            });
            setDisplayNumbers(placeholders);
            setAnimationEnded(false);
            return;
        }
    }, [numbers.length, multiplier]);

    useEffect(() => {
        if (!numbers.length || !multiplier) {
            return;
        }
        const fixedIndex = 70;
        let updatedNumbers = [...numbers];

        if (!updatedNumbers.includes(multiplier)) {
            if (fixedIndex < updatedNumbers.length) {
                updatedNumbers.splice(fixedIndex, 0, multiplier);
            } else {
                updatedNumbers.push(multiplier);
            }
        }
        setDisplayNumbers(updatedNumbers);
        setAnimationEnded(false);
    }, [multiplier, numbers]);

    // animate arrival of winner card (no rotation required)
    const animationRef = useRef<number | null>(null);
    useEffect(() => {
        if (!isIdle) {
            const targetIndex = displayNumbers.indexOf(multiplier);
            if (targetIndex !== -1) {
                const duration = elapsedTime * 1000;
                const startTime = performance.now();
                const animate = (t: number) => {
                    const progress = Math.min((t - startTime) / duration, 1);
                    if (progress < 1) {
                        animationRef.current = requestAnimationFrame(animate);
                    } else {
                        setAnimationEnded(true);
                    }
                };
                animationRef.current = requestAnimationFrame(animate);
                return () => {
                    if (animationRef.current !== null) {
                        cancelAnimationFrame(animationRef.current);
                    }
                };
            }
        }
    }, [isIdle, displayNumbers, multiplier, elapsedTime]);

    // compute layout positions and scales for cards
    const cardWidth = 130;
    const gap = 16; // desired gap between card edges
    const scaleStep = 0.13;
    const minScale = 0.5;
    const count = displayNumbers.length;
    const positions: number[] = new Array(count).fill(0);
    const scales: number[] = new Array(count).fill(1);
    const centerIndex = Math.floor(count / 2);

    // center card stays at 0
    if (count > 0) {
        positions[centerIndex] = 0;
        scales[centerIndex] = 1;
    }
    // compute right side
    let currentX = 0;
    for (let i = centerIndex + 1; i < count; i++) {
        const prevIdx = i - 1;
        const prevScale = Math.max(minScale, 1 - Math.abs(prevIdx - centerIndex) * scaleStep);
        const curScale = Math.max(minScale, 1 - Math.abs(i - centerIndex) * scaleStep);
        const prevWidth = cardWidth * prevScale;
        const curWidth = cardWidth * curScale;
        currentX += prevWidth / 2 + curWidth / 2 + gap;
        positions[i] = currentX;
        scales[i] = curScale;
    }
    // compute left side
    currentX = 0;
    for (let i = centerIndex - 1; i >= 0; i--) {
        const prevIdx = i + 1;
        const prevScale = Math.max(minScale, 1 - Math.abs(prevIdx - centerIndex) * scaleStep);
        const curScale = Math.max(minScale, 1 - Math.abs(i - centerIndex) * scaleStep);
        const prevWidth = cardWidth * prevScale;
        const curWidth = cardWidth * curScale;
        currentX -= prevWidth / 2 + curWidth / 2 + gap;
        positions[i] = currentX;
        scales[i] = curScale;
    }
    // recenter whole strip using the physical edges of the first/last card
    if (count > 1) {
        const leftEdge = positions[0] - (cardWidth * scales[0]) / 2;
        const rightEdge = positions[count - 1] + (cardWidth * scales[count - 1]) / 2;
        const shift = (leftEdge + rightEdge) / 2;
        for (let i = 0; i < count; i++) {
            positions[i] -= shift;
        }
        // make sure the center card is exactly at x=0 after shifting
        const centerOffset = positions[centerIndex];
        for (let i = 0; i < count; i++) {
            positions[i] -= centerOffset;
        }
    }

    return (
        <div className="slide-strip-wrapper">
            {/* Edge fade overlays */}
            <div className="slide-edge-fade left" />
            <div className="slide-edge-fade right" />

            {/* Gold diamond indicator at top center */}
            <div className="slide-gold-indicator">
                <img src="/assets/image/jewellery.png" alt="" className="slide-gold-diamond" draggable={false} />
            </div>

            {/* Card arc container */}
            <div
                className="slide-card-strip"
                style={{
                    willChange: 'transform',
                    transform: `translate(-50%, -50%)`
                }}
            >
                {displayNumbers.map((number, index) => {
                        const tile = findTile(number);
                        const isWinner = animationEnded && number === multiplier;

                        const centerIndex = Math.floor(displayNumbers.length / 2);
                        // derived values from precomputed arrays
                        const x = positions[index] ?? 0;
                        const scale = scales[index] ?? 1;
                        // keep all cards aligned on same Y axis
                        const y = 0;
                        // tilt away from center: right cards tilt right, left cards tilt left
                        // tilt away from center, capped at 8 degrees
                        const rawTilt = x * 0.05;
                        const tilt = Math.sign(rawTilt) * Math.min(Math.abs(rawTilt), 8); // degrees
                        const transformStyle = `translateX(${x}px) translateY(${y}px) scale(${scale}) rotateY(${tilt}deg)`;
                        const zIndex = Math.floor(1000 - Math.abs(index - centerIndex));

                        return (
                        <div
                            key={index}
                            className={`slide-card ${isWinner ? 'active' : ''}`}
                            style={{
                                ['--tier-color' as any]: tile?.color,
                                transform: transformStyle,
                                zIndex,
                                opacity: 0.7 + 0.3 * scale,
                            } as React.CSSProperties}
                        >
                            <div className="slide-card-bg" />
                            <div className="slide-card-edge-glow" />
                            <div className="slide-card-content">
                                <div className={`slide-card-icon ${isWinner ? 'winner' : ''}`}>
                                    <div className="relative flex justify-center items-center w-full h-full">
                                        {(isWinner) && <Effect color={tile} />}
                                        <img src="/assets/image/qdoge_light.png" alt="" className="small-logo" draggable={false} />
                                    </div>
                                </div>
                                <span className="slide-card-label">
                                    {`${Number(number || 1).toFixed(2)}x`}
                                </span>
                                <span className="slide-card-amount">
                                    <QubicIcon />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Slider;



// Audio cache to prevent creating multiple instances
const audioCache: Record<string, HTMLAudioElement> = {};
const imageCache: Record<string, HTMLImageElement> = {};

const getImage = (hex: string): HTMLImageElement | null => {
    if (typeof window === "undefined") return null; // SSR-safe
    
    if (imageCache[hex]) {
        return imageCache[hex];
    }
    
    const srcMap: Record<string, string> = {
        "hex-dark": "/assets/image/hex-dark.webp",
        "hex-white": "/assets/image/hex-white.webp",
        "hex-blue": "/assets/image/hex-blue.webp",
        "hex-orange": "/assets/image/hex-orange.webp",
        "hex-green": "/assets/image/hex-green.webp",
        "hex-diamond": "/assets/image/hex-diamond.webp",
    };

    const src = srcMap[hex];
    if (!src) return null;

    const img = new Image();
    img.src = src;
    imageCache[hex] = img;
    return img;
};

const getAudio = (hex: string): HTMLAudioElement | null => {
    if (!AUDIO_ENABLED) return null;
    if (typeof window === "undefined") return null; // Safe for SSR
    
    // Return cached audio if it exists
    if (audioCache[hex]) {
        return audioCache[hex];
    }

    const audioMap: Record<string, string> = {
        "hex-dark": "/assets/audio/0x.BzN2b_8B.mp3",
        "hex-white": "/assets/audio/2x.BtB9MhZT.mp3",
        "hex-blue": "/assets/audio/5x.ByO3bsqL.mp3",
        "hex-orange": "/assets/audio/10x.D5SU6N7w.mp3",
        "hex-green": "/assets/audio/100x.Dqw08101.mp3",
        "hex-diamond": "/assets/audio/1000x.Pp2_A4z-.mp3",
    };

    const src = audioMap[hex];
    if (!src) return null;

    const audio = new Audio(src);
    audioCache[hex] = audio;
    return audio;
};

// Pre-computed tiles array (sorted by point) - created once to avoid repeated sorting
const TILES = [
    {
        color: "#2d4454",
        text: "white",
        point: 0,
        hexKey: "hex-dark",
        w: 11,
        h: 3
    },
    {
        color: "#dcdfe4",
        text: "black",
        point: 2,
        hexKey: "hex-white",
        w: 10,
        h: 4
    },
    {
        color: "#017bff",
        text: "white",
        point: 5,
        hexKey: "hex-blue",
        w: 10,
        h: 4
    },
    {
        color: "#ff9d00",
        text: "black",
        point: 10,
        hexKey: "hex-orange",
        w: 10,
        h: 4
    },
    {
        color: "#00f3ff",
        text: "white",
        point: 100,
        hexKey: "hex-green",
        w: 10,
        h: 4
    },
    {
        color: "#50e3c2",
        text: "white",
        point: 1000,
        hexKey: "hex-diamond",
        w: 7,
        h: 7
    },
] as const;

// Optimized findTile - no sorting, uses pre-computed array
export const findTile = (number: number): any => {
    // Tiles are already ordered by point (ascending)
    // Find the tile with the highest point <= number
    for (let i = TILES.length - 1; i >= 0; i--) {
        if (number >= TILES[i].point) {
            // Return tile with images/audio attached (cached)
            return {
                ...TILES[i],
                hex: getImage(TILES[i].hexKey),
                audio: getAudio(TILES[i].hexKey)
            };
        }
    }
    
    // Fallback to first tile
    return {
        ...TILES[0],
        hex: getImage(TILES[0].hexKey),
        audio: getAudio(TILES[0].hexKey)
    };
};
