import React, { useEffect, useRef, useState } from "react";
import { LapData } from "../../classes/lapData";
import { DriverData } from "../../classes/driverData";
import { Box, Button, Checkbox, Tab, Tabs } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { LiveDriver, LiveLapData } from "../../utils/fetchLiveData";

type ChooseLapsProps = {
    laps: Record<number, LiveLapData[]>;
    drivers: Record<number, LiveDriver>;
    positions: number[];
    onChoose: (lap?: LiveLapData, driver?: LiveDriver) => void;
    isCheckbox: boolean;
};



const ChooseLaps: React.FC<ChooseLapsProps> = ({ laps, drivers, positions, onChoose, isCheckbox }) => {
    const [driversDisplay, setDriversDisplay] = useState<string[]>(["Loading..."]);
    const [currentDriverIndex, setDriverIndex] = useState<number>(1);
    const [lapsData, setLapsData] = useState<Record<number, LiveLapData[]>>(laps);
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
        if (isCheckbox) {
            onChoose();
        }
    }, [lapsData])


    useEffect(() => {
        const fetchLaps = async () => {
            try {
                let driverData = drivers;

                let driversDesc = [];

                for (let i = 0; i < positions.length; i++) {
                    driversDesc.push(`${i + 1}) ${driverData[positions[i]].driver}`);
                }

                setLapsData(lapsData);
                setDriversDisplay(driversDesc);
                if (driverChosenVal == "Loading...") {
                    setDriverChosen(driversDesc[0]);
                }
                else {
                    let driverText = driverChosenVal.split(") ")[1];
                    for (let i = 0; i < driversDesc.length; i++) {
                        if (driversDesc[i].includes(driverText)) {
                            setDriverChosen(driversDesc[i]);
                            setDriverIndex(i);
                            // setDriverIndex()
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching pit performance data:", error);
            }
        };

        fetchLaps();
    }, [positions]);

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
            const newLapsData = [...lapsData[positions[currentDriverIndex]]];
            const isChecked = newLapsData.map((x) => x.isChecked);
            if (isChecked.includes(true)) {
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
            let finishedLap = { ...lapsData };
            finishedLap[positions[currentDriverIndex]] = newLapsData;
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
            field: 's1',
            headerName: 'Sector 1',
            width: 100,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'),
        },
        {
            field: 's2',
            headerName: 'Sector 2',
            width: 102,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == 9999 ? "nan" : params.toFixed(3).padStart(6, '0'),
        },
        {
            field: 's3',
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
            field: 'tyreAge',
            headerName: 'Tyre Age',
            width: 105,
            disableColumnMenu: true,
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
                                const newLapsData = { ...lapsData };
                                let index = newLapsData[positions[currentDriverIndex]].map((x) => x.lapNumber).indexOf(row.lapNumber);
                                newLapsData[positions[currentDriverIndex]][index].isChecked = event.target.checked;

                                if (shiftPressed.current && lastChangeIndex != -1) {
                                    console.log("SHIFT PRESSED");

                                    if (lastChangeIndex > index) {
                                        for (let i = index; i < lastChangeIndex; i++) {
                                            console.log(i);
                                            newLapsData[positions[currentDriverIndex]][i].isChecked = true;
                                        }
                                    }
                                    else {
                                        for (let i = lastChangeIndex; i < index; i++) {
                                            console.log(i);
                                            newLapsData[positions[currentDriverIndex]][i].isChecked = true;
                                        }
                                    }
                                }

                                setLapsData(newLapsData);

                                setLastChangeIndex(index);
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
                                    const newLapsData = { ...lapsData };
                                    let index = newLapsData[positions[currentDriverIndex]].map((x) => x.lapNumber).indexOf(row.lapNumber);
                                    newLapsData[positions[currentDriverIndex]][index].isLoaded = !newLapsData[positions[currentDriverIndex]][index].isLoaded;

                                    onChoose(laps[positions[currentDriverIndex]][index], drivers[positions[currentDriverIndex]]);

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
                rows={lapsData[positions[currentDriverIndex]].map((row, index) => ({ ...row, id: index }))}
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
