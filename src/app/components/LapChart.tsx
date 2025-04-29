import React, { useEffect, useState } from "react";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import {
    LineChart, Line, XAxis, YAxis, ResponsiveContainer
} from 'recharts';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import TyreStrategyChart from "./StrategyWidget";
import LapChartGraph from "./DisplayLapChart";
import ChooseLaps from "./ChooseLap";

type LapChartProps = {
    laps: LapData[][];
    drivers: DriverData[];
};

const LapChart: React.FC<LapChartProps> = ({ laps, drivers }) => {

    const [lapsData, setLapsData] = useState<LapData[][]>(laps);

    const [dataType, setDataType] = useState<"stints" | "custom">("stints");

    const [chartKey, setKey] = useState<number>(0);



    const handleDataChange = (_event: React.MouseEvent<HTMLElement>, newValue: "stints" | "custom") => {
        if (newValue !== null) setDataType(newValue);
    };

    const checkSelected = () => {
        return lapsData.flatMap((lapList) => lapList.map((lap) => lap.isChecked)).includes(true);
    }

    return (
        <Box>
            <Box height={checkSelected() ? "calc(100vh - 50px)" : ""} mb={2}>
                <LapChartGraph lapsData={laps} driversData={drivers} key={chartKey} />
            </Box>

            {/* Centered ToggleButtonGroup */}
            <Box display="flex" justifyContent="center" mb={1}>
                <ToggleButtonGroup
                    value={dataType}
                    exclusive
                    onChange={handleDataChange}
                    size="small"
                    sx={{
                        border: "1px solid #AAAAAA",
                        "& .MuiToggleButton-root": {
                            border: "1px solid #AAAAAA",
                            "&.Mui-selected": {
                                border: "1px solid #AAAAAA",
                            },
                        },
                    }}
                >
                    <ToggleButton value="stints">Stints</ToggleButton>
                    <ToggleButton value="custom">Custom</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Full width TyreStrategyChart */}
            {
                dataType == "stints" ?
                <TyreStrategyChart
                    laps={laps}
                    drivers={drivers}
                    clickable={true}
                    onClick={(lapsDataImp, index, add) => {
                        console.log(lapsDataImp);
                        console.log(index);
                        console.log(add);

                        let newLaps = [...lapsData];
                        for (let i = 0; i < lapsDataImp.length; i++) {
                            newLaps[index][lapsDataImp[i].lapNumber - 1].isChecked = add;
                        }

                        setLapsData(newLaps);

                        setKey(chartKey + 1);

                        console.log(newLaps);
                    }}
                />
                :
                <ChooseLaps laps={laps} driversData={drivers} onChoose={() => {setKey(chartKey + 1)}} isCheckbox={true} />
            }
        </Box>
    );
};

export default LapChart;
