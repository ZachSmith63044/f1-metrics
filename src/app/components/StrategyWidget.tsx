import React, { useEffect, useState } from "react";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import {
    LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Box, Typography } from "@mui/material";
import { createPortal } from "react-dom";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Check } from '@mui/icons-material';

type LapTimePoint = {
    lap: number;
    time: number;
};

function formatToMinSecMillis(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds % 1) * 1000);

    const paddedSecs = secs.toString().padStart(2, '0');
    const paddedMillis = millis.toString().padStart(3, '0');

    return `${mins}:${paddedSecs}.${paddedMillis}`;
}

function getRegressionLine(data: LapTimePoint[]): LapTimePoint[] {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.lap, 0);
    const sumY = data.reduce((sum, d) => sum + d.time, 0);
    const sumXY = data.reduce((sum, d) => sum + d.lap * d.time, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.lap * d.lap, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map(d => ({
        lap: d.lap,
        time: slope * d.lap + intercept,
    }));
}

type MiniChartProps = {
    data: LapTimePoint[];
    driver: DriverData | undefined
};

const MiniChart: React.FC<MiniChartProps> = ({ data, driver }) => {
    const regression = getRegressionLine(data);

    const minLap = Math.min(...data.map((x) => x.time)) - 0.05;
    const maxLap = Math.max(...data.map((x) => x.time)) + 0.05;

    return (
        <div style={{ width: 340, height: 200 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis dataKey="lap" hide />
                    <YAxis hide domain={[minLap, maxLap]} />
                    <Line
                        type="monotone"
                        dataKey="time"
                        stroke={driver == undefined ? "#FFFFFF" : driver.teamColour}
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        data={regression}
                        dataKey="time"
                        stroke={driver == undefined ? "#FFFFFF" : driver.teamColour}
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="4 4"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

type Compound = "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | "UNKNOWN";

type Stint = {
    compound: Compound;
    startLap: number;
    endLap: number;
};

export type DriverStrategy = {
    driver: string;
    stints: Stint[];
    driverData: DriverData;
};

type TyreStrategyChartProps = {
    laps: LapData[][];
    drivers: DriverData[];
    clickable: boolean;
    onClick: (driverLaps: LapData[], index: number, add: boolean) => void;
};

function toCompound(input: string): Compound {
    const compounds: Compound[] = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"];
    return compounds.includes(input as Compound) ? (input as Compound) : "UNKNOWN";
}

const calculateStrategies = (laps: LapData[][], drivers: DriverData[]): DriverStrategy[] => {
    let strategies: DriverStrategy[] = [];
    for (let i = 0; i < laps.length; i++) {
        let currentStint = 1;
        let tyre: Compound = "SOFT";
        let driverStints: Stint[] = [];
        let startLap = 1;
        for (let j = 0; j < laps[i].length; j++) {
            if (laps[i][j].stint == currentStint) {
                tyre = toCompound(laps[i][j].compound);
            }
            else {
                driverStints.push({ compound: tyre, startLap: startLap, endLap: j });
                startLap = laps[i][j].lapNumber;
                currentStint = laps[i][j].stint;
                tyre = toCompound(laps[i][j].compound);
            }
        }
        if (laps[i].length > 0) {
            driverStints.push({ compound: tyre, startLap: startLap, endLap: laps[i].length + 1 });
        }
        strategies.push({ driver: drivers[i].lastName, stints: driverStints, driverData: drivers[i] });
    }
    return strategies;
};

const compoundColors: Record<Compound, string> = {
    SOFT: "#ff4c4c",
    MEDIUM: "#f5e356",
    HARD: "#ffffff",
    INTERMEDIATE: "#3cb371",
    WET: "#1e90ff",
    UNKNOWN: "000000"
};



const TyreStrategyChart: React.FC<TyreStrategyChartProps> = ({ laps, drivers, clickable, onClick }) => {
    const [strategies, setStrategies] = useState<DriverStrategy[]>([]);

    const TOTAL_LAPS = Math.max(...laps.map((x) => x.length));

    const [stintAdded, setStintAdded] = useState<boolean[][]>([]);

    // let stintAdded: boolean[][] = [];

    useEffect(() => {
        let strats = calculateStrategies(laps, drivers);
        let stintAdded: boolean[][] = [];
        for (let i = 0; i < strats.length; i++) {
            stintAdded.push([]);
            for (let j = 0; j < strats[i].stints.length; j++) {
                let selected: boolean = false;
                for (let k = strats[i].stints[j].startLap - 1; k < strats[i].stints[j].endLap - 1; k++) {
                    if (laps[i][k].isChecked == true) {
                        selected = true;
                        break;
                    }
                }
                stintAdded[i].push(selected);
            }
        }
        setStintAdded(stintAdded);
        console.log(stintAdded);
        setStrategies(strats);
    }, []);

    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        content: string;
        x: number;
        y: number;
        data: [number, number][]
        driver: DriverData | undefined
    }>({
        visible: false,
        content: "",
        x: 0,
        y: 0,
        data: [],
        driver: undefined
    });

    const handleMouseEnter = (
        e: React.MouseEvent<HTMLDivElement>,
        compound: string,
        startLap: number,
        endLap: number,
        idx: number,
    ) => {
        let lapTimes: [number, number][] = [];
        for (let i = startLap - 1; i < endLap - 1; i++) {
            if (laps[idx][i].isAccurate) {
                lapTimes.push([i + 1, laps[idx][i].lapTime]);
            }
        }
        setTooltip({
            visible: true,
            content: `${compound}: Laps ${startLap}-${endLap} (${endLap - startLap + 1} laps)\nAverage Lap - ${formatToMinSecMillis(lapTimes.reduce((sum, [_, time]) => sum + time, 0) / lapTimes.length)}`,
            x: e.clientX + 10,
            y: e.clientY + 10,
            data: lapTimes,
            driver: drivers[idx]
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const tooltipWidth = 340;
        const tooltipHeight = 270;
        const padding = 10;

        setTooltip((prev) => {
            const willOverflowRight = e.clientX + tooltipWidth + padding > window.innerWidth;
            const willOverflowBottom = e.clientY + tooltipHeight + padding > window.innerHeight;

            const x = willOverflowRight
                ? e.clientX - tooltipWidth - padding
                : e.clientX + padding;

            const y = willOverflowBottom
                ? e.clientY - tooltipHeight - padding
                : e.clientY + padding;

            return {
                ...prev,
                x,
                y,
            };
        });
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, content: "", x: 0, y: 0, data: [], driver: undefined });
    };

    return (
        <Box>
            <div className="space-y-4 relative">
                {strategies.map(({ driver, stints }, driverIdx) => {
                    const position = `P${driverIdx + 1}`; // Driver's position (P1, P2, etc.)
                    return (
                        <div key={driver} className="flex items-center">
                            {/* Container with fixed width of 200px for text */}
                            <div className="font-medium" style={{ width: '135px' }}>
                                <span style={{ marginRight: "5px" }} className="font-bold text-lg">{position}</span> {driver}
                            </div>
                            {/* Tyre strategy bar */}
                            <div className="relative h-6 rounded overflow-hidden flex-1">
                                {stints.map(({ compound, startLap, endLap }, idx) => {
                                    const width = ((endLap - startLap + 1) / TOTAL_LAPS) * 100;
                                    const left = (startLap / TOTAL_LAPS) * 100;

                                    const isFirst = idx === 0;
                                    const isLast = idx === stints.length - 1;

                                    const roundedClasses = [
                                        isFirst && "rounded-l-md",
                                        isLast && "rounded-r-md",
                                    ]
                                        .filter(Boolean)
                                        .join(" ");

                                    return (
                                        <div
                                            key={idx}
                                            className={`absolute top-0 h-full cursor-pointer ${roundedClasses} group`}
                                            style={{
                                                width: `${width}%`,
                                                left: `${left}%`,
                                                backgroundColor: compoundColors[compound],
                                                borderRight: "1px solid #000",
                                            }}
                                            onMouseEnter={(e) =>
                                                handleMouseEnter(e, compound, startLap, endLap, driverIdx)
                                            }
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                            onClick={(event) => {
                                                if (clickable) {
                                                    let lapsPush: LapData[] = [];
                                                    for (let i = startLap - 1; i < endLap - 1; i++) {
                                                        if (laps[driverIdx][i].isAccurate) {
                                                            lapsPush.push(laps[driverIdx][i]);
                                                        }
                                                    }
                                                    const minLapTime = Math.min(
                                                        ...lapsPush.map(lap => lap.lapTime === -1 ? 9999 : lap.lapTime)
                                                    );
                                                    for (let i = lapsPush.length - 1; i > -1; i--) {
                                                        if (lapsPush[i].lapTime > minLapTime * 1.06) {
                                                            lapsPush.splice(i, 1);
                                                        }
                                                    }

                                                    console.log(driverIdx);
                                                    console.log(idx);
                                                    console.log(stintAdded);
                                                    onClick(
                                                        lapsPush,
                                                        driverIdx,
                                                        !stintAdded[driverIdx][idx]
                                                    );
                                                    let newStint: boolean[][] = [...stintAdded];
                                                    newStint[driverIdx][idx] = !newStint[driverIdx][idx];
                                                    setStintAdded(newStint);
                                                }
                                            }}
                                            onDoubleClick={(event) => {
                                                if (clickable) {
                                                    let lapsPush: LapData[] = [];
                                                    for (let i = startLap - 1; i < endLap - 1; i++) {
                                                        if (laps[driverIdx][i].isAccurate) {
                                                            lapsPush.push(laps[driverIdx][i]);
                                                        }
                                                    }
                                                    console.log(driverIdx);
                                                    console.log(idx);
                                                    console.log(stintAdded);
                                                    onClick(
                                                        lapsPush,
                                                        driverIdx,
                                                        !stintAdded[driverIdx][idx]
                                                    );
                                                    let newStint: boolean[][] = [...stintAdded];
                                                    newStint[driverIdx][idx] = !newStint[driverIdx][idx];
                                                    setStintAdded(newStint);
                                                }
                                            }}
                                        >

                                            {clickable && stintAdded[driverIdx][idx] && (
                                                <Check
                                                    sx={{
                                                        fontSize: 20,
                                                        color: "#00AA00",
                                                        position: "absolute",
                                                        top: "50%",
                                                        left: "50%",
                                                        transform: "translate(-50%, -50%)",
                                                        strokeWidth: 1.5,  // Adjust this value to make the tick thicker
                                                        stroke: "#00AA00",  // Make sure the stroke color matches the fill color
                                                    }}
                                                />
                                            )}
                                            {clickable && (
                                                <div className="hidden group-hover:flex items-center justify-center absolute inset-0 pointer-events-none">
                                                    {/* Show RemoveCircle icon if selected, AddCircle otherwise */}
                                                    {!stintAdded[driverIdx][idx] ? (
                                                        <AddCircleIcon
                                                            sx={{
                                                                fontSize: 20,
                                                                color: "white",
                                                                filter: "drop-shadow(0 0 2px black)",
                                                            }}
                                                        />
                                                    ) : (
                                                        <RemoveCircleIcon
                                                            sx={{
                                                                fontSize: 20,
                                                                color: "white",
                                                                filter: "drop-shadow(0 0 2px black)",
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {tooltip.visible &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            zIndex: 50,
                            padding: "10px",
                            backgroundColor: "#303030",
                            color: "white",
                            fontSize: "0.875rem",
                            borderRadius: "1rem",
                            pointerEvents: "none",
                            top: tooltip.y,
                            left: tooltip.x,
                            textAlign: "center",
                        }}
                    >
                        <Typography>{tooltip.content.split("\n")[0]}</Typography>
                        <Typography>{tooltip.content.split("\n")[1]}</Typography>
                        <MiniChart
                            data={tooltip.data.map(([lap, time]: [number, number]) => ({ lap, time }))}
                            driver={tooltip.driver}
                        />
                    </div>,
                    document.body
                )
            }

        </Box>
    );
};

export default TyreStrategyChart;
