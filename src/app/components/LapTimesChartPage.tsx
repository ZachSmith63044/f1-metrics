"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, ThemeProvider, CssBaseline, Tab, Tabs, Checkbox, ToggleButtonGroup, ToggleButton, Button, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Snackbar, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { LapData } from "../classes/lapData";
import { DriverData } from "../classes/driverData";
import darkTheme from "../theme";
import Navbar from "../components/Navbar";
import { fetchSessionData } from "../utils/fetchSessionData";
import { useParams, useRouter } from "next/navigation";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDocs, collection, QueryDocumentSnapshot, DocumentData, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";


interface DriverLapData {
    driver: DriverData;
    laps: LapData[];
}

interface DriverLapDataSingle {
    driver: DriverData;
    lap: LapData;
}

interface DriverDataLegend {
    driverName: string;
    teamColour: string;
    isDashed: boolean;
    position: number;
}

interface Props {
    yearURL: string;
    roundURL: string;
    sessionURL: string;
    uidURL: string | undefined;
    fileURL: string | undefined;
}

const LapTimesChartPage: React.FC<Props> = ({ yearURL, roundURL, sessionURL, uidURL, fileURL }) => {
    const [lapsData, setLapsData] = useState<LapData[][]>([[]]);
    const [driversData, setDriversData] = useState<DriverData[]>([new DriverData("Loading", "...", "Loading...", "#000000", 1, -1, -1, -1, 0, -1, 0, "Loading...")]);
    const [driverPositions, setDriverPositions] = useState<number[]>([0]); // [0] contains index of first place
    const [driversDisplay, setDriversDisplay] = useState<string[]>(["Loading..."]);
    const [currentDriverIndex, setDriverIndex] = useState<number>(0);
    const [driverChosenVal, setDriverChosen] = useState<string>("Loading...");
    const [gridKey, setGridKey] = useState(0);
    const [driverDataLegend, setDriverDataLegend] = useState<DriverDataLegend[]>([]);
    
    const router = useRouter();

    const user = getAuth().currentUser;

    const [saveOpen, setSaveOpen] = useState<boolean>(false);
    const [loadOpen, setLoadOpen] = useState<boolean>(false);

    const [savedFiles, setSavedFiles] = useState<QueryDocumentSnapshot<DocumentData, DocumentData>[]>([]);

    const [saveName, setSaveName] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<string>('');

    const [lineDataLapNumber, setLineDataLapNumber] = useState<DriverLapData[]>([]);
    const [lineDataTyreAge, setLineDataTyreAge] = useState<DriverLapData[]>([]);

    const [minLapTime, setMinLapTime] = useState<number>(90);
    const [maxLapTime, setMaxLapTime] = useState<number>(100);

    const [minLapNumber, setMinLapNumber] = useState<number>(1);
    const [maxLapNumber, setMaxLapNumber] = useState<number>(78);

    const [minTyreAge, setMinTyreAge] = useState<number>(1);
    const [maxTyreAge, setMaxTyreAge] = useState<number>(78);

    const [graphKey, setGraphKey] = useState<number>(0);

    

    const [lastChangeIndex, setLastChangeIndex] = useState(-1);

    const [pageType, setPageType] = useState<"data" | "chart">("data");
    const [xAxisType, setXAxisType] = useState<"lap number" | "tyre age">("lap number");
    const [yAxisType, setYAxisType] = useState<"lap time" | "position">("lap time");
    const [dotsShown, setDotsShown] = useState<"all" | "some" | "none">("all");

    const compoundColours: { [key: string]: string } = {"SOFT": "red", "MEDIUM": "yellow", "HARD": "lightgrey"};

    
    const fetchSavedFiles = async () => {
        const lapsRef = collection(db, `users/${user!.uid}/lapTimesChart`);
        const snapshot = await getDocs(lapsRef);

        console.log(snapshot.docs);
        
        setSavedFiles(snapshot.docs);

        if (snapshot.docs.length > 0)
        {
            setSelectedFile(snapshot.docs[0].id);
            setLoadOpen(true);
        }
    }


    const [open, setOpen] = useState(false);
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(encodeURI(`f1-metrics.com/lapTimesChart/${yearURL}/${roundURL}/${sessionURL}/${user!.uid}/${saveName}`));
            setOpen(true);
            console.log('copied!');
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };


    const initialLoad = async (lapsData: LapData[][]) => {
        if (uidURL != undefined && fileURL != undefined)
        {
            setSaveName(fileURL);
            let docData = (await getDoc(doc(collection(db, `users/${uidURL}/lapTimesChart`), fileURL))).data();
            
            let data = docData!["data"];

            for (let i = 0; i < Object.keys(data).length; i++)
            {
                for (let j = 0; j < data[i].length; j++)
                {
                    lapsData[i][j].isChecked = data[i][j];
                }
            }

            setLapsData(lapsData);
            setGridKey(gridKey + 1);

            setXAxisType(docData!["xAxis"]);
            setYAxisType(docData!["yAxis"]);
            setDotsShown(docData!["dots"]);
        }
    }


    const saveData = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries((formData as any).entries());
        const fileName = formJson.fileName;
        
        console.log(fileName);

        let bools: Record<number, any> = {};

        for (let i = 0; i < lapsData.length; i++)
        {
            let boolsIn = [];
            for (let j = 0; j < lapsData[i].length; j++)
            {
                boolsIn.push(lapsData[i][j].isChecked == true);
            }
            bools[i] = boolsIn;
        }

        console.log(bools);

        const saveData = {
            "year": yearURL,
            "round": roundURL,
            "session": sessionURL,
            "data": bools,
            "xAxis": xAxisType,
            "yAxis": yAxisType,
            "dots": dotsShown,
        };

        setDoc(doc(collection(db, `users/${user!.uid}/lapTimesChart`), fileName), saveData);

        setSaveName(fileName);
        setSaveOpen(false);
    }
    
    const chartPressed = () => {
        console.log("CHART PRESSED");

        let lineLapNumberData: DriverLapData[] = [];
        let lineTyreAgeData: DriverLapData[] = [];

        let legendData: DriverDataLegend[] = [];

        let minLapTime = 999;
        let maxLapTime = 0;

        let minLapNumber = 999;
        let maxLapNumber = 0;
        let minTyreAge = 999;
        let maxTyreAge = 0;

        for (let i = 0; i < lapsData.length; i++)
        {
            let currentDriverLapData: DriverLapData = {driver: driversData[i], laps: []};
            let currentDriverLapNumberData: DriverLapData = {driver: driversData[i], laps: []};
            for (let j = 0; j < lapsData[i].length; j++)
            {
                if (lapsData[i][j].isChecked)
                {
                    currentDriverLapData.laps.push(lapsData[i][j]);
                    currentDriverLapNumberData.laps.push(lapsData[i][j]);
                    if (maxLapTime < lapsData[i][j].lapTime)
                    {
                        maxLapTime = lapsData[i][j].lapTime;
                    }
                    if (minLapTime > lapsData[i][j].lapTime)
                    {
                        minLapTime = lapsData[i][j].lapTime;
                    }

                    if (maxLapNumber < lapsData[i][j].lapNumber)
                    {
                        maxLapNumber = lapsData[i][j].lapNumber;
                    }
                    if (minLapNumber > lapsData[i][j].lapNumber)
                    {
                        minLapNumber = lapsData[i][j].lapNumber;
                    }

                    if (maxTyreAge < lapsData[i][j].tyreLife)
                    {
                        maxTyreAge = lapsData[i][j].tyreLife;
                    }
                    if (minTyreAge > lapsData[i][j].tyreLife)
                    {
                        minTyreAge = lapsData[i][j].tyreLife;
                    }
                }
                else
                {
                    if (currentDriverLapData.laps.length != 0)
                    {
                        lineTyreAgeData.push(currentDriverLapData);
                        currentDriverLapData = {driver: driversData[i], laps: []};
                    }
                }
            }
            if (currentDriverLapData.laps.length != 0)
            {
                lineTyreAgeData.push(currentDriverLapData);
            }
            if (currentDriverLapNumberData.laps.length != 0)
            {
                lineLapNumberData.push(currentDriverLapNumberData);
                legendData.push({ driverName: driversData[i].firstName + " " + driversData[i].lastName, teamColour: driversData[i].teamColour, isDashed: false, position: driversData[i].position });
            }
        }

        console.log(lineTyreAgeData);
        console.log(lineLapNumberData);

        setLineDataLapNumber(lineLapNumberData);
        setLineDataTyreAge(lineTyreAgeData);
        setDriverDataLegend(legendData);

        minLapTime = Math.floor(minLapTime);
        maxLapTime = Math.ceil(maxLapTime);

        setMinLapTime(minLapTime);
        setMaxLapTime(maxLapTime);
        setMinLapNumber(minLapNumber);
        setMaxLapNumber(maxLapNumber);
        setMinTyreAge(minTyreAge);
        setMaxTyreAge(maxTyreAge);
    };
    
    const handlePageChange = (_event: React.MouseEvent<HTMLElement>, newValue: "data" | "chart") => {
        if (newValue == "chart")
        {
            chartPressed();
        }
        if (newValue !== null) setPageType(newValue);
    };
    
    const handleXAxisChange = (_event: React.MouseEvent<HTMLElement>, newValue: "lap number" | "tyre age") => {
        if (newValue !== null) setXAxisType(newValue);
    };
    const handleYAxisChange = (_event: React.MouseEvent<HTMLElement>, newValue: "lap time" | "position") => {
        if (newValue !== null) setYAxisType(newValue);
    };
    const handleDotsChange = (_event: React.MouseEvent<HTMLElement>, newValue: "all" | "some" | "none") => {
        if (newValue !== null) setDotsShown(newValue);
    };


    const params = useParams();
    const year = yearURL;
    const round = roundURL;
    const session = sessionURL;

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

            initialLoad(lapsData);
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

                                if (shiftPressed.current && lastChangeIndex != -1) {
                                    console.log("SHIFT PRESSED");

                                    if (lastChangeIndex > row.lapNumber - 1)
                                    {
                                        for (let i = row.lapNumber - 1; i < lastChangeIndex; i++)
                                        {
                                            console.log(i);
                                            newLapsData[driverPositions[currentDriverIndex]][i].isChecked = true;
                                        }
                                    }
                                    else
                                    {
                                        for (let i = lastChangeIndex; i < row.lapNumber; i++)
                                        {
                                            console.log(i);
                                            newLapsData[driverPositions[currentDriverIndex]][i].isChecked = true;
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
        },
    ];


    const handleHeaderClick = (field: string) => {
        // Handle the header click for the 'Selected' column
        if (field === 'isChecked') {
            // Select all laps
            const newLapsData = [...lapsData[driverPositions[currentDriverIndex]]];
            const isChecked = newLapsData.map((x) => x.isChecked);
            if (isChecked.includes(true))
            {
                if (isChecked.includes(false))
                {
                    // select all laps
                    for (let i = 0; i < newLapsData.length; i++)
                    {
                        newLapsData[i].isChecked = true;
                    }
                }
                else
                {
                    // deselect all laps
                    for (let i = 0; i < newLapsData.length; i++)
                    {
                        newLapsData[i].isChecked = false;
                    }
                }
            }
            else
            {
                // select quicklaps
                for (let i = 0; i < newLapsData.length; i++)
                {
                    if (newLapsData[i].isAccurate)
                    {
                        newLapsData[i].isChecked = true;
                    }
                }
            }
            let finishedLap = [...lapsData];
            finishedLap[driverPositions[currentDriverIndex]] = newLapsData;
            setLapsData(finishedLap);
        }
    };


    const getStartPosition = (position: number) => {
        let val = "";
        for (let i = 0; i < lapsData.length; i++)
        {
            if (lapsData[i].length > 0)
            {
                if (lapsData[i][0].position == position)
                {
                    val = `${position}) ${driversData[i].lastName.slice(0, 3).toUpperCase()}`
                }
            }
        }
        return val;
    };


    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: number }) => {
        if (active && payload && payload.length && label) {
            console.log(label);
            let lapDatas: DriverLapDataSingle[] = [];
            for (let i = 0; i < lineDataLapNumber.length; i++)
            {
                for (let j = 0; j < lineDataLapNumber[i].laps.length; j++)
                {       
                    if ((xAxisType == "lap number" ? lineDataLapNumber[i].laps[j].lapNumber : lineDataLapNumber[i].laps[j].tyreLife) == label)
                    {
                        lapDatas.push({driver: lineDataLapNumber[i].driver, lap: lineDataLapNumber[i].laps[j]});
                    }
                }
            }
            return (
                <div style={{
                    background: "#333", // Dark grey background
                    color: "#fff", // White text for contrast
                    padding: "10px",
                    border: "1px solid #555",
                    borderRadius: "5px",
                    boxShadow: "0px 0px 5px rgba(0,0,0,0.4)"
                }}>
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>{xAxisType == "lap number" ? "Lap" : "Tyre Age:"} {label}</p> {/* Shows hovered lap number */}
                    {lapDatas.map((entry, index) => {
                        return (
                            <div key={index} style={{ marginBottom: "5px" }}>
                                <p style={{ fontWeight: "bold", color: `${entry.driver.teamColour}`, margin: 0 }}>
                                    {entry.driver.lastName}
                                </p>
                                <p style={{ margin: "2px 0" }}>Lap Time: {formatLapTime(entry.lap.lapTime)}</p>
                                <p style={{ margin: "2px 0" }}>
                                    Tyre: <span style={{ color: compoundColours[entry.lap.compound], fontWeight: "600" }}>{entry.lap.compound}{xAxisType == "lap number" ? ` (${entry.lap.tyreLife})` : ""}</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return null;
    };

    const legendColumns: GridColDef[] = [
        {
            field: "driverName",
            headerName: 'Driver Name',
            width: 160,
            disableColumnMenu: true,
        },
        {
            field: "teamColour",
            headerName: "Legend",
            width: 100,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <Button onClick={
                    (event) => {
                        let newDriverData = [...driverDataLegend];
                        for (let i = 0; i < newDriverData.length; i++)
                        {
                            if (newDriverData[i].driverName == params.row.driverName)
                            {
                                newDriverData[i].isDashed = !newDriverData[i].isDashed;
                            }
                        }
                        setDriverDataLegend(newDriverData);
                        setGraphKey(graphKey + 1);
                    }
                }>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', height: '100%' }}>
                        <svg width="70" height="6">
                            <line
                                x1="0" // Start the line a little from the left to leave some space
                                y1="3" // Center vertically
                                x2="85" // End the line a little from the right to leave some space
                                y2="3" // Keep the line centered vertically
                                stroke={params.row.teamColour || 'green'} // Dynamic stroke color
                                strokeWidth="4" // Line width
                                strokeDasharray={params.row.isDashed ? "5,5" : "0"} // Dashed condition
                            />
                        </svg>
                    </div>
                </Button>
            ),
        },
        {
            field: "position",
            headerName: "Position",
            width: 110,
            disableColumnMenu: true,
            valueFormatter: (params: number) => params == -1 ? "nan" : params,
        },
    ];


    const handleFileChange = (event: SelectChangeEvent<string>) => {
        setSelectedFile(event.target.value); // Update selected file ID
    };
    

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />


            <Snackbar
                open={open}
                autoHideDuration={3000}
                onClose={() => setOpen(false)}
                message="Copied to clipboard!"
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />


            {/* DIALOGS */}

            <Dialog
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                slotProps={{
                    paper: {
                        component: 'form',
                        onSubmit: saveData
                        //     {
                        
                        // const formData = new FormData(event.currentTarget);
                        // const formJson = Object.fromEntries((formData as any).entries());
                        // const fileName = formJson.fileName;
                        // console.log(fileName);

                        // let data = [];

                        // for (let i = 0; i < lapsMetadata.length; i++)
                        // {
                        //     let map = lapsMetadata[i].toMap();
                        //     map["colour"] = driverDataLegend[i].teamColour;
                        //     map["dashed"] = driverDataLegend[i].isDashed;
                        //     data.push(map);
                        // }

                        // setDoc(doc(db, `users/${user!.uid}/speedDistance`, fileName), {"data": data});

                        // console.log(data);

                        // setSaveOpen(false);
                        // setSaveName(fileName);
                        // },
                    },
                }}
            >
                <DialogTitle fontWeight={"bold"}>Save to user</DialogTitle>
                <DialogContent>
                <DialogContentText>
                    To save your current analysis give it a name (e.g. "2025 Japan Qualifying").
                </DialogContentText>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="name"
                    name="fileName"
                    label="File Name"
                    fullWidth
                    variant="standard"
                    defaultValue={saveName}
                />
                </DialogContent>
                <DialogActions>
                <Button onClick={() => setSaveOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
                </DialogActions>
            </Dialog>
            
            <Dialog
                open={loadOpen}
                onClose={() => setLoadOpen(false)}
                slotProps={{
                    paper: {
                    component: 'form',
                    onSubmit: (event: React.FormEvent<HTMLFormElement>) => 
                    {
                        event.preventDefault();
                        router.push(`/lapTimesChart/${yearURL}/${roundURL}/${sessionURL}/${user!.uid}/${selectedFile}`);
                    },
                    },
                }}
                >
                <DialogTitle fontWeight={"bold"}>Load from user</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={"14px"}>
                    Select the analysis you want to load.
                    </DialogContentText>

                    <FormControl fullWidth variant="standard" required>
                    <InputLabel id="file-select-label">File Name</InputLabel>
                    <Select
                        labelId="file-select-label"
                        value={selectedFile}
                        onChange={handleFileChange}
                        label="File Name"
                    >
                        {savedFiles.map((docSnapshot) => {
                        // Extract document ID or any other field you want to display from Firestore document
                        const fileId = docSnapshot.id;
                        return (
                            <MenuItem key={fileId} value={fileId}>
                            {fileId} {/* Or display any specific field from docSnapshot.data() */}
                            </MenuItem>
                        );
                        })}
                    </Select>
                    </FormControl>

                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setLoadOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button type="submit">Load</Button>
                </DialogActions>
            </Dialog>


            {
                (pageType == "data") ?
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
                        <ToggleButtonGroup
                            value={pageType}
                            exclusive
                            onChange={handlePageChange}
                            sx={{
                                mb: 1,
                                border: "1px solid #AAAAAA",
                                "& .MuiToggleButton-root": {
                                    border: "1px solid #AAAAAA",
                                    "&.Mui-selected": {
                                        border: "1px solid #AAAAAA",
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="data">Data</ToggleButton>
                            <ToggleButton value="chart">Chart</ToggleButton>
                        </ToggleButtonGroup>
                        <Button
                            onClick={
                                (event) => {
                                    let newLapsData = [...lapsData];
                                    for (let i = 0; i < newLapsData.length; i++)
                                    {
                                        for (let j = 0; j < newLapsData[i].length; j++)
                                        {
                                            newLapsData[i][j].isChecked = true;
                                        }
                                    }
                                    setLapsData(newLapsData);
                                }
                            }
                        >
                            SELECT ALL LAPS
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
                :
                <Box sx={{ p: 2, height: "calc(100vh - 90px)" }}>
                    <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        width="auto"
                        gap={2}
                        mb={2}
                    >
                        <ToggleButtonGroup
                            value={pageType}
                            exclusive
                            onChange={handlePageChange}
                            sx={{
                                mb: 1,
                                border: "1px solid #AAAAAA",
                                "& .MuiToggleButton-root": {
                                    border: "1px solid #AAAAAA",
                                    "&.Mui-selected": {
                                        border: "1px solid #AAAAAA",
                                    },
                                },
                            }}
                        >
                            <ToggleButton value="data">Data</ToggleButton>
                            <ToggleButton value="chart">Chart</ToggleButton>
                        </ToggleButtonGroup>

                        <Box display="flex" flexDirection="column" gap={1}>
                            {
                                user != null && (
                                    <Button sx={{ ml: "8px" }} onClick={(event) => {setSaveOpen(true)}}>
                                        Save to user
                                    </Button>
                                )
                            }
                            {
                                user != null && (
                                    <Button sx={{ ml: "8px" }} onClick={(event) => {fetchSavedFiles()}}>
                                        Load from user
                                    </Button>
                                )
                            }
                            {                  
                                saveName != "" && (
                                    <Button sx={{ ml: "8px" }} onClick={(event) => {
                                        copyToClipboard();
                                    }}>
                                        Copy link
                                    </Button>
                                )
                            }
                        </Box>
                        
                        <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" marginBottom={1.1}>X Axis:</Typography>
                                <ToggleButtonGroup
                                    value={xAxisType}
                                    exclusive
                                    onChange={handleXAxisChange}
                                    sx={{
                                        mb: 1,
                                        border: "1px solid #AAAAAA",
                                        "& .MuiToggleButton-root": {
                                            border: "1px solid #AAAAAA",
                                            "&.Mui-selected": {
                                                border: "1px solid #AAAAAA",
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="lap number">Lap Number</ToggleButton>
                                    <ToggleButton value="tyre age">Tyre Age</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" marginBottom={1.1}>Y Axis:</Typography>
                                <ToggleButtonGroup
                                    value={yAxisType}
                                    exclusive
                                    onChange={handleYAxisChange}
                                    sx={{
                                        mb: 1,
                                        border: "1px solid #AAAAAA",
                                        "& .MuiToggleButton-root": {
                                            border: "1px solid #AAAAAA",
                                            "&.Mui-selected": {
                                                border: "1px solid #AAAAAA",
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="lap time">Lap Time</ToggleButton>
                                    <ToggleButton value="position">Position</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" marginBottom={1.1}>Dots Shown: </Typography>
                                <ToggleButtonGroup
                                    value={dotsShown}
                                    exclusive
                                    onChange={handleDotsChange}
                                    sx={{
                                        mb: 1,
                                        border: "1px solid #AAAAAA",
                                        "& .MuiToggleButton-root": {
                                            border: "1px solid #AAAAAA",
                                            "&.Mui-selected": {
                                                border: "1px solid #AAAAAA",
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="all">All</ToggleButton>
                                    <ToggleButton value="some">Some</ToggleButton>
                                    <ToggleButton value="none">None</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Box>
                        
                        <Box width={375}>
                            <DataGrid
                                style={{ width: 375 }}
                                rows={driverDataLegend.map((row, index) => ({ ...row, id: index }))}
                                columns={legendColumns}
                                disableRowSelectionOnClick
                                rowHeight={40}
                                autoHeight
                                hideFooter={true}
                                sx={{ flexShrink: 0 }}
                            />
                        </Box>
                    </Box>
                    <div style={{ height: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart key={graphKey}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey={xAxisType == "lap number" ? "lapNumber" : "tyreLife"} domain={xAxisType == "lap number" ? [minLapNumber - 1, maxLapNumber + 1] : [minTyreAge - 1, maxTyreAge + 1]} tickCount={xAxisType == "lap number" ? maxLapNumber - minLapNumber + 3 : maxTyreAge - minTyreAge + 3} tick={{ fill: 'white' }} />
                                <YAxis domain={yAxisType == "position" ? [0, lapsData.length + 1] : [minLapTime, maxLapTime]} reversed={yAxisType == "position"} tickCount={yAxisType == "position" ? lapsData.length + 2 : maxLapTime - minLapTime + 1} tickFormatter={(value) => yAxisType == "position" ? getStartPosition(value) : formatLapTime(value)} tick={{ fill: 'white' }} width={yAxisType == "lap time" ? 70 : 70} />
                                {yAxisType == "position" ? null : <Tooltip content={<CustomTooltip />} />}
                                {
                                    xAxisType == "lap number" ?
                                    lineDataLapNumber.map((driverData) => (
                                        <Line
                                            key={driverData.driver.lastName + driverData.laps[0].lapNumber.toString()}
                                            name={driverData.driver.lastName}
                                            type="linear"
                                            data={driverData.laps}
                                            dataKey={yAxisType == "lap time" ? "lapTime" : "position"}
                                            stroke={driverData.driver.teamColour}
                                            strokeWidth={3}
                                            strokeDasharray={driverDataLegend[driverDataLegend.map((x) => x.driverName).indexOf(driverData.driver.firstName + " " + driverData.driver.lastName)].isDashed ? "8, 8" : "0"}
                                            dot={(props) => {
                                                const { cx, cy, payload } = props;
                                                const compound = payload.compound as string;
                                                const fillColor = Object.keys(compoundColours).includes(compound)
                                                    ? compoundColours[compound]
                                                    : "#FFFFFF";
                                                const lapIndex = driverData.laps.map((x) => x.lapNumber).indexOf(payload.lapNumber);
                                                // const driverInd = driversData.map((x) => x.firstName + " " + x.lastName).indexOf(driverData.driver.firstName + " " + driverData.driver.lastName);
                                                let isFirst = false;
                                                if (lapIndex == 0)
                                                {
                                                    isFirst = true;
                                                }
                                                else
                                                {
                                                    if (driverData.laps[lapIndex - 1].stint != driverData.laps[lapIndex].stint)
                                                    {
                                                        isFirst = true;
                                                    }
                                                }

                                                return (
                                                    <circle
                                                        key={`${driverData.driver.lastName}-${payload.lapNumber}`}
                                                        cx={cx}
                                                        cy={cy}
                                                        r={dotsShown == "all" ? 8 : dotsShown == "some" ? isFirst ? 8 : 0 : 0}
                                                        stroke={driverData.driver.teamColour}
                                                        strokeWidth={3}
                                                        fill={fillColor}
                                                    />
                                                );
                                            }}
                                            activeDot={{
                                                r: 0
                                            }}
                                        />
                                    )
                                )
                                :
                                lineDataTyreAge.map((driverData) => (
                                    <Line
                                        key={driverData.driver.lastName + driverData.laps[0].lapNumber.toString()}
                                        name={driverData.driver.lastName}
                                        type="linear"
                                        data={driverData.laps}
                                        dataKey={yAxisType == "lap time" ? "lapTime" : "position"}
                                        stroke={driverData.driver.teamColour}
                                        strokeWidth={3}
                                        dot={(props) => {
                                            const { cx, cy, payload } = props;
                                            const compound = payload.compound as string;
                                            const fillColor = Object.keys(compoundColours).includes(compound)
                                                ? compoundColours[compound]
                                                : "#FFFFFF";
                                            const lapIndex = driverData.laps.map((x) => x.lapNumber).indexOf(payload.lapNumber);
                                            // const driverInd = driversData.map((x) => x.firstName + " " + x.lastName).indexOf(driverData.driver.firstName + " " + driverData.driver.lastName);
                                            let isFirst = false;
                                            if (lapIndex == 0)
                                            {
                                                isFirst = true;
                                            }
                                            else
                                            {
                                                if (driverData.laps[lapIndex - 1].stint != driverData.laps[lapIndex].stint)
                                                {
                                                    isFirst = true;
                                                }
                                            }

                                            return (
                                                <circle
                                                    key={`${driverData.driver.lastName}-${payload.lapNumber}`}
                                                    cx={cx}
                                                    cy={cy}
                                                    r={dotsShown == "all" ? 8 : dotsShown == "some" ? isFirst ? 8 : 0 : 0}
                                                    stroke={driverData.driver.teamColour}
                                                    strokeWidth={3}
                                                    fill={fillColor}
                                                />
                                            );
                                        }}
                                        activeDot={{
                                            r: 0
                                        }}
                                    />
                                )
                            )
                            }
                            </LineChart>
                        </ResponsiveContainer>
                        
                    </div>
                </Box>
            }
            
        </ThemeProvider>
    );
};

export default LapTimesChartPage;
