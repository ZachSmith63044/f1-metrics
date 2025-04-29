import React, { useEffect, useRef, useState } from "react";
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import { Box, Button, Checkbox, Tab, Tabs } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

type ChooseLapsProps = {
    laps: LapData[][];
    driversData: DriverData[];
    onChoose: (lap?: LapData, driver?: DriverData) => void;
    isCheckbox: boolean;
};



const ChooseLaps: React.FC<ChooseLapsProps> = ({ laps, driversData, onChoose, isCheckbox }) => {
    const [driversDisplay, setDriversDisplay] = useState<string[]>(["Loading..."]);
    const [currentDriverIndex, setDriverIndex] = useState<number>(0);
    const [lapsData, setLapsData] = useState<LapData[][]>(laps);
    const [gridKey, setGridKey] = useState(0);

    const [driverChosenVal, setDriverChosen] = useState<string>("Loading...");
    const [lastChangeIndex, setLastChangeIndex] = useState(-1);
    const shiftPressed = useRef(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Shift") shiftPressed.current = true;
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === "Shift") shiftPressed.current = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useEffect(() => {
        console.log("LAPS CHANGED");
        if (isCheckbox)
        {
            onChoose();
        }
    }, [lapsData])


    useEffect(() => {
        const fetchLaps = async () => {
            try {
                let driverData = driversData;
                console.log(lapsData);
                console.log(driverData);

                let calculatePositions = true;

                for (let i = 0; i < driverData.length; i++) {
                    if (driverData[i].position != -1) {
                        calculatePositions = false;
                    }
                }

                console.log(calculatePositions);

                let driverPositionsEach = [];

                if (calculatePositions) {
                    let minLapTime = [];
                    for (let i = 0; i < lapsData.length; i++) {
                        let currentMinLap = 999;
                        for (let j = 0; j < lapsData[i].length; j++) {
                            let lap = lapsData[i][j];
                            if (!lap.deleted && lap.lapTime != -1) {
                                if (lap.lapTime < currentMinLap) {
                                    currentMinLap = lap.lapTime;
                                }
                            }
                        }
                        minLapTime.push([currentMinLap, i]);
                    }

                    minLapTime.sort((a, b) => a[0] - b[0]);

                    console.log(minLapTime);

                    for (let i = 0; i < minLapTime.length; i++) {
                        driverData[minLapTime[i][1]].position = i + 1;
                        driverPositionsEach.push(minLapTime[i][1]);
                    }
                }
                else {
                    for (let i = 0; i < driverData.length; i++) {
                        driverPositionsEach.push(-1);
                    }
                    for (let i = 0; i < driverData.length; i++) {
                        driverPositionsEach[driverData[i].position - 1] = i;
                    }
                }

                console.log(driverData);
                console.log(driverPositionsEach);

                let driversDesc = [];

                for (let i = 0; i < driverPositionsEach.length; i++) {
                    driversDesc.push(`${i + 1}) ${driverData[i].firstName} ${driverData[i].lastName}`);
                }

                if (driverPositionsEach.length > 0) {
                    setDriverChosen(`1) ${driverData[driverPositionsEach[0]].firstName} ${driverData[driverPositionsEach[0]].lastName}`);
                }

                console.log(driversDesc);

                setLapsData(lapsData);
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
        setLastChangeIndex(-1);
        if (value !== null) setDriverChosen(value);
    };



    const handleHeaderClick = (field: string) => {
        // Handle the header click for the 'Selected' column
        if (field === 'isChecked') {
            // Select all laps
            const newLapsData = [...lapsData[currentDriverIndex]];
            const isChecked = newLapsData.map((x) => x.isChecked);
            if (isChecked.includes(true)) {
                if (isChecked.includes(false)) {
                    // select all laps
                    for (let i = 0; i < newLapsData.length; i++) {
                        newLapsData[i].isChecked = true;
                    }
                }
                else {
                    // deselect all laps
                    for (let i = 0; i < newLapsData.length; i++) {
                        newLapsData[i].isChecked = false;
                    }
                }
            }
            else {
                // select quicklaps
                for (let i = 0; i < newLapsData.length; i++) {
                    if (newLapsData[i].isAccurate) {
                        newLapsData[i].isChecked = true;
                    }
                }
            }
            let finishedLap = [...lapsData];
            finishedLap[currentDriverIndex] = newLapsData;
            setLapsData(finishedLap);
        }
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
        isCheckbox ? {
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
                                newLapsData[currentDriverIndex][row.lapNumber - 1].isChecked = event.target.checked;

                                if (shiftPressed.current && lastChangeIndex != -1) {
                                    console.log("SHIFT PRESSED");

                                    if (lastChangeIndex > row.lapNumber - 1) {
                                        for (let i = row.lapNumber - 1; i < lastChangeIndex; i++) {
                                            console.log(i);
                                            newLapsData[currentDriverIndex][i].isChecked = true;
                                        }
                                    }
                                    else {
                                        for (let i = lastChangeIndex; i < row.lapNumber; i++) {
                                            console.log(i);
                                            newLapsData[currentDriverIndex][i].isChecked = true;
                                        }
                                    }
                                }

                                setLapsData(newLapsData);

                                setLastChangeIndex(row.lapNumber - 1);
                            }}
                        >
                        </Checkbox>
                    </div>
                );
            },
        }
        :
        {
            field: 'isChecked',
            headerName: 'Load',
            width: 75,
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const row = params.row as LapData;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Button
                            style={
                                {
                                    color: row.isLoaded == true ? "#00FF00" : ""
                                }
                            }
                            onClick={() => {
                                const newLapsData = [...lapsData];
                                newLapsData[currentDriverIndex][row.lapNumber - 1].isLoaded = !newLapsData[currentDriverIndex][row.lapNumber - 1].isLoaded;

                                onChoose(laps[currentDriverIndex][row.lapNumber - 1], driversData[currentDriverIndex]);

                                console.log("SELECTED");

                                setLapsData(newLapsData);
                        }}
                        >
                            {row.isLoaded == true ? "Deselect" : "Load Lap"}
                        </Button>
                    </div>
                );
            },
        },
    ];


    return (
        <Box>
            <Tabs
                value={driverChosenVal}
                onChange={handleDriverChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
            >
                {driversDisplay.map((driver) => (
                    <Tab key={driver} label={driver} value={driver} />
                ))}
            </Tabs>
            <DataGrid
                key={gridKey}
                rows={lapsData[currentDriverIndex].map((row, index) => ({ ...row, id: index }))}
                columns={columns}
                disableRowSelectionOnClick
                onColumnHeaderClick={(params) => handleHeaderClick(params.field)}
                rowHeight={40}
                sx={{
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#000000',  // Dark grey background
                        color: '#fff',  // White text color for contrast
                    },
                }}
            />
        </Box>
    );
};

export default ChooseLaps;
