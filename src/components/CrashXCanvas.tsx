'use client'
import { AnyNaptrRecord } from "dns";
import { useEffect, useRef, useState } from "react";




const GAME_STATES = {
    NotStarted: 1,
    Starting: 2,
    InProgress: 3,
    Over: 4,
    Blocking: 5,
    Refunded: 6,
};

// ✅ Helper to check if image is loaded and valid
const isImageReady = (img?: HTMLImageElement | null): boolean =>
    !!img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;

class BoomSpriteFrame {
    image: HTMLImageElement;
    count = 14;
    frame = 0;
    x: number;
    y: number;
    loop = true;
    width = 0;
    height = 0;
    time = 1000;
    elapsed = Date.now();
    active = true;
    w = 50;

    constructor({ explosionImage, x, y, scale }: any) {
        this.image = explosionImage;
        this.x = x;
        this.y = y;
        this.w = 50 * (scale ?? 1);

        // ✅ Only compute width/height if loaded
        if (isImageReady(explosionImage)) {
            this.width = explosionImage.naturalWidth;
            this.height = explosionImage.naturalHeight / this.count;
        }
    }

    show(ctx: CanvasRenderingContext2D) {
        // ✅ If broken or not ready, do nothing (or mark inactive)
        if (!isImageReady(this.image)) {
            this.active = false; // optional: auto-remove
            return;
        }

        // ✅ If width/height were 0 at constructor time, compute now
        if (!this.width || !this.height) {
            this.width = this.image.naturalWidth;
            this.height = this.image.naturalHeight / this.count;
        }

        if (!this.active && !this.loop) return; // Exit early if animation is inactive and not looping

        const dt = Date.now() - this.elapsed; // Time elapsed since animation started
        if (dt > this.time) this.active = false; // Deactivate if the total time is exceeded

        if (this.active || this.loop) {
            this.frame = Math.floor((dt / this.time) * this.count); // Calculate the current frame
            if (this.frame >= this.count) {
                if (this.loop) {
                    this.frame = 0; // Reset frame for looping
                    this.elapsed = Date.now(); // Reset elapsed time for looping
                } else {
                    this.frame = this.count - 1; // Cap frame to the last one if not looping
                    this.active = false; // Stop the animation if not looping
                }
            }

            // Calculate the source y coordinate in the sprite sheet
            const sy = this.height * this.frame;
            // Draw the current frame on the canvas
            ctx.drawImage(
                this.image,  // Source image
                0,           // Source x position (start from left)
                sy,          // Source y position (current frame)
                this.width,  // Source width (width of one frame)
                this.height, // Source height (height of one frame)
                this.x - this.w / 2, // Destination x position on canvas (centered)
                this.y - this.w / 2, // Destination y position on canvas (centered)
                this.w,      // Destination width on canvas
                this.w       // Destination height on canvas
            );
        }
    }
}


class CrashGameEngine {
    STARS: any = [];
    RX_N = 1;
    RY_N = 1;
    GAME_INFO: any = {
        prePayout: 0,
        preTimoeOut: 0,
        x: 100,
        y: 0,
        camerax: 0,
        cameray: 0,
        angle: -Math.PI / 6,
        PARTICLES: [],
        PARTICLEPOINTS: [],
    };
    elapsed = 0; // Previous time used for animation timing
    PRE_PAYOUT = 0;
    PAY_OUT = 1; // Current payout multiplier
    PAYOUT_PARTICLE = 100;
    gameStatus = null; // Current game state

    timer: any = null;
    canvas: any;
    ctx: any;

    gameWidth = 100; // Game canvas width
    gameHeight = 100; // Game canvas height

    rule_x = 55; // X-axis ruler pos
    rule_y = 20;

    scale = 1; // Scale for the rocket and parabolic curve
    minScale = 0.6; // Minimum scale factor
    maxScale = 1.2; // Maximum scale factor for the growth
    scaleDistanceThreshold = 2000; // Distance at which scaling is fixed
    duration = 1000; // Duration of the animation in milliseconds

    animated = false;

    crashImage: HTMLImageElement | null = null;
    starImg: HTMLImageElement | null = null;
    explosionImage: HTMLImageElement | null = null;
    // Initialize game loop with 60 FPS
    constructor() {
        if (typeof window !== "undefined") {
            this.initImages(); // only run on client
            this.timer = setInterval(() => {
                this.loop();
                this.draw();
            }, 16);
        }
    }

    initImages() {
        const bind = (img: HTMLImageElement, src: string, name: string) => {
            img.onload = () => {
                // Image loaded successfully
            };
            img.onerror = () => {
                console.error(`[CrashXCanvas] Failed to load ${name}: ${src}`);
            };
            img.src = src;
        };

        this.crashImage = new Image();
        bind(this.crashImage, "/assets/image/crash.png", "crash.png");

        this.starImg = new Image();
        bind(this.starImg, "/assets/image/star.png", "star.png");

        this.explosionImage = new Image();
        bind(this.explosionImage, "/assets/image/explosion.png", "explosion.png");
    }

    //first set canvas for drawing
    start(canvas: any) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.gameWidth = this.canvas.clientWidth;
        this.gameHeight = this.canvas.clientHeight - 50;
    }

    update(props: any) {
        //update game state , payout and set starttime and
        this.gameStatus = props;
    }

    loop() {
        if (this.canvas && this.gameStatus) {
            const width = this.gameWidth;
            const height = this.gameHeight;
            const heightSpeed = height / 25;
            const widthSpeed = width / 100;
            let currentTime = new Date().getTime();
            const { status, payout, startTime } = this.gameStatus;

            if (status === GAME_STATES.InProgress) {
                this.PAY_OUT = payout;
                this.PRE_PAYOUT = (this.PAY_OUT - 1) * 10;
                this.elapsed = (currentTime - new Date(startTime).getTime()) / 100;

                // Calculate scaling factor based on rocket distance
                const distance = Math.hypot(
                    this.GAME_INFO.x - 100,
                    this.GAME_INFO.y - height
                );

                this.scale = Math.max(
                    this.minScale,
                    1 - distance / this.scaleDistanceThreshold
                );

            }
            let speedx = 0;
            let speedy = 0;
            // check status and cacluate rokect pos by the payout and started time
            if (status === GAME_STATES.InProgress) {
                // Simulate a parabolic curve

                // calculate angle for rocket
                this.GAME_INFO.angle =
                    -Math.atan2(this.PRE_PAYOUT, this.elapsed) / 10 - Math.PI / 6;
                // speed x calculate by pretime and pre x position
                speedx = (widthSpeed * this.elapsed - this.GAME_INFO.x) / 50;
                // speed y calculate by payout and pre y postion
                speedy =
                    (height - heightSpeed * this.PRE_PAYOUT - this.GAME_INFO.y) / 50;
                if (speedx > 0) {
                    this.GAME_INFO.x += speedx;
                }

                this.GAME_INFO.y += speedy;
                // move the rocket position and camera postion
                if (this.GAME_INFO.x > width * 0.85) {
                    this.GAME_INFO.camerax = -this.GAME_INFO.x + width * 0.85;
                }
                if (this.GAME_INFO.y < height * 0.35) {
                    this.GAME_INFO.cameray = -this.GAME_INFO.y + height * 0.35;
                }
            } else {
                /**
                 * Resets the game state for a new round.
                 */
                if (status !== GAME_STATES.Over) {
                    this.GAME_INFO.camerax = 0;
                    this.GAME_INFO.cameray = 0;
                    this.GAME_INFO.x = this.rule_x;
                    this.GAME_INFO.y = height;
                    this.GAME_INFO.angle = -Math.PI / 6;
                    this.GAME_INFO.PARTICLES = [];
                    this.RX_N = 1;
                    this.RY_N = 1;
                    this.elapsed = 0;
                    this.PAY_OUT = 1;
                    this.scale = 1;
                    this.animated = false;

                } else {
                    this.PAY_OUT = payout;
                    // generate emploier particle
                    if (this.GAME_INFO.PARTICLES.length === 0 && !this.animated) {
                        this.animated = true;
                        const x = this.GAME_INFO.x
                        const y = this.GAME_INFO.y
                        const scale = this.scale
                        this.GAME_INFO.PARTICLES.push(new BoomSpriteFrame({ explosionImage: this.explosionImage, x, y, scale }))
                    }
                }
            }
            // generate stars
            if (this.STARS.length < 100) {
                this.STARS.push({
                    x: this.GAME_INFO.x - width + Math.random() * width * 2,
                    y: this.GAME_INFO.y - height + Math.random() * height * 2,
                    size: Math.random() * 5,
                    t: Math.random() * 500,
                });
            }
        }
    }

    /**
     * Draws the game on the canvas.
     */
    draw() {
        try {
            if (this.ctx && this.gameStatus && this.canvas) {
                const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
            const { status, payout, startTime }: any = this.gameStatus;
            const width = this.gameWidth;
            const height = this.gameHeight;
            const crashWidth = width * 0.3;
            const canvasHeight = this.canvas.height;
            let DISPLAY_PAYOUT = "";
            let DISPLAY_STATUS = "";
            let currentTime = new Date().getTime();
            if (status === GAME_STATES.Over) {
                DISPLAY_PAYOUT = `${this.PAY_OUT.toFixed(2)}x`;
                DISPLAY_STATUS = "Current payout";
            } else if (status === GAME_STATES.InProgress) {
                DISPLAY_PAYOUT = `${payout.toFixed(2)}x`;
                DISPLAY_STATUS = "Current payout";
            } else {
                const endTime = new Date(new Date(startTime).getTime());
                let timeCount =
                    Math.floor((endTime.getTime() - currentTime) / 10) / 100;
                if (timeCount < 0) {
                    DISPLAY_PAYOUT = "__LOADING__";
                } else {
                    DISPLAY_PAYOUT = `0${timeCount.toFixed(1)}`;
                    DISPLAY_STATUS = "Starting...";
                }
            }

            //display game status
            const drawStatus = () => {
                ctx.textAlign = "center";
                ctx.fillStyle = "#00f3ff";
                ctx.save();

                // Draw scale-bar loader animation instead of "waiting..." text
                if (DISPLAY_PAYOUT === "__LOADING__") {
                    // mimic main PageLoader: wider bars, centered on full canvas
                    const barCount = 5;
                    // medium bars for connecting loader
                    const barWidth = 6; // px
                    const barMaxH = 16; // px height
                    const gap = 8; // px gap
                    const totalW = barCount * barWidth + (barCount - 1) * gap;
                    const startX = (width - totalW) / 2;  // center across full width
                    const baseY = height / 2; // vertical centre
                    const now = Date.now();

                    for (let i = 0; i < barCount; i++) {
                        const phase = (now / 400 + i * 0.8);
                        const scale = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase));
                        const barH = barMaxH * scale;
                        // Glow effect
                        ctx.shadowColor = "#00f3ff";
                        ctx.shadowBlur = 8;
                        ctx.fillStyle = "#00f3ff";
                        ctx.fillRect(
                            startX + i * (barWidth + gap),
                            baseY - barH,
                            barWidth,
                            barH
                        );
                    }
                    // Reset shadow
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;

                    // "CONNECTING" text below bars
                    ctx.fillStyle = "#00f3ff";
                    ctx.font = `${Math.max(height * 0.02, 8)}px monospace`;
                    ctx.letterSpacing = "3px";
                    ctx.fillText("CONNECTING", width / 2, baseY + height * 0.02);
                    ctx.letterSpacing = "0px";
                } else {
                    ctx.font = `${height * 0.16}px Unlock`;
                    ctx.fillText(DISPLAY_PAYOUT, width / 2, height * 0.23);
                    ctx.font = `${height * 0.04}px Unlock`;
                    ctx.fillText(DISPLAY_STATUS, width / 2, height * 0.3);
                }

                ctx.restore();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#00f3ff";
                ctx.textBaseline = "middle";
                ctx.textAlign = "end";
            };

            // draw only payout labels on the right side with fixed half‑step spacing
            const drawRuler = () => {
                const panelWidth = 60;
                // panel background
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillRect(width - panelWidth, 0, panelWidth, height);

                // build array of values from 1.0 upward in 0.5 increments
                const maxValue = Math.max(3, Math.ceil(this.PAY_OUT));
                const values: number[] = [];
                for (let v = 1.0; v <= maxValue; v += 0.5) {
                    values.push(parseFloat(v.toFixed(1)));
                }

                const count = values.length;
                if (count === 0) return;
                const spacing = height / (count - 1);

                // paint settings
                ctx.strokeStyle = "#ffffffaa";
                ctx.fillStyle = "#ffffff";
                ctx.globalAlpha = 0.9;

                // center of panel for text
                const mx = width - panelWidth / 2;

                values.forEach((val, idx) => {
                    const y = height - idx * spacing;
                    // tick line
                    ctx.beginPath();
                    ctx.moveTo(width - panelWidth + 5, y);
                    ctx.lineTo(width - 5, y);
                    ctx.stroke();
                    ctx.closePath();

                    // choose font size: half-step smaller
                    if (val % 1 !== 0) {
                        ctx.font = `${height * 0.025}px Rubik`;
                    } else {
                        ctx.font = `${height * 0.035}px Rubik`;
                    }
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(`${val.toFixed(1)}x`, mx, y);
                });

                ctx.globalAlpha = 1;
            };

            // draw parabolic curve
            let startX = this.rule_x - 5;
            let startY = height - 2;
            let controlX = (this.GAME_INFO.camerax + this.GAME_INFO.x) * 0.75;
            let controlY = height;
            let endX = this.GAME_INFO.camerax + this.GAME_INFO.x - 2;
            let endY = this.GAME_INFO.cameray + this.GAME_INFO.y - 2;
            let derivativeX = 2 * (endX - controlX);
            let derivativeY = 2 * (endY - controlY);
            let angleInRadians = Math.atan2(derivativeY, derivativeX);

            const drawParabola = () => {
                ctx.beginPath();
                var gradient = ctx.createLinearGradient(startX, startY, endX, endY);
                gradient.addColorStop(0, "#00f3ff00");
                gradient.addColorStop(1, "#00f3ff");
                ctx.strokeStyle = gradient;
                ctx.moveTo(startX, startY);
                const linewidth = crashWidth * 0.04 * this.scale;
                ctx.lineWidth = linewidth;
                ctx.quadraticCurveTo(controlX, controlY, endX + .7, endY + linewidth / 2);
                ctx.lineCap = "round";
                ctx.stroke();
                ctx.closePath();
            };

            /**
             * Draws stars or particles on the canvas.
             */
            const drawStar = () => {
                // ✅ Guard if image not ready
                if (!isImageReady(this.starImg)) return;
                
                for (var i = 0; i < this.STARS.length; i++) {
                    ctx.save();
                    ctx.globalAlpha = 0.6;
                    ctx.translate(this.STARS[i].x, this.STARS[i].y);
                    ctx.drawImage(
                        this.starImg!,
                        -this.STARS[i].size,
                        -this.STARS[i].size,
                        this.STARS[i].size * 2,
                        this.STARS[i].size * 2
                    );
                    ctx.restore();
                    if (status === GAME_STATES.InProgress) {
                        this.STARS[i].x -= 0.7;
                        this.STARS[i].y += 0.1;
                    }
                    // else {
                    // this.STARS[i].x -= .2;
                    // this.STARS[i].y += .2;
                    // }
                    if (this.STARS[i].t < 0) {
                        this.STARS.splice(i, 1);
                    } else {
                        this.STARS[i].t--;
                    }
                }
            };

            // draw rocket
            const drawRocket = () => {
                // display rocket when game is running
                if (status !== GAME_STATES.Over) {
                    // ✅ Prevent transform accumulation
                    ctx.save();
                    ctx.translate(this.GAME_INFO.x, this.GAME_INFO.y);
                    ctx.rotate(angleInRadians);
                    ctx.scale(this.scale, this.scale);
                    ctx.globalAlpha = 1;

                    // ✅ Guard if image not ready
                    if (isImageReady(this.crashImage)) {
                        ctx.drawImage(
                            this.crashImage!,
                            -crashWidth / 2,
                            -crashWidth / 2,
                            crashWidth,
                            crashWidth
                        );
                    }

                    ctx.restore();
                    return;
                }

                // display explosion particles when game is over
                ctx.save();

                const particles = this.GAME_INFO.PARTICLES || [];

                // ✅ Iterate backwards so we can safely remove entries
                for (let i = particles.length - 1; i >= 0; i--) {
                    const item: any = particles[i];

                    // ✅ Support both formats:
                    // - item is particle
                    // - item is { p: particle }
                    const p = item?.p ?? item;

                    // ✅ Remove invalid entries immediately
                    if (!p) {
                        particles.splice(i, 1);
                        continue;
                    }

                    // ✅ Now it's safe
                    p.w = crashWidth * this.scale;

                    if (typeof p.show === "function") {
                        p.show(ctx);
                    }

                    // ✅ Correct removal (slice was wrong)
                    if (!p.active) {
                        particles.splice(i, 1);
                    }
                }

                ctx.restore();
            };

            drawParabola();
            ctx.save();
            ctx.translate(this.GAME_INFO.camerax, this.GAME_INFO.cameray);

            drawStar();
            drawRocket();
            ctx.restore();
            drawStatus();
            drawRuler();
            }
        } catch (e) {
            console.error("Crash canvas draw failed:", e);
        }
    }
}

const gameEngine = new CrashGameEngine();

const GameCanvas = (infos: any) => {
    const ref = useRef(null);

    const [isDump, setDump] = useState(false)
    useEffect(() => {
        if (infos.status === GAME_STATES.Over && !isDump) {
            setDump(true)
        } else if (infos.status === GAME_STATES.InProgress && isDump) {
            setDump(false)
        }
        gameEngine.update(infos);
    }, [infos, isDump]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const canvas = document.createElement("canvas");
        const container: any = ref.current;
        setTimeout(() => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            gameEngine.start(canvas);
        }, 1000)
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        window.onresize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            gameEngine.start(canvas);
        };
        container.appendChild(canvas);
        gameEngine.start(canvas);

        return () => {
            container.removeChild(canvas);
        };
    }, []);
    return (
        <div
            ref={ref}
            className={`rounded-md  ${isDump ? "animate-explode" : ""}`}
            style={{
                width: "100%",
                height: "100%",
                backgroundImage:
                    "linear-gradient(227deg, rgba(0, 243, 255, 0.06), rgb(0, 0, 0))",
            }}
        />
    );
};

export default GameCanvas;
