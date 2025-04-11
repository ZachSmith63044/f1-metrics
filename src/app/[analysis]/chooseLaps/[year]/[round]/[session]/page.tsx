"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, ThemeProvider, CssBaseline, Tab, Tabs, Checkbox, ToggleButtonGroup, ToggleButton, Button } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { LapData } from "../../../../../classes/lapData";
import { DriverData } from "../../../../../classes/driverData";
import darkTheme from "../../../../../theme";
import Navbar from "../../../../../components/Navbar";
import { fetchSessionData } from "../../../../../utils/fetchSessionData";
import { useParams, usePathname, useRouter } from "next/navigation";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useStore } from "../../../../../store/store";
import { LapMetadata } from "@/app/classes/telemetryData";

const LapTimesChart = () => {
    const [lapsData, setLapsData] = useState<LapData[][]>([[]]);
    const [driversData, setDriversData] = useState<DriverData[]>([new DriverData("Loading", "...", "Loading...", "#000000", 1, -1, -1, -1, 0, -1, 0, "Loading...")]);
    const [driverPositions, setDriverPositions] = useState<number[]>([0]); // [0] contains index of first place
    const [driversDisplay, setDriversDisplay] = useState<string[]>(["Loading..."]);
    const [currentDriverIndex, setDriverIndex] = useState<number>(0);
    const [driverChosenVal, setDriverChosen] = useState<string>("Loading...");
    const [gridKey, setGridKey] = useState(0);

    const setLapLoadData = useStore((state) => state.setLapLoadData);
    
    const router = useRouter();
    const pathname = usePathname();
    const basePath = pathname.split("/")[1];


    const params = useParams();
    const year = params.year as string;
    const round = decodeURIComponent(params.round as string);
    const session = decodeURIComponent(params.session as string);

    useEffect(() => {
      const fetchLaps = async () => {
        try {
            const sessionData = await fetchSessionData(year, round, session);

            let lapsData = sessionData.allLapsData;
            let driverData = sessionData.driversData;

            console.log(lapsData);
            console.log(driverData);

            let calculatePositions = true;

            for (let i = 0; i < driverData.length; i++)
            {
                if (driverData[i].position != -1)
                {
                    calculatePositions = false;
                }
            }

            console.log(calculatePositions);

            let driverPositionsEach = [];

            if (calculatePositions)
            {
                let minLapTime = [];
                for (let i = 0; i < lapsData.length; i++)
                {
                    let currentMinLap = 999;
                    for (let j = 0; j < lapsData[i].length; j++)
                    {
                        let lap = lapsData[i][j];
                        if (!lap.deleted && lap.lapTime != -1)
                        {
                            if (lap.lapTime < currentMinLap)
                            {
                                currentMinLap = lap.lapTime;
                            }
                        }
                    }
                    minLapTime.push([currentMinLap, i]);
                }

                minLapTime.sort((a, b) => a[0] - b[0]);

                console.log(minLapTime);

                for (let i = 0; i < minLapTime.length; i++)
                {
                    driverData[minLapTime[i][1]].position = i + 1;
                    driverPositionsEach.push(minLapTime[i][1]);
                }
            }
            else
            {
                for (let i = 0; i < driverData.length; i++)
                {
                    driverPositionsEach.push(-1);
                }
                for (let i = 0; i < driverData.length; i++)
                {
                    driverPositionsEach[driverData[i].position - 1] = i;
                }
            }

            console.log(driverData);
            console.log(driverPositionsEach);

            let driversDesc = [];

            for (let i = 0; i < driverPositionsEach.length; i++)
            {
                driversDesc.push(`${i + 1}) ${driverData[driverPositionsEach[i]].firstName} ${driverData[driverPositionsEach[i]].lastName}`);
            }

            if (driverPositionsEach.length > 0)
            {
                setDriverChosen(`1) ${driverData[driverPositionsEach[0]].firstName} ${driverData[driverPositionsEach[0]].lastName}`);
            }

            console.log(driversDesc);

            setLapsData(lapsData);
            setDriversData(driverData);
            setDriverPositions(driverPositionsEach);
            setDriversDisplay(driversDesc);
        } catch (error) {
          console.error("Error fetching pit performance data:", error);
        }
      };
  
      fetchLaps();
    }, []);



    
    const handleDriverChange = (event: React.SyntheticEvent, value: any) => {
        setDriverIndex(driversDisplay.indexOf(value));
        setGridKey(gridKey + 1);
        if (value !== null) setDriverChosen(value);
    };

    const formatLapTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
        return `${minutes}:${formattedSeconds}`;
    };
    
    const columns: GridColDef[] = [
        {
            field: 'lapNumber',
            headerName: 'Lap Number',
            width: 130,
            disableColumnMenu: true,
            renderCell: (params) => {
                const row = params.row as LapData;
                return (
                    row.lapNumber
                );
            },
        },
        {
            field: 'lapTime',
            headerName: 'Lap Time',
            width: 110,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == 9999 ? "nan" : formatLapTime(params),
        },
        {
            field: 'sector1Time',
            headerName: 'Sector 1',
            width: 100,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'),
        },
        {
            field: 'sector2Time',
            headerName: 'Sector 2',
            width: 102,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'),
        },
        {
            field: 'sector3Time',
            headerName: 'Sector 3',
            width: 102,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'),
        },
        {
            field: 'compound',
            headerName: 'Compound',
            width: 120,
            disableColumnMenu: true,
        },
        {
            field: 'tyreLife',
            headerName: 'Tyre Age',
            width: 105,
            disableColumnMenu: true,
        },
        {
            field: 'isAccurate',
            headerName: 'Accurate',
            width: 110,
            disableColumnMenu: true,
            renderCell: (params) => {
                const isAccurate = params.row.isAccurate;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        {isAccurate ? (
                            <CheckIcon style={{ color: 'green' }} />
                        ) : (
                            <CloseIcon style={{ color: 'red' }} />
                        )}
                    </div>
                );
            },
        },
        {
            field: 'isChecked',
            headerName: 'Selected',
            width: 75,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const row = params.row as LapData;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Checkbox
                            checked={row.isChecked}
                            onChange={(event) => {
                                const newLapsData = [...lapsData];
                                newLapsData[driverPositions[currentDriverIndex]][row.lapNumber - 1].isChecked = event.target.checked;

                                setLapsData(newLapsData);
                            }}
                        >
                        </Checkbox>
                    </div>
                );
            },
        },
    ];

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 2,
                        justifyContent: "center",
                        alignItems: "center",
                        mb: 2,
                    }}
                >
                    <Button
                        onClick={
                            (event) => {
                                let lapsDataLoad: LapMetadata[] = [];

                                for (let i = 0; i < lapsData.length; i++)
                                {
                                    for (let j = 0; j < lapsData[i].length; j++)
                                    {
                                        console.log(i);
                                        console.log(j);
                                        if (lapsData[i][j].isChecked)
                                        {
                                            if (lapsData[i][j].isChecked == true)
                                            {
                                                lapsDataLoad.push(
                                                    new LapMetadata(
                                                        year,
                                                        round,
                                                        session,
                                                        driversData[i].firstName + " " + driversData[i].lastName,
                                                        lapsData[i][j].lapNumber,
                                                        lapsData[i][j].lapTime,
                                                        driverPositions.indexOf(i) + 1,
                                                        driversData[i].teamColour
                                                    )
                                                );
                                            }
                                        }
                                    }
                                }

                                // year: string;
                                // round: string;
                                // session: string;
                                // driver: string;
                                // lapNumber: number;
                                // lapTime: number;
                                // position: number;
                                // colour: string;

                                //setLapLoadData

                                console.log(lapsDataLoad);

                                setLapLoadData(lapsDataLoad);

                                router.push(`/${basePath}`);
                            }
                        }
                    >
                        Add Laps
                    </Button>
                    <Tabs
                        value={driverChosenVal}
                        onChange={handleDriverChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{mb:2}}
                    >
                        {driversDisplay.map((driver) => (
                            <Tab key={driver} label={driver} value={driver} />
                        ))}
                    </Tabs>
                </Box>
                <DataGrid
                    key={gridKey}
                    rows={lapsData[driverPositions[currentDriverIndex]].map((row, index) => ({ ...row, id: index }))}
                    columns={columns}
                    disableRowSelectionOnClick
                    rowHeight={40}
                    sx={{
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#000000',  // Dark grey background
                            color: '#fff',  // White text color for contrast
                        },
                    }}
                />
            </Box>
        </ThemeProvider>
    );
};

export default LapTimesChart;
