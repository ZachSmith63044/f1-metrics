import { Box, Button, Card, CardActionArea, CardActions, CardContent, CircularProgress, Divider, IconButton, Skeleton, Typography } from "@mui/material";
import { F1Event } from "../utils/fetchYearData";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebaseConfig";
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

type EventCardProps = {
    event: F1Event;
    eventNum: number;
};


function EventCard({ event, eventNum }: EventCardProps) {
    const router = useRouter();

    const [nextSession, setNextSession] = useState<string>("");
    const [days, setDays] = useState<number>(0);
    const [hours, setHours] = useState<number>(0);
    const [mins, setMins] = useState<number>(0);
    const [secs, setSecs] = useState<number>(0);

    const [open, setOpen] = useState<boolean>(false);


    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, sessionName: "" });

    const handleClick = () => {
        setContextMenu({ ...contextMenu, visible: false });
    };



    useEffect(() => {
        const calculateCountdown = () => {
            const now = new Date();
            const upcomingSession = event.sessions.find(
                ([name, date]) => { console.log(`datefix: ${date}`); return new Date(date).getTime() > now.getTime(); }
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

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            // Optional: add checks if needed (e.g., don't close when clicking inside the menu)
            setContextMenu((prev) => ({ ...prev, visible: false }));
        };

        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    if (open) {
        return (
            <div>
                {contextMenu.visible && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: contextMenu.y,
                            left: contextMenu.x,
                            width: 100,
                            backgroundColor: '#3A3A3A',
                            borderRadius: 2,
                            boxShadow: 3,
                            overflow: 'hidden', // Ensure rounded corners clip content
                            zIndex: 1000
                        }}
                    >
                        <Button
                            fullWidth
                            sx={{
                                justifyContent: 'flex-start',
                                borderBottom: '1px solid #ccc',
                                borderRadius: '8px 8px 0 0', // Rounded top
                                textTransform: 'none',
                                color: "#DDD",
                                '&:hover': {
                                    backgroundColor: '#444',
                                },
                            }}
                            onClick={() => {
                                // Handle Open click
                                setContextMenu((prev) => ({ ...prev, visible: false }));
                                // Your "Open" action here
                                router.push(`/session/${event.date.slice(0, 4)}/${eventNum.toString().padStart(2, '0')}) ${event.event}/${contextMenu.sessionName}`);
                            }}
                        >
                            Open
                        </Button>

                        <Button
                            fullWidth
                            sx={{
                                justifyContent: 'flex-start',
                                borderRadius: '0 0 8px 8px', // Rounded top
                                textTransform: 'none',
                                color: "#DDD",
                                '&:hover': {
                                    backgroundColor: '#444',
                                },
                            }}
                            disabled={eventNum < 8}
                            onClick={() => {
                                // Handle Open click
                                setContextMenu((prev) => ({ ...prev, visible: false }));
                                // Your "Open" action here
                                router.push(`/liveDash/${2025}/${event.event}/${contextMenu.sessionName}`);
                            }}
                        >
                            Replay
                        </Button>
                    </Box>
                )}
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
                                    <Button
                                        onContextMenu={(e) => {
                                            e.preventDefault();  // Stops default menu
                                            setContextMenu({ visible: true, x: e.pageX, y: e.pageY, sessionName: sessionName });
                                        }}
                                        key={index} variant="contained" disabled={!event.sessions[index][2]} sx={{ height: "50px", bgcolor: "#DDDDDD" }} onClick={() => { router.push(`/session/${event.date.slice(0, 4)}/${eventNum.toString().padStart(2, '0')}) ${event.event}/${sessionName}`) }}>
                                        {sessionName}
                                    </Button>

                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Card>
            </div>
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
                                        <Box flexDirection={"row"} display={"flex"} gap={0.7} alignItems={"center"} alignContent={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20} color={"#db34eb"}>
                                                Fastest Lap
                                            </Typography>
                                            <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb', marginTop: 0.2 }} />
                                            <Typography fontWeight={"bold"} fontSize={20} color={"#db34eb"} marginRight={0.4}>
                                                -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.fl}
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={0.7} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20} color={"gold"}>
                                                Championship Leader
                                            </Typography>
                                            <EmojiEventsIcon fontSize="small" sx={{ color: 'gold', marginTop: 0.2 }} />
                                            <Typography fontWeight={"bold"} fontSize={20} color={"gold"} marginRight={0.4}>
                                                -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.championshipLeader![0]} ({event.championshipLeader![1]}pts)
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={0.7} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20} color={"silver"}>
                                                Most Points
                                            </Typography>
                                            <EmojiEventsIcon fontSize="small" sx={{ color: 'silver', marginTop: 0.2 }} />
                                            <Typography fontWeight={"bold"} fontSize={20} color={"silver"} marginRight={0.4}>
                                                -
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
                                            <Typography fontWeight={"bold"} fontSize={20} color={"gold"}>
                                                1 -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topTeams![0][0]} ({event.topTeams![0][1]})
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20} color={"silver"}>
                                                2 -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topTeams![1][0]} ({event.topTeams![1][1]})
                                            </Typography>
                                        </Box>
                                        <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                            <Typography fontWeight={"bold"} fontSize={20} color={"#CE8946"}>
                                                3 -
                                            </Typography>
                                            <Typography fontWeight={"regular"} fontSize={18}>
                                                {event.topTeams![2][0]} ({event.topTeams![2][1]})
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box flexDirection={"column"} display={"flex"} width={"220px"}>
                                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={20} color={"gold"}>
                                            🥇 -
                                        </Typography>
                                        <Typography fontWeight={"regular"} fontSize={18}>
                                            {event.top3[0]}
                                        </Typography>
                                    </Box>
                                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={20} color={"silver"}>
                                            🥈 -
                                        </Typography>
                                        <Typography fontWeight={"regular"} fontSize={18}>
                                            {event.top3[1]}
                                        </Typography>
                                    </Box>
                                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                                        <Typography fontWeight={"bold"} fontSize={20} color={"#CE8946"}>
                                            🥉 -
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
                        index != 0 && <EventCard key={index} event={event} eventNum={index} />
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