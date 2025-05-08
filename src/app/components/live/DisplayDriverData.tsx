import React, { useEffect, useMemo, useState } from "react";
import { LiveDriverData } from "../../liveDash/page";
import { Box } from "@mui/material";
import { LiveDriverPosition, LiveDriverSector, LiveDriverTyre } from "@/app/utils/fetchLiveData";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";


interface DisplayDriverDataProps {
    positions: LiveDriverPosition[];
    drivers: { [key: string]: LiveDriverData };
    showTelem: boolean;
}


export const DisplayDriverData: React.FC<DisplayDriverDataProps> = ({
    positions,
    drivers,
    showTelem,
}) => {
    const [currentPositions, setCurrentPositions] = useState<number[]>([]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        const updatePositions = () => {
            let currentPos: number[] = [];
            let timeUntil: number = -1;
            for (let i = 0; i < positions.length; i++) {
                if (positions[i].time <= new Date()) {
                    currentPos = positions[i].driverNums;
                }
                else {
                    timeUntil = (positions[i].time.getTime() - (new Date()).getTime());
                    break;
                }
            }

            console.log(positions.length);
            console.log("LENGTH");

            setCurrentPositions(currentPos);

            if (timeUntil != -1) {
                console.log(timeUntil);
                console.log("TIME UNTIL");
                timeout = setTimeout(updatePositions, timeUntil);
            }
        };

        updatePositions();
    }, [positions]);


    return (
        <Box padding={2}>
            {
                currentPositions.map((number, index) => {
                    return (
                        <Box flexDirection={"row"} display={"flex"} alignItems={"center"} mb={1} key={drivers[`${number}`].driver.driverNumber}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    backgroundColor: drivers[`${number}`].driver.teamColour,
                                    borderRadius: "8px",
                                    padding: "6px 6px 6px 8px",
                                    color: "white",
                                    fontFamily: "sans-serif",
                                    fontWeight: "bold",
                                    width: 87,
                                    height: 42,
                                    marginRight: 6,
                                }}
                            >
                                <div style={{ fontSize: 19 }}>{index + 1}</div>
                                <div
                                    style={{
                                        backgroundColor: "white",
                                        color: drivers[`${number}`].driver.teamColour,
                                        borderRadius: "6px",
                                        width: 45,
                                        height: 30,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 17,
                                    }}
                                >
                                    {drivers[`${number}`].driver.driver}
                                </div>
                            </div>
                            {
                                showTelem &&
                                <DriverTelemetryData telemetry={drivers[`${number}`]} />
                            }
                            <DisplayInterval telemetry={drivers[`${number}`]} position={index + 1} />
                            <DisplayLaptimes telemetry={drivers[`${number}`]} />
                            <DisplayTyres telemetry={drivers[`${number}`]} />
                        </Box>

                    );
                })
            }
        </Box>
    );
};


const DriverTelemetryData = ({
    telemetry
}: {
    telemetry: LiveDriverData
}) => {
    const [speed, setSpeed] = useState<number>(0);
    const [gear, setGear] = useState<number>(0);
    const [throttle, setThrottle] = useState<number>(0);
    const [brake, setBrake] = useState<boolean>(false);
    const [drs, setDrs] = useState<number>(0);
    const [telemDelay, setTelemDelay] = useState<number>(0.3);


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



    return (
        <Box display={"flex"} flexDirection={"row"}>
            <Box display={"flex"} flexDirection={"column"} width={"82px"} alignItems={"end"} mr={1.5} fontWeight={"bold"} color={drs === 0 ? "white" : drs === 1 ? "lime" : "orange"}>
                <motion.text
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight="bold"
                    dominantBaseline="middle"
                >
                    {displaySpeed}
                </motion.text>
                Gear: {gear}
            </Box>
            <svg width="20" height="45">
                <rect
                    width={10}
                    height={45}
                    fill={brake ? "red" : "#666"}
                    rx={2}
                />
                <motion.rect
                    width={10}
                    rx={2}
                    style={{
                        height: useTransform(rawThrottle, (t) => 45 * (t / 100)),
                        y: useTransform(rawThrottle, (t) => 45 * (1 - t / 100)),
                    }}
                    fill="lime"
                />
            </svg>
        </Box>
    );
};



const DisplayInterval = ({
    telemetry,
    position
}: {
    telemetry: LiveDriverData,
    position: number
}) => {
    const [interval, setIntervalValue] = useState<number>(0);
    const [gapToLeader, setGapToLeader] = useState<number>(0);

    useEffect(() => {
        if (telemetry.intervals.length === 0) return;

        let timeout2: ReturnType<typeof setTimeout> | null = null;

        const updateInterval = () => {
            const now = new Date();
            const intervals = telemetry.intervals;

            let timeUntil = -1;
            let currentInterval;

            for (let i = 0; i < intervals.length; i++) {
                if (intervals[i].time.getTime() <= now.getTime()) {
                    currentInterval = intervals[i];
                } else {
                    timeUntil = intervals[i].time.getTime() - now.getTime();
                    break;
                }
            }

            if (currentInterval) {
                setIntervalValue(currentInterval.interval);
                setGapToLeader(currentInterval.gapToLeader);
                timeout2 = setTimeout(updateInterval, timeUntil);
            } else if (timeUntil !== -1) {
                timeout2 = setTimeout(updateInterval, timeUntil);
            }
        };

        updateInterval();

        return () => {
            if (timeout2) clearTimeout(timeout2);
        };
    }, [telemetry.intervals]);

    const formatTime = (value: number) => `+${value.toFixed(3)}`;

    const displayInterval = position === 1 ? '-.---' : interval == 0 ? "+?.???" : formatTime(interval);
    const displayGap = position === 1 ? '-.---' : gapToLeader == 0 ? "+?.???" : formatTime(gapToLeader);

    return (
        <div style={{ textAlign: 'end', width: 105 }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>
                {displayInterval}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
                {displayGap}
            </div>
        </div>
    );
};

const DisplayLaptimes = ({
    telemetry
}: {
    telemetry: LiveDriverData
}) => {
    const [lap, setLap] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date() });
    const [s1, setS1] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date() });
    const [s2, setS2] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date() });
    const [s3, setS3] = useState<LiveDriverSector>({ driverNum: 0, duration: 0, pbDuration: 0, sectorNum: 0, time: new Date() });

    useEffect(() => {
        if (telemetry.sectors.length === 0) return;

        let timeout2: ReturnType<typeof setTimeout> | null = null;

        const updateInterval = () => {
            const now = new Date();
            const sectors = telemetry.sectors;

            let timeUntil = -1;
            let currentLap;
            let currentS1;
            let currentS2;
            let currentS3;

            for (let i = 0; i < sectors.length; i++) {
                if (sectors[i].time.getTime() <= now.getTime()) {
                    if (sectors[i].sectorNum == 0) {
                        currentLap = sectors[i];
                    }
                    if (sectors[i].sectorNum == 1) {
                        currentS1 = sectors[i];
                    }
                    if (sectors[i].sectorNum == 2) {
                        currentS2 = sectors[i];
                    }
                    if (sectors[i].sectorNum == 3) {
                        currentS3 = sectors[i];
                    }
                } else {
                    timeUntil = sectors[i].time.getTime() - now.getTime();
                    break;
                }
            }

            if (currentLap) {
                setLap(currentLap);
            }
            if (currentS1) {
                setS1(currentS1);
            }
            if (currentS2) {
                setS2(currentS2);
            }
            if (currentS3) {
                setS3(currentS3);
            }

            if (timeUntil !== -1) {
                timeout2 = setTimeout(updateInterval, timeUntil);
            }
        };

        updateInterval();

        return () => {
            if (timeout2) clearTimeout(timeout2);
        };
    }, [telemetry.sectors]);

    const formatLapTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
        return `${minutes}:${formattedSeconds}`;
    };

    return (
        <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'end', width: 115 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 550 }}>
                    {
                        lap.duration == 0 ? "?:??.???" : formatLapTime(lap.duration)
                    }
                </div>
                <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
                    {
                        lap.pbDuration == 0 ? "?:??.???" : formatLapTime(lap.pbDuration)
                    }
                </div>
            </div>
            <div style={{ textAlign: 'end', width: 70 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 550 }}>
                    {
                        s1.duration == 0 ? "??.???" : s1.duration.toFixed(3)
                    }
                </div>
                <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
                    {
                        s1.pbDuration == 0 ? "??.???" : s1.pbDuration.toFixed(3)
                    }
                </div>
            </div>
            <div style={{ textAlign: 'end', width: 70 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 550 }}>
                    {
                        s2.duration == 0 ? "??.???" : s2.duration.toFixed(3)
                    }
                </div>
                <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
                    {
                        s2.pbDuration == 0 ? "??.???" : s2.pbDuration.toFixed(3)
                    }
                </div>
            </div>
            <div style={{ textAlign: 'end', width: 70 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 550 }}>
                    {
                        s3.duration == 0 ? "??.???" : s3.duration.toFixed(3)
                    }
                </div>
                <div style={{ fontSize: '0.85rem', color: '#AAA' }}>
                    {
                        s3.pbDuration == 0 ? "??.???" : s3.pbDuration.toFixed(3)
                    }
                </div>
            </div>
        </div>
    );
};


const DisplayTyres = ({
    telemetry
}: {
    telemetry: LiveDriverData
}) => {
    const [tyre, setTyre] = useState<LiveDriverTyre>({ driverNum: 0, compound: "UNKNOWN", tyreAge: 0, time: new Date() });


    useEffect(() => {
        if (telemetry.tyres.length === 0) return;

        let timeout2: ReturnType<typeof setTimeout> | null = null;

        const updateTyres = () => {
            const now = new Date();
            const tyres = telemetry.tyres;

            let timeUntil = -1;
            let tyre: LiveDriverTyre = { driverNum: 0, compound: "UNKNOWN", tyreAge: 0, time: new Date() };

            for (let i = 0; i < tyres.length; i++) {
                if (tyres[i].time.getTime() <= now.getTime()) {
                    tyre = tyres[i];
                } else {
                    timeUntil = tyres[i].time.getTime() - now.getTime();
                    break;
                }
            }

            if (tyre.compound != "UNKNOWN") {
                setTyre(tyre);
            }

            if (timeUntil !== -1) {
                timeout2 = setTimeout(updateTyres, timeUntil);
            }
        };

        updateTyres();

        return () => {
            if (timeout2) clearTimeout(timeout2);
        };
    }, [telemetry.tyres]);

    const formatLapTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
        return `${minutes}:${formattedSeconds}`;
    };

    return (
        <div style={{ marginLeft: 20, display: 'flex', gap: 10, alignItems: "center", fontWeight: "bold" }}>
            <img
                src={`/tyres/${tyre.compound.toLowerCase()}.svg`}
                alt={tyre.compound}
                width={40}
                height={40}
            />
            {tyre.tyreAge}L
        </div>
    );
};