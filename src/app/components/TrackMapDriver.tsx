import { motion, useMotionValue, useSpring, useTransform, MotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { LiveDriverData } from "../liveDash/page";
import { Pos } from "./TrackMapDisplay";

export const AnimatedDriverDot = ({
    name,
    colour,
    telemetry,
    centre,
    rotationDeg,
    rotatedMinX,
    rotatedMinY,
    scale,
    offsetX,
    offsetY,
    selected
}: {
    name: string;
    colour: string;
    telemetry: LiveDriverData;
    centre: Pos,
    rotationDeg: number;
    rotatedMinX: number;
    rotatedMinY: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    selected: boolean;
}) => {
    const [x, setX] = useState<number>(0);
    const [y, setY] = useState<number>(0);
    const [delay, setDelay] = useState<number>(0.3);
    const [showInfo, setShowInfo] = useState<boolean>(selected);

    const [speed, setSpeed] = useState<number>(0);
    const [gear, setGear] = useState<number>(0);
    const [throttle, setThrottle] = useState<number>(0);
    const [brake, setBrake] = useState<boolean>(false);
    const [drs, setDrs] = useState<number>(0);
    const [telemDelay, setTelemDelay] = useState<number>(0.3);


    const rotatePoint = (p: Pos, center: Pos, angleRad: number): Pos => {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        return {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos,
        };
    };

    const rotatePointNew = (point: Pos) => {
        const angleRad = (rotationDeg * Math.PI) / 180;
        let rotatedPoint = rotatePoint(point, centre, angleRad);
        return {
            x: (rotatedPoint.x - rotatedMinX) * scale + offsetX,
            y: (rotatedPoint.y - rotatedMinY) * scale + offsetY,
        };
    };

    useEffect(() => {
        if (telemetry.position.length === 0) return;

        let timeout: ReturnType<typeof setTimeout> | null = null;

        const updatePosition = () => {
            const now = new Date();
            const positions = telemetry.position;

            let i = 0;
            while (i < positions.length && positions[i].time <= now) {
                i++;
            }
            const next = positions[i];

            if (next) {
                setX(next.x);
                setY(next.y);

                const delayMs = next.time.getTime() - now.getTime();
                setDelay(delayMs / 1000);

                console.log(delayMs);
                timeout = setTimeout(updatePosition, delayMs);
            }
            else
            {
                console.log("NO NEXT!!!");
            }
        };

        updatePosition();

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [telemetry.position]);

    useEffect(() => {
        if (telemetry.telemetry.length === 0) return;

        let timeout2: ReturnType<typeof setTimeout> | null = null;

        const updateTelemetry = () => {
            const now = new Date();
            const telem = telemetry.telemetry;

            let i = 0;
            while (i < telem.length && telem[i].time <= now) {
                i++;
            }
            const next = telem[i];

            if (next) {
                setSpeed(next.speed);
                setGear(next.gear);
                setThrottle(next.throttle);
                setBrake(next.brake);
                setDrs(next.drs);

                const delayMs = next.time.getTime() - now.getTime();
                setTelemDelay(delayMs / 1000);

                timeout2 = setTimeout(updateTelemetry, delayMs);
            }
        };

        updateTelemetry();

        return () => {
            if (timeout2) clearTimeout(timeout2);
        };
    }, [telemetry.telemetry]);

    const screenPos = rotatePointNew({ x, y });

    return (
        <motion.g
            animate={{ translateX: screenPos.x, translateY: screenPos.y }}
            transition={{ duration: delay, ease: "linear" }}
            onClick={() => {setShowInfo(prev => !prev)}}
            style={{ cursor: "pointer" }}
        >
            {showInfo && (
                <g transform="translate(0, -110)">
                    {/* Wider background to fit both */}
                    <rect x={-106} y={-20} width={216} height={106} fill="#444444" rx={5} />

                    {/* Driver Tag on the left */}
                    <foreignObject x={-100} y={18} width={70} height={40}>
                        <div>
                            <DriverPositionTag position={1} name={name} colour={colour} />
                        </div>
                    </foreignObject>

                    {/* SpeedCircle on the right */}
                    <g transform="translate(-10, -10)">
                        <SpeedCircle
                            speed={speed}
                            telemDelay={telemDelay}
                            colour={colour}
                            gear={gear}
                            brake={brake}
                            throttle={throttle}
                            drs={drs}
                        />
                    </g>
                </g>
            )}
            <circle r={20} fill={colour} />
            <text x={0} y={5} fontSize={10} textAnchor="middle" fill="white" style={{ fontSize: 14, fontWeight: "bold" }}>
                {name}
            </text>
        </motion.g>
    );
};

export const SpeedCircle = ({
    speed,
    gear,
    brake,
    throttle,
    drs,
    maxSpeed = 370,
    colour = "lime",
    radius = 40,
    telemDelay = 0.3,
}: {
    speed: number;
    gear: number;
    brake: boolean;
    throttle: number; // 0 to 100
    maxSpeed?: number;
    colour?: string;
    radius?: number;
    telemDelay?: number;
    drs: number;
}) => {
    const stroke = 5;
    const circumference = 2 * Math.PI * radius;
    const rawSpeed = useMotionValue(0);
    const displaySpeed = useTransform(rawSpeed, (v) => `${Math.round(v)} km/h`);

    const rawThrottle = useMotionValue(0);

    useEffect(() => {
        const speedAnim = animate(rawSpeed, speed, {
            duration: telemDelay,
            ease: "linear",
        });
        const throttleAnim = animate(rawThrottle, throttle, {
            duration: telemDelay,
            ease: "linear",
        });
        return () => {
            speedAnim.stop();
            throttleAnim.stop();
        };
    }, [speed, throttle, telemDelay]);

    const percent = useTransform(rawSpeed, (v) =>
        Math.min(Math.max(v / maxSpeed, 0), 1)
    );
    const dashOffset = useTransform(percent, (p) => circumference * (1 - p));

    const size = radius * 2 + stroke * 2;
    const center = radius + stroke;

    // Throttle bar settings
    const barHeight = size;
    const barWidth = 10;
    const barX = size + 10;

    return (
        <svg width={size + barWidth + 20} height={size}>
            {/* Circle background */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#333"
                strokeWidth={stroke}
            />
            {/* Animated speed circle */}
            <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={colour}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{
                    strokeDashoffset: dashOffset,
                    rotate: -90,
                    transformOrigin: "center",
                }}
            />
            {/* Speed text */}
            <g>
                <motion.text
                    x={center}
                    y={center - 8}
                    textAnchor="middle"
                    fill={drs == 0 ? "white" : drs == 1 ? "lime" : "orange"}
                    fontSize={13}
                    fontWeight="bold"
                    dominantBaseline="middle"
                >
                    {displaySpeed}
                </motion.text>
                <text
                    x={center}
                    y={center + 10}
                    textAnchor="middle"
                    fill="white"
                    fontSize={13}
                    fontWeight="bold"
                    dominantBaseline="middle"
                >
                    Gear: {gear}
                </text>
            </g>

            {/* Throttle bar background (grey or red if braking) */}
            <rect
                x={barX}
                y={0}
                width={barWidth}
                height={barHeight}
                fill={brake ? "red" : "#666"}
                rx={2}
            />

            {/* Animated throttle fill */}
            <motion.rect
                x={barX}
                width={barWidth}
                rx={2}
                style={{
                    height: useTransform(rawThrottle, (t) => barHeight * (t / 100)),
                    y: useTransform(rawThrottle, (t) => barHeight * (1 - t / 100)),
                }}
                fill="lime"
            />
        </svg>
    );
};




export const DriverPositionTag = ({
    position,
    name,
    colour,
}: {
    position: number;
    name: string;
    colour: string;
}) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: colour,
                borderRadius: "8px", // Slightly rounded
                padding: "4px 4px",
                color: "white",
                fontFamily: "sans-serif",
                fontWeight: "bold",
                gap: "8px",
                minWidth: 30,
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    color: colour,
                    borderRadius: "6px", // Slightly rounded inner box
                    width: 100,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                }}
            >
                {position}
            </div>
            <div style={{ fontSize: 14 }}>{name}</div>
        </div>
    );
};
