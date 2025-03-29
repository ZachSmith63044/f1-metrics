"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";
import { Box, Color, colors, Typography, ThemeProvider, CssBaseline } from "@mui/material";
import { storage } from "../../../../firebaseConfig"; // Import Firebase storage
import { ref, listAll, getDownloadURL } from "firebase/storage";
import { json } from "stream/consumers";
import { LapData } from "../../../../classes/lapData";
import { DriverData } from "../../../../classes/driverData";
import { exo2, exo2Regular } from "../../../../styles";
import darkTheme from "../../../../theme";
import Navbar from "../../../../components/Navbar";
import PageView from "../../../../components/PageView";
import { useParams } from "next/navigation";
// Class to represent a team's pit stop performance
class PitPerformance {
  constructor(public team: string, public pitTime: number, public color: string) {}
}

class Bounds {
    constructor(public minY: number, public maxY: number) {}

    toString() {return `Bounds(minY: ${this.minY}, maxY: ${this.maxY})`}
}



const PitPerformanceChart = () => {
    const [driverData, setDriverData] = useState<PitPerformance[]>([]);
    const [driverBounds, setDriverBounds] = useState<Bounds>(new Bounds(0, 10));

    const [teamsData, setTeamsData] = useState<PitPerformance[]>([]);
    const [teamsBounds, setTeamsBounds] = useState<Bounds>(new Bounds(0, 10));


    const params = useParams();
    const year = params.year;
    const round = decodeURIComponent(params.round as string ?? "02) Chinese Grand Prix"); // Decode to handle special characters
    const session = params.session;

    useEffect(() => {
      const fetchPitData = async () => {
        try {
          // Get file URL from Firebase Storage

            const sessionRef = ref(storage, `F1DataN/${year}/${round}/${session}`);

            const drivers = await listAll(sessionRef);
            let jsonDownloads = [];
            let prefixesList = drivers.prefixes.map((prefixRef) => prefixRef.fullPath);
            for (let i = 0; i < prefixesList.length; i++) {
                jsonDownloads.push(prefixesList[i] + "/lapsData.json");
                jsonDownloads.push(prefixesList[i] + "/driverData.json");
                const splitEnd = prefixesList[i].split("/");
                prefixesList[i] = splitEnd[splitEnd.length - 1];
            }
            console.log(prefixesList);
            console.log(jsonDownloads);

            const downloadPromises = jsonDownloads.map(async (filePath) => {
                const fileRef = ref(storage, filePath);
                const url = await getDownloadURL(fileRef);
                const response = await fetch(url);
                const jsonData = await response.json();
                return jsonData;
            });

            const allJsonData = await Promise.all(downloadPromises);

            
            
            let pitsTime = [];
            let pitsCount = [];
            let driversData = [];
            for (let i = 0; i < allJsonData.length/2; i++)
            {
                const lapsData = LapData.fromJsonMap(allJsonData[i * 2]);
                driversData.push(DriverData.fromList(allJsonData[i * 2 + 1]));
                let totalPit = 0;
                let pitTimes = 0;
                for (let j = 1; j < lapsData.length; j++)
                {
                    if (lapsData[j].pitOutTime != -1 && lapsData[j - 1].pitInTime != -1)
                    {
                        let pitTime = lapsData[j].pitOutTime - lapsData[j - 1].pitInTime;
                        pitTimes += 1;
                        totalPit += pitTime;
                    }
                }
                pitsTime.push(totalPit);
                pitsCount.push(pitTimes);
            }

            let teamsPitsTime = [];
            let teamsPitsCount = [];
            let teamsIndex = new Map();
            let teamsDataT = [];

            for (let i = 0; i < pitsTime.length; i++) {
            const teamName = driversData[i].teamName;

            // Check if the teamName is already in the Map
            if (teamsIndex.has(teamName)) {
                const teamIndex = teamsIndex.get(teamName); // Get the index for the team
                teamsPitsTime[teamIndex] += pitsTime[i];  // Add pits time for that team
                teamsPitsCount[teamIndex] += pitsCount[i]; // Add pits count for that team
            } else {
                const newIndex = teamsPitsTime.length; // Get the current length of the array, which will be the new index
                teamsIndex.set(teamName, newIndex); // Set the teamName in the Map with the new index
                teamsPitsTime.push(pitsTime[i]); // Add the initial pits time for the new team
                teamsPitsCount.push(pitsCount[i]); // Add the initial pits count for the new team
                teamsDataT.push(driversData[i]);
            }
            }

            console.log(teamsPitsTime);
            console.log(teamsPitsCount);
            console.log(teamsIndex);

            let driverPitPerformance = [];
            let teamsPitPerformance = [];

            let driverBound = new Bounds(999, 0);
            let teamsPitPerformanceBounds = new Bounds(999, 0);

            for (let i = 0; i < pitsTime.length; i++)
            {
                if (pitsCount[i] > 0)
                {
                    let pitTime = pitsTime[i]/pitsCount[i];
                    if (Math.floor(pitTime - 1) < driverBound.minY)
                    {
                        driverBound.minY = Math.floor(pitTime - 1);
                    }
                    if (Math.ceil(pitTime + 1) > driverBound.maxY)
                    {
                        driverBound.maxY = Math.ceil(pitTime + 1);
                    }
                    driverPitPerformance.push(new PitPerformance(driversData[i].lastName.slice(0,3).toUpperCase(), pitsTime[i]/pitsCount[i], "#" + driversData[i].teamColour)); // allDriverData[i].teamColour
                }
            }

            for (let i = 0; i < teamsPitsTime.length; i++)
            {
                if (teamsPitsCount[i] > 0)
                {
                    let pitTime = teamsPitsTime[i]/teamsPitsCount[i];
                    if (Math.floor(pitTime - 1) < teamsPitPerformanceBounds.minY)
                    {
                        teamsPitPerformanceBounds.minY = Math.floor(pitTime - 1);
                    }
                    if (Math.ceil(pitTime + 1) > teamsPitPerformanceBounds.maxY)
                    {
                        teamsPitPerformanceBounds.maxY = Math.ceil(pitTime + 1);
                    }
                    teamsPitPerformance.push(new PitPerformance(teamsDataT[i].teamName.slice(0,3).toUpperCase(), teamsPitsTime[i]/teamsPitsCount[i], "#" + teamsDataT[i].teamColour)); // allDriverData[i].teamColour
                
                }
            }

            driverPitPerformance.sort((a, b) => a.pitTime - b.pitTime);
            teamsPitPerformance.sort((a, b) => a.pitTime - b.pitTime);

            console.log(driverBound);

            setDriverData(driverPitPerformance);
            setDriverBounds(driverBound);
            
            setTeamsData(teamsPitPerformance);
            setTeamsBounds(teamsPitPerformanceBounds);



        //   const fileRef = ref(storage, "pitPerformance.json"); // Change to your file path
        //   const url = await getDownloadURL(fileRef);
  
        //   // Fetch JSON data
        //   const response = await fetch(url);
        //   const jsonData = await response.json();
  
        //   // Convert JSON to PitPerformance objects
        //   const formattedData: PitPerformance[] = jsonData.map(
        //     (item: { team: string; pitTime: number; color: string }) =>
        //       new PitPerformance(item.team, item.pitTime, item.color)
        //   );
  
        //   setData(formattedData);
        } catch (error) {
          console.error("Error fetching pit performance data:", error);
        }
      };
  
      fetchPitData();
    }, []);

  return (
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Navbar />
        <Box
        // marginTop="20px"
        sx={{
            width: "99vw", // Full width of the viewport
            height: "92vh", // Full height of the viewport
            textAlign: "center",
            padding: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center", // Center content vertically
            alignItems: "center", // Center content horizontally
        }}
        >
        <Typography variant="h4" gutterBottom sx={{ fontFamily: exo2.style.fontFamily, fontWeight: "700", letterSpacing: 1.2, fontSize: 42 }}>
            Pit Stop Performance
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 } } >
                <CartesianGrid strokeDasharray="6 6" vertical={false}/>
                <ReferenceLine x={teamsData.length - 1} stroke="#DDDDDD" strokeDasharray="3 3" />
                <XAxis
                    dataKey="team"
                    fontFamily={exo2.style.fontFamily}
                    fontSize={18}
                    fontWeight="600"
                    style={{ fill: '#EEEEEE' }}
                    tickCount={0}
                />
                <YAxis
                    fontFamily={exo2.style.fontFamily}
                    fontSize={18}
                    fontWeight="500"
                    style={{ fill: '#EEEEEE' }}
                    label={{ 
                        value: "Average Pit Stop Time (s)", 
                        angle: -90, 
                        position: "insideLeft", 
                        style: { fontFamily: exo2.style.fontFamily, fontWeight: "600" },
                        fill: "#FFFFFF", // Sets the label color to white
                        dy: 70  // Centers the label vertically
                    }}
                    domain={[teamsBounds.minY, teamsBounds.maxY]} // Your min and max Y values
                    tickCount={Math.ceil(teamsBounds.maxY - teamsBounds.minY) + 1} // Number of ticks
                    interval={0} // Ensures no ticks are skipped
                    tickFormatter={(value) => value.toFixed(0)} // Optional: formats ticks as integers
                />
                <Bar dataKey="pitTime" radius={[14, 14, 0, 0]}>
                    {teamsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                        dataKey="pitTime" 
                        position="top" 
                        formatter={(value: number) => value.toFixed(2)}
                        fontFamily={exo2Regular.style.fontFamily}
                        fontWeight="600"
                        fontSize={20}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
        </Box>
    </ThemeProvider>
  );
};

export default PitPerformanceChart;
