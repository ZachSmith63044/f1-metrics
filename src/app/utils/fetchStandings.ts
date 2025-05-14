import { ref, getBlob, StorageReference } from "firebase/storage";
import { storage } from "../firebaseConfig";

export interface Standing {
    name: string;
    points: number;
    wins: number;
    interval: number;
    colour: string;
}

export interface DriverStanding {
    name: string;
    points: number;
    wins: number;
    interval: number;
    team: string;
    teamColour: string;
}

export interface Standings {
    drivers: DriverStanding[];
    teams: Standing[];
}

export async function fetchStandings(year: string): Promise<Standings> {
    try {
        const sessionRef: StorageReference = ref(storage, `home/standings${year}.json`);
        const blob: Blob = await getBlob(sessionRef);
        const text: string = await blob.text();
        const jsonData: any = JSON.parse(text);

        let drivers: DriverStanding[] = [];
        let teams: Standing[] = [];
        for (let i = 0; i < jsonData["drivers"].length; i++) {
            let interval = 0;
            if (i > 0)
            {
                interval = jsonData["drivers"][i - 1][0] - jsonData["drivers"][i][0];
            }
            drivers.push({ name: jsonData["drivers"][i][2], points: jsonData["drivers"][i][0], wins: jsonData["drivers"][i][1], interval: interval, team: jsonData["drivers"][i][3], teamColour: jsonData["drivers"][i][4] });
        }
        for (let i = 0; i < jsonData["constructors"].length; i++) {
            let interval = 0;
            if (i > 0)
            {
                interval = jsonData["constructors"][i - 1][0] - jsonData["constructors"][i][0];
            }
            teams.push({ name: jsonData["constructors"][i][2], points: jsonData["constructors"][i][0], wins: jsonData["constructors"][i][1], interval: interval, colour: jsonData["constructors"][i][3] });
        }

        // drivers.sort((a, b) => {
        //     if (b.points !== a.points) return b.points - a.points;
        //     if (b.wins !== a.wins) return b.wins - a.wins;
        //     return a.name.localeCompare(b.name);
        // });
        // teams.sort((a, b) => {
        //     if (b.points !== a.points) return b.points - a.points;
        //     if (b.wins !== a.wins) return b.wins - a.wins;
        //     return a.name.localeCompare(b.name);
        // });

        console.log(drivers);
        console.log(teams);
        console.log(jsonData);

        return { drivers: drivers, teams: teams };
    } catch (error) {
        console.error("Error fetching session data:", error);
        throw error;
    }
}