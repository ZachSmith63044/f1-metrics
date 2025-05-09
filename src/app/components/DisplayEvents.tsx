import { Box, Button, Card, CardActionArea, CardActions, CardContent, CircularProgress, Divider, IconButton, Skeleton, Typography } from "@mui/material";
import { F1Event } from "../utils/fetchYearData";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebaseConfig";
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EventCardProps = {
    event: F1Event;
    eventNum: number;
};


function EventCard({ event, eventNum }: EventCardProps) {
    const router = useRouter();

    const [flagUrl, setFlagUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [nextSession, setNextSession] = useState<string>("");
    const [days, setDays] = useState<number>(0);
    const [hours, setHours] = useState<number>(0);
    const [mins, setMins] = useState<number>(0);
    const [secs, setSecs] = useState<number>(0);

    const [open, setOpen] = useState<boolean>(false);

    const flagUrls: Record<string, string> = {
        "Australia": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FAustralia.svg?alt=media&token=c0d70cb1-6573-4ea7-9de5-6716cee8c4ea",
        "Austria": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FAustria.svg?alt=media&token=f73b8a12-f0b3-494c-a48b-516009137401",
        "Azerbaijan": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FAzerbaijan.svg?alt=media&token=99c1b05e-e729-408a-9230-082c2acf7e98",
        "Bahrain": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FBahrain.svg?alt=media&token=a7e99902-a391-4306-9d2d-f2ad97b3d76f",
        "Belgium": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FBelgium.svg?alt=media&token=15b0668b-0b92-42db-8a93-91e9479e2469",
        "Brazil": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FBrazil.svg?alt=media&token=0541898d-a18c-4661-9c46-2343c4bebcd9",
        "Canada": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FCanada.svg?alt=media&token=225e7507-7319-4e14-bdbf-233a33225b1a",
        "China": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FChina.svg?alt=media&token=c4715a1c-df23-4aa8-a3a6-1e238dba47cf",
        "France": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FFrance.svg?alt=media&token=04c38d8a-62f0-4d90-9a42-e73b26a6703c",
        "Germany": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FGermany.svg?alt=media&token=c5d55d3c-44fe-4795-8788-1d4dc4fabbad",
        "Hungary": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FHungary.svg?alt=media&token=ea4c65d5-73c0-4306-98ae-f7c79702dc36",
        "Italy": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FItaly.svg?alt=media&token=3e666e81-19e4-4852-9102-b53d0dfc67aa",
        "Japan": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FJapan.svg?alt=media&token=42738d6b-8388-45f6-baaa-44182e74835e",
        "Mexico": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FMexico.svg?alt=media&token=93e25cf1-206c-419f-b3d4-cb2de11f0908",
        "Monaco": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FMonaco.svg?alt=media&token=65c36770-9c0e-4ec9-80c9-a66526840c1c",
        "Netherlands": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FNetherlands.svg?alt=media&token=af234554-1f66-4ae3-ab00-0fd6ed9b9a35",
        "Portugal": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FPortugal.svg?alt=media&token=c0776cdd-3948-4267-b96e-36612953416c",
        "Qatar": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FQatar.svg?alt=media&token=fa403dcd-dea5-47c1-b458-96e1d3c084ac",
        "Russia": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FRussia.svg?alt=media&token=4b6693ce-ae5d-4f70-9382-cddf3065e687",
        "Saudi Arabia": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FSaudi%20Arabia.svg?alt=media&token=a79a8f98-d4c5-4bd4-b307-f86d63db7ab2",
        "Singapore": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FSingapore.svg?alt=media&token=1901618a-d226-411d-bed9-525bf3bd80c9",
        "Spain": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FSpain.svg?alt=media&token=d4d21760-e6e8-43b7-bbf1-d96cb8337a35",
        "United Arab Emirates": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FUnited%20Arab%20Emirates.svg?alt=media&token=056f17b2-bb71-46b5-9e01-821dec8fc5e3",
        "United Kingdom": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FUnited%20Kingdom.svg?alt=media&token=7b6b435d-18da-49a2-8878-4e9bcdfe3118",
        "United States": "https://firebasestorage.googleapis.com/v0/b/f1analysis-d2911.firebasestorage.app/o/Flags%2FUnited%20States.svg?alt=media&token=9231ccb3-6f00-4446-8b63-b5e221ed1ae1",
    };

    useEffect(() => {
        const fetchFlag = async () => {
            setFlagUrl(flagUrls[event.country]);
            setLoading(false);
        };

        fetchFlag();
    }, [event.country]);



    useEffect(() => {
        const calculateCountdown = () => {
            const now = new Date();
            const upcomingSession = event.sessions.find(
                ([name, date]) => new Date(date).getTime() > now.getTime()
            );

            if (upcomingSession) {
                const [sessionName, sessionDate] = upcomingSession;
                setNextSession(upcomingSession[0]);
                const sessionTime = new Date(sessionDate);
                const diff = sessionTime.getTime() - now.getTime();

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setDays(days);
                setHours(hours);
                setMins(minutes);
                setSecs(seconds);
            }
        };

        calculateCountdown();

        // Update countdown every minute
        const interval = setInterval(calculateCountdown, 1000);
        return () => clearInterval(interval); // Cleanup on unmount
    }, [event.sessions]);

    let check = event.top3 == undefined;
    if (!check) {
        if (event.top3!.length == 3) {
            check = false;
        }
        console.log(event.top3);
    }

    if (open) {
        return (
            <Card>
                <Box padding="7px 7px 7px 10px">
                    <Box flexDirection={"column"} display={"flex"}>
                        <Box flexDirection={"row"} display={"flex"} justifyContent="space-between" alignItems={"start"} width={"100%"}>
                            <Box flexDirection={"row"} display={"flex"} alignItems={"center"} gap={1.5}>
                                <Typography fontWeight={"bold"} fontSize={22}>
                                    R{eventNum} - {event.event}
                                </Typography>

                                <img
                                    src={`flags/${event.country}.svg`}
                                    alt={`${event.country} flag`}
                                    style={{ height: "24px", borderRadius: "4px" }}
                                />

                                <Typography fontSize={20} marginLeft={"10px"}>
                                    {new Date(event.date).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => { setOpen(false) }} aria-label="close">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Box flexDirection={"row"} display={"flex"} justifyContent="space-between" width={"100%"} padding={"17px"}>
                            {event.sessions.map(([sessionName], index) => (
                                <Button key={index} variant="contained" disabled={!event.sessions[index][2]} sx={{ height: "50px", bgcolor: "#DDDDDD" }} onClick={() => { router.push(`/session/${event.date.slice(0, 4)}/${eventNum.toString().padStart(2, '0')}) ${event.event}/${sessionName}`) }}>
                                    {sessionName}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Card>
        );
    }
    else if (event.top3 == undefined) {
        return (
            <Card>
                <CardActionArea onClick={() => { setOpen(true) }}>
                    <Box padding="7px 7px 7px 10px">
                        <Box flexDirection={"row"} display={"flex"} justifyContent="space-between" alignItems={"center"}>
                            <Box display="flex" flexDirection={"column"} alignItems="start" gap={0}>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Typography fontWeight={"bold"} fontSize={22}>
                                        R{eventNum} - {event.event}
                                    </Typography>

                                    <img
                                        src={`flags/${event.country}.svg`}
                                        alt={`${event.country} flag`}
                                        style={{ height: "24px", borderRadius: "4px" }}
                                    />

                                    <Typography fontSize={20} marginLeft={"10px"}>
                                        {new Date(event.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </Typography>
                                </Box>

                                {/* Sessions display */}
                                {event.sessions.map(([name, datetime], idx) => {
                                    const dateObj = new Date(datetime);
                                    const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });
                                    const time = dateObj.toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });

                                    // Only display the day label on the first session of that day
                                    const prevDate =
                                        idx > 0 ? new Date(event.sessions[idx - 1][1]) : undefined;
                                    const isNewDay =
                                        !prevDate ||
                                        prevDate.toDateString() !== dateObj.toDateString();

                                    return isNewDay ? (
                                        <Box key={idx} display="flex" alignItems="center" gap={1.5} mt={0.5}>
                                            <Typography fontSize={20} fontWeight={"bold"}>
                                                {day} -
                                            </Typography>
                                            <Typography fontSize={18}>
                                                {event.sessions
                                                    .filter(([_, dt]) => {
                                                        const d = new Date(dt);
                                                        return d.toDateString() === dateObj.toDateString();
                                                    })
                                                    .map(([n, d]) => {
                                                        const t = new Date(d).toLocaleTimeString("en-GB", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        });
                                                        return `${n} (${t})`;
                                                    })
                                                    .join(", ")}
                                            </Typography>
                                        </Box>
                                    ) : null;
                                })}
                            </Box>


                            {
                                !(days == 0 && hours == 0 && mins == 0 && secs == 0) &&
                                <Box
                                    mr={"8px"}
                                    sx={{
                                        backgroundColor: "#555555",
                                        borderRadius: "8px",
                                        padding: "16px",
                                        color: "white",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        height: "120px",
                                    }}
                                >
                                    <Typography fontWeight={"bold"} fontSize={20} textAlign="center">
                                        Countdown to {nextSession}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            marginTop: "16px",
                                        }}
                                    >
                                        {
                                            days > 0 &&
                                            (
                                                <Box sx={{ display: "flex", flexDirection: "column", width: "75px", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                                                    <Typography fontWeight={"bold"} fontSize={16}>
                                                        {days}
                                                    </Typography>
                                                    <Typography fontWeight={"bold"} fontSize={16}>
                                                        DAYS
                                                    </Typography>
                                                </Box>
                                            )
                                        }
                                        <Box sx={{ display: "flex", flexDirection: "column", width: "75px", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                                            <Typography fontWeight={"bold"} fontSize={16}>
                                                {hours}
                                            </Typography>
                                            <Typography fontWeight={"bold"} fontSize={16}>
                                                HOURS
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: "flex", flexDirection: "column", width: "75px", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                                            <Typography fontWeight={"bold"} fontSize={16}>
                                                {mins}
                                            </Typography>
                                            <Typography fontWeight={"bold"} fontSize={16}>
                                                MINS
                                            </Typography>
                                        </Box>
                                        {
                                            days == 0 &&
                                            (
                                                <Box sx={{ display: "flex", flexDirection: "column", width: "75px", alignItems: "center", justifyContent: "center", padding: "8px" }}>
                                                    <Typography fontWeight={"bold"} fontSize={16}>
                                                        {secs}
                                                    </Typography>
                                                    <Typography fontWeight={"bold"} fontSize={16}>
                                                        SECS
                                                    </Typography>
                                                </Box>
                                            )
                                        }
                                    </Box>
                                </Box>
                            }
                        </Box>
                    </Box>
                </CardActionArea>
            </Card>
        );
    }
    else {
        return (
            <Card>
                <CardActionArea onClick={() => { setOpen(true) }}>
                    <Box padding="7px 7px 7px 10px">
                        <Box flexDirection={"column"} display={"flex"}>
                            <Box flexDirection={"row"} display={"flex"} justifyContent="space-between" width={"100%"}>
                                <Box flexDirection={"row"} display={"flex"} alignItems={"center"} gap={1.5}>
                                    <Typography fontWeight={"bold"} fontSize={22}>
                                        R{eventNum} - {event.event}
                                    </Typography>

                                    <img
                                        src={`flags/${event.country}.svg`}
                                        alt={`${event.country} flag`}
                                        style={{ height: "24px", borderRadius: "4px" }}
                                    />

                                    <Typography fontSize={20} marginLeft={"10px"}>
                                        {new Date(event.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </Typography>
                                </Box>
                                <Box width={"175px"}>
                                    <Typography fontWeight={"bold"} fontSize={22}>
                                        Race Results
                                    </Typography>
                                </Box>
                            </Box>
                            <Box flexDirection={"row"} display={"flex"} justifyContent="space-between" width={"100%"}>
                                <Box flexDirection={"row"} display={"flex"} justifyContent="start" width={"100%"} gap={3}>
                                    <Box flexDirection={"column"} display={"flex"}>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20}>
                                                Fastest Lap -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.fl}
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20}>
                                                Championship Leader -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.championshipLeader![0]} ({event.championshipLeader![1]}pts)
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20}>
                                                Most points -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topDriver![0]} ({event.topDriver![1]}pts)
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Divider
                                        orientation="vertical"
                                        sx={{
                                            height: "60px",
                                            borderRightWidth: 2,
                                            borderColor: "#CCCCCC",
                                            marginY: 2,
                                            marginX: 2,
                                        }}
                                    />
                                    <Box flexDirection={"column"} display={"flex"} width={"175px"}>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20}>
                                                P1 -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topTeams![0][0]} ({event.topTeams![0][1]})
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20}>
                                                P2 -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topTeams![1][0]} ({event.topTeams![1][1]})
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20}>
                                                P3 -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topTeams![2][0]} ({event.topTeams![2][1]})
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box flexDirection={"column"} display={"flex"} width={"220px"}>
                                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={20}>
                                            P1 -
                                        </Typography>
                                        <Typography fontWeight={"regular"} fontSize={18}>
                                            {event.top3[0]}
                                        </Typography>
                                    </Box>
                                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={20}>
                                            P2 -
                                        </Typography>
                                        <Typography fontWeight={"regular"} fontSize={18}>
                                            {event.top3[1]}
                                        </Typography>
                                    </Box>
                                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={20}>
                                            P3 -
                                        </Typography>
                                        <Typography fontWeight={"regular"} fontSize={18}>
                                            {event.top3[2]}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </CardActionArea>
            </Card>
        );
    }

}

type EventListProps = {
    events: F1Event[];
};

function EventList({ events }: EventListProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {
                events.length == 0 ?
                    Array.from({ length: 20 }).map((_, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                maxHeight: 150,
                                width: '100%',
                            }}
                        >
                            <Skeleton
                                variant="rectangular"
                                animation="wave"
                                sx={{
                                    height: 150,
                                    width: '100%',
                                    borderRadius: 2,
                                }}
                            />
                        </Box>
                    ))
                    :
                    events.map((event, index) => (
                        <EventCard key={index} event={event} eventNum={index} />
                    ))
            }
        </div>
    );
}


export function DisplayEvents({ events }: EventListProps) {
    return (
        <Box padding={"20px"} sx={{ width: '900px', maxWidth: '100%' }}>
            <EventList events={events} />
        </Box>
    );
}