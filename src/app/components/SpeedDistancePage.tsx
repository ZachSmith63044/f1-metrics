"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, ThemeProvider, CssBaseline, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { db } from "../firebaseConfig";
import darkTheme from "../theme";
import Navbar from "./Navbar";
import { fetchTelemetryData } from "../utils/fetchTelemetryData";
import { LapMetadata, TelemetryFrame, FullLapData } from "../classes/telemetryData";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useStore } from "../store/store";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, QueryDocumentSnapshot, DocumentData, getDoc } from "firebase/firestore";


interface TelemetryFrameMeta {
    metadata: LapMetadata,
    telemetryFrame: TelemetryFrame
}

interface DriverDataLegend {
    driverName: string;
    teamColour: string;
    isDashed: boolean;
    position: number;
    lapTime: number;
}

interface Props {
    userURL: string | undefined;
    fileURL: string | undefined;
}

const SpeedDistance: React.FC<Props> = ({ userURL, fileURL }) => {
    const router = useRouter();
    
    const user = getAuth().currentUser;

    const [saveOpen, setSaveOpen] = useState<boolean>(false);
    const [loadOpen, setLoadOpen] = useState<boolean>(false);

    const [saveName, setSaveName] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<string>('');
    
    const [driverDataLegend, setDriverDataLegend] = useState<DriverDataLegend[]>([]);
    const [lapsMetadata, setLapsMetadata] = useState<LapMetadata[]>([]);
    const [lapsData, setLapsData] = useState<TelemetryFrame[][]>([]);

    const [minDelta, setMinDelta] = useState<number>(0);
    const [maxDelta, setMaxDelta] = useState<number>(0.1);
    const [minSpeed, setMinSpeed] = useState<number>(0);
    const [maxSpeed, setMaxSpeed] = useState<number>(10);

    const [graphKey, setGraphKey] = useState<number>(0);

    const fullLapData = useStore((state) => state.fullLapData);
    const lapLoadData = useStore((state) => state.lapLoad);
    const setFullLapData = useStore((state) => state.setFullLapData);


    const [open, setOpen] = useState(false);
    const copyToClipboard = async () => {
        try {
          await navigator.clipboard.writeText(encodeURI(`f1-metrics.com/speedDistance/${user!.uid}/${saveName}`));
          setOpen(true);
          console.log('copied!');
        } catch (err) {
          console.error("Failed to copy:", err);
        }
    };
    
    const [savedFiles, setSavedFiles] = useState<QueryDocumentSnapshot<DocumentData, DocumentData>[]>([]);

    const loadData = async () => {
        if (fileURL != undefined && userURL != undefined)
        {
            setSaveName(fileURL);
            let docData = (await getDoc(doc(collection(db, `users/${userURL}/speedDistance`), fileURL))).data();

            let data = docData!["data"];
            let arrData = [];
            for (let i = 0; i < data.length; i++)
            {
                arrData.push([data[i]["year"], data[i]["round"], data[i]["session"], data[i]["driver"], data[i]["lapNumber"], data[i]["lapTime"], data[i]["position"], data[i]["colour"], data[i]["dashed"]]);
            }
            console.log(data);

            fetchLaps(arrData, lapsMetadata, lapsData);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // const saveData = () => {
    //     let laps: FullLapData[] = [];
    //     for (let i = 0; i < lapsData.length; i++)
    //     {
    //         laps.push({ lapMetadata: lapsMetadata[i], lap: lapsData[i] });
    //     }
    // }


    const fetchSavedFiles = async () => {
        const lapsRef = collection(db, `users/${user!.uid}/speedDistance`);
        const snapshot = await getDocs(lapsRef);

        console.log(snapshot.docs);
        
        setSavedFiles(snapshot.docs);

        if (snapshot.docs.length > 0)
        {
            setSelectedFile(snapshot.docs[0].id);
            setLoadOpen(true);
        }
    }


    const loadDataStart = () => {
        let lapsMetadata = [];
        let lapsData = [];
        let dashed = [];
        if (fullLapData.length > 0)
        {
            for (let i = 0; i < fullLapData.length; i++)
            {
                lapsMetadata.push(fullLapData![i].lapMetadata);
                lapsData.push(fullLapData![i].lap);
                dashed.push(false);
            }
            calculateDeltas(lapsMetadata, lapsData, dashed);
        }
        console.log(lapLoadData);
        if (lapLoadData.length > 0)
        {
            let data = [];
            for (let i = 0; i < lapLoadData.length; i++)
            {
                data.push([lapLoadData[i].year, lapLoadData[i].round, lapLoadData[i].session, lapLoadData[i].driver, lapLoadData[i].lapNumber, lapLoadData[i].lapTime, lapLoadData[i].position, lapLoadData[i].colour, false]);
            }

            console.log(data);

            fetchLaps(data, lapsMetadata, lapsData);
        }

        // fetchLaps([["2024", "22) Las Vegas Grand Prix", "Qualifying", "George Russell", 24, 92.312, 1], ["2024", "22) Las Vegas Grand Prix", "Qualifying", "Carlos Sainz", 23, 92.41, 2], ["2024", "22) Las Vegas Grand Prix", "Qualifying", "Pierre Gasly", 24, 92.664, 3]]);
    }

    const calculateDeltas = (lapsMetadata: LapMetadata[], lapsData: TelemetryFrame[][], dashed: boolean[]) => {
        if (lapsData.length > 0)
        {
            let cLapsData = [...lapsData]
            let minLap = 999;
            let ind = 0;
            for (let i = 0; i < lapsMetadata.length; i++)
            {
                if (lapsMetadata[i].lapTime < minLap)
                {
                    minLap = lapsMetadata[i].lapTime;
                    ind = i;
                }
            }

            let comparitorFrames = cLapsData[ind];

            for (let i = 0; i < cLapsData.length; i++)
            {
                let comparisonFrames = cLapsData[i];
                let currentIndex = 0;
                for (let j = 0; j < comparisonFrames.length; j++)
                {
                    for (let k = currentIndex; k < comparitorFrames.length; k++)
                    {
                        if (comparitorFrames[k].relativeDistance > comparisonFrames[j].relativeDistance)
                        {
                            break;
                        }
                        else
                        {
                            currentIndex = k + 0;
                        }
                    }
                    if (currentIndex == comparitorFrames.length - 1)
                    {
                        let delta = lapsMetadata[i].lapTime - lapsMetadata[ind].lapTime;

                        cLapsData[i][j].deltaTime = delta;
                    }
                    else
                    {
                        let currentDist = comparisonFrames[j].relativeDistance;
                        let dist1 = comparitorFrames[currentIndex].relativeDistance;
                        let dist2 = comparitorFrames[currentIndex + 1].relativeDistance;

                        let proportion = (currentDist - dist1)/(dist2 - dist1);

                        let otherTime = proportion * comparitorFrames[currentIndex + 1].time + (1 - proportion) * comparitorFrames[currentIndex].time;

                        let delta = comparisonFrames[j].time - otherTime;

                        cLapsData[i][j].deltaTime = delta;
                    }
                }
            }

            let minDelta: number = 0.1;
            let maxDelta: number = -0.1;

            let minSpeed = 300;
            let maxSpeed = 0;

            for (let i = 0; i < cLapsData.length; i++)
            {
                for (let j = 0; j < cLapsData[i].length; j++)
                {
                    if (minDelta > cLapsData[i][j].deltaTime)
                    {
                        minDelta = cLapsData[i][j].deltaTime;
                    }
                    if (maxDelta < cLapsData[i][j].deltaTime)
                    {
                        maxDelta = cLapsData[i][j].deltaTime;
                    }


                    if (minSpeed > cLapsData[i][j].speed)
                    {
                        minSpeed = cLapsData[i][j].speed;
                    }
                    if (maxSpeed < cLapsData[i][j].speed)
                    {
                        maxSpeed = cLapsData[i][j].speed;
                    }
                }
            }


            minSpeed = Math.floor((minSpeed - 1)/10) * 10;
            maxSpeed = Math.ceil((maxSpeed + 1)/10) * 10;
            
            minDelta = Math.floor(minDelta * 10)/10;
            maxDelta = Math.ceil(maxDelta * 10)/10;

            setMinSpeed(minSpeed);
            setMaxSpeed(maxSpeed);

            setMinDelta(minDelta);
            setMaxDelta(maxDelta);

            setLapsData(cLapsData);
            setLapsMetadata(lapsMetadata);

            let saveData: FullLapData[] = [];
            for (let i = 0; i < cLapsData.length; i++)
            {
                saveData.push({ lapMetadata: lapsMetadata[i], lap: cLapsData[i] });
            }
            setFullLapData(saveData);

            let driverLegend: DriverDataLegend[] = [];
            for (let i = 0; i < lapsMetadata.length; i++)
            {
                driverLegend.push({ driverName: lapsMetadata[i].driver, teamColour: lapsMetadata[i].colour, isDashed: dashed[i], position: lapsMetadata[i].position, lapTime: lapsMetadata[i].lapTime });
            }
            setDriverDataLegend(driverLegend);
        }

        else
        {
            console.log("NO DELTAS");
        }
    };

    const fetchSpeeds = async (year: string, round: string, session: string, driver: string, lapNumber: number, lapTime: number, position: number, colour: string): Promise<FullLapData> => {
        if (!lapsMetadata.map((lap) => `${lap.year}${lap.round}${lap.session}${lap.driver}${lap.lapNumber}`).includes(`${year}${round}${session}${driver}${lapNumber}`))
        {
            const startTime = performance.now();
            const [data] = await Promise.all([
                fetchTelemetryData(year, round, session, driver, lapNumber, lapTime)
            ]);
            
            return { lapMetadata: new LapMetadata(year, round, session, driver, lapNumber, lapTime, position, colour), lap: data };
        }
        else
        {
            return { lapMetadata: new LapMetadata(year, round, session, driver, lapNumber, lapTime, position, colour), lap: [] };
        }
    };

    const fetchLaps = async (data: any[][], lapsMetadata: LapMetadata[], lapsData: TelemetryFrame[][]) => {
        const lapPromises = data.map(lap => 
            fetchSpeeds(lap[0], lap[1], lap[2], lap[3], lap[4], lap[5], lap[6], lap[7])
        );
    
        const results = await Promise.all(lapPromises);
    
        // setLapsMetadata(prev => [...prev, ...results.map(res => res.lapMetadata)]);
        // setLapsData(prev => [...prev, ...results.map(res => res.lap)]);

        let lapMeta = [...lapsMetadata, ...results.map(res => res.lapMetadata)];
        let lapData = [...lapsData, ...results.map(res => res.lap)];

        console.log(lapMeta);
        console.log(lapData);

        calculateDeltas(lapMeta, lapData, data.map((x) => x[8]));
    };

    useEffect(() => {
        loadDataStart();
        // fetchLaps([["2024", "22) Las Vegas Grand Prix", "Qualifying", "George Russell", 24, 92.312, 1], ["2024", "22) Las Vegas Grand Prix", "Qualifying", "Carlos Sainz", 23, 92.41, 2], ["2024", "22) Las Vegas Grand Prix", "Qualifying", "Pierre Gasly", 24, 92.664, 3]]);
    }, []);

    const CustomTooltip = ({active,payload,label,type,}: {active?: boolean;payload?: any[];label?: number;type: string;}) => {
        if (active && payload && payload.length && label) {
            let frames: TelemetryFrameMeta[] = [];
            for (let i = 0; i < lapsData.length; i++)
            {
                for (let j = 0; j < lapsData[i].length; j++)
                {       
                    if (lapsData[i][j].relativeDistance > label)
                    {
                        if (j > 0)
                        {
                            if (label - lapsData[i][j - 1].relativeDistance < lapsData[i][j].relativeDistance - label)
                            {
                                frames.push({ metadata: lapsMetadata[i], telemetryFrame: lapsData[i][j - 1] });
                            }
                            else
                            {
                                frames.push({ metadata: lapsMetadata[i], telemetryFrame: lapsData[i][j] });
                            }
                        }
                        else
                        {
                            frames.push({ metadata: lapsMetadata[i], telemetryFrame: lapsData[i][j] });
                        }
                        break;
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
                    <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Distance {(label * 100).toFixed(1)}%</p> {/* Shows hovered lap number */}
                    {frames.map((entry, index) => {
                        if (type == "speed")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver}
                                    </p>
                                    <p style={{ margin: "2px 0", color: entry.telemetryFrame.drs == 1 ? "#00FF00" : "#EAEAEA", fontWeight: entry.telemetryFrame.drs == 1 ? "bold" : "regular" }}>Speed: {entry.telemetryFrame.speed} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})</p>
                                    <p style={{ margin: "2px 0" }}>Throttle: {entry.telemetryFrame.throttle}%</p>
                                    <p style={{ margin: "2px 0", fontWeight: "bold", color: entry.telemetryFrame.brake == 1 ? "#FF1111" : "#AAAAAA" }}>
                                        Brake
                                        <span style={{ color: "#EAEAEA", fontWeight: "normal", marginLeft: "40px" }}>
                                            Gear: {entry.telemetryFrame.gear}
                                        </span>
                                    </p>
    
                                </div>
                            );
                        }
                        else if (type == "deltaTime")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.deltaTime < 0 ? "" : "+"}{entry.telemetryFrame.deltaTime.toFixed(3)})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "throttle")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.throttle}%)
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "brake")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.brake == 1 ? "ON" : "OFF"})
                                    </p>
                                </div>
                            );
                        }
                        else if (type == "gear")
                        {
                            return (
                                <div key={index} style={{ marginBottom: "5px" }}>
                                    <p style={{ fontWeight: "bold", color: `${entry.metadata.colour}`, margin: 0 }}>
                                        {entry.metadata.driver} ({entry.telemetryFrame.gear})
                                    </p>
                                </div>
                            );
                        }
                    })}
                </div>
            );
        }
        return null;
    };

    const formatLapTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedSeconds = remainingSeconds.toFixed(3).padStart(6, '0'); // Ensures 2 digits + 3 decimals
        return `${minutes}:${formattedSeconds}`;
    };


    const legendColumns: GridColDef[] = [
        {
            field: "driverName",
            headerName: 'Driver Name',
            width: 160,
            disableColumnMenu: true,
        },
        {
            field: "lapTime",
            headerName: 'Lap Time',
            width: 110,
            valueFormatter: (value) => {return formatLapTime(value)},
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
    
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let ind = savedFiles.map((file) => file.id).indexOf(selectedFile);

        if (ind != -1)
        {
            let mapData = savedFiles[ind].data();
            let data = mapData["data"];
            let arrData = [];
            for (let i = 0; i < data.length; i++)
            {
                arrData.push([data[i]["year"], data[i]["round"], data[i]["session"], data[i]["driver"], data[i]["lapNumber"], data[i]["lapTime"], data[i]["position"], data[i]["colour"], data[i]["dashed"]]);
            }
            console.log(data);

            fetchLaps(arrData, lapsMetadata, lapsData);

            // ["2024", "22) Las Vegas Grand Prix", "Qualifying", "George Russell", 24, 92.312, 1]
        }
    
        setLoadOpen(false);
        setSaveName(selectedFile);
    };


    return (
        <div id="page-content">
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
                        onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const formJson = Object.fromEntries((formData as any).entries());
                        const fileName = formJson.fileName;
                        console.log(fileName);

                        let data = [];

                        for (let i = 0; i < lapsMetadata.length; i++)
                        {
                            let map = lapsMetadata[i].toMap();
                            map["colour"] = driverDataLegend[i].teamColour;
                            map["dashed"] = driverDataLegend[i].isDashed;
                            data.push(map);
                        }

                        setDoc(doc(db, `users/${user!.uid}/speedDistance`, fileName), {"data": data});

                        console.log(data);

                        setSaveOpen(false);
                        setSaveName(fileName);
                        },
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
                    onSubmit: handleSubmit,
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

            {/* ACTUAL CONTENT */}

            <Box 
                display="flex" 
                justifyContent="space-around" 
                alignItems="center" 
                width="auto"
                gap={2}
                mb={2}
                p={2}
            >
                <Box>
                    <Button onClick={(event) => {router.push("/speedDistance/chooseLaps")}}>
                        Add Laps
                    </Button>
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
                <Box width={485}>
                    <DataGrid
                        style={{ width: 485 }}
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



            
            <Box sx={{ p: 2, height: "calc(100vh - 90px)" }}>
                {lapsData.length > 0 ? (
                    <Box width="100%" height="100%">
                        
                        <ResponsiveContainer width="100%" height="75%">
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} tickCount={11} height={30} tickFormatter={(val, ind) => {return `${val * 100}%`}} />
                                <YAxis domain={[minSpeed, maxSpeed]} tick={{ fill: 'white' }} width={55} label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="speed" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="speed"
                                        stroke={driverDataLegend[index].teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={driverDataLegend[index].isDashed ? "5,5" : ""}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[minDelta, maxDelta]} tick={{ fill: 'white' }} tickCount={(maxDelta - minDelta) * 10 + 1} width={55} label={{ value: "Delta to fastest (s)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="deltaTime" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="deltaTime"
                                        stroke={driverDataLegend[index].teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={driverDataLegend[index].isDashed ? "5,5" : ""}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[-1, 101]} tick={false} axisLine={true} width={55} label={{ value: "Throttle (%)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="throttle" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="throttle"
                                        stroke={driverDataLegend[index].teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={driverDataLegend[index].isDashed ? "5,5" : ""}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[-0.1, 1.1]} tick={false} axisLine={true} width={55} label={{ value: "Brake (on/off)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="brake" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="brake"
                                        stroke={driverDataLegend[index].teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={driverDataLegend[index].isDashed ? "5,5" : ""}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={120}>
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="relativeDistance" domain={[0, 1]} tick={{ fill: 'white' }} height={0} tickCount={11} />
                                <YAxis domain={[0, 9]} tick={{ fill: 'white' }} tickCount={10} width={55} label={{ value: "Gear (1-8)", angle: -90, position: "insideLeft", fill: "white", style: { textAnchor: "middle"} }} />
                                <Tooltip content={(props) => <CustomTooltip {...props} type="gear" />} />
                                {lapsData.map((lapData, index) => (
                                    <Line
                                        key={index}
                                        name={lapsMetadata[index].driver}
                                        type="linear"
                                        data={lapData}
                                        dataKey="gear"
                                        stroke={driverDataLegend[index].teamColour}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={false}
                                        strokeDasharray={driverDataLegend[index].isDashed ? "5,5" : ""}
                                    />
                                ))}
                                
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                ) : null}
            </Box>
        </ThemeProvider>
        </div>
    );
};

export default SpeedDistance;
