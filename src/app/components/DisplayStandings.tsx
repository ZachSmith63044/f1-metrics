import { Box, Card, CardContent, Typography } from '@mui/material';
import { DriverStanding, Standing } from '../utils/fetchStandings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface StandingCardProps {
    standing: Standing;
    position: number;
}

interface DriverStandingCardProps {
    standing: DriverStanding;
    position: number;
}

const StandingCard: React.FC<StandingCardProps> = ({ standing, position }) => {
    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <Box flexDirection={"row"} display={"flex"} alignItems={"center"} height={"80px"} padding={"0px 20px"} justifyContent={"space-between"}>
                <Box display={"flex"} flexDirection={"row"} gap={4}>
                    <Typography fontWeight={"bold"} fontSize={22}>
                        {position}
                    </Typography>
                    <Typography fontWeight={"bold"} fontSize={22} color={"#" + standing.colour}>
                        {standing.name}
                    </Typography>
                </Box>
                <Box gap={4} flexDirection={"row"} display={"flex"} alignItems={"center"} >
                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                        <EmojiEventsIcon fontSize="small" htmlColor="#ffc247" />
                        <Typography fontSize={16} fontWeight={"bold"}>
                            {standing.wins}
                        </Typography>
                    </Box>
                    <Typography fontSize={19}>
                        {standing.points}pts{position == 1 ? "" : ` (+${standing.interval})`}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

const DriverStandingCard: React.FC<DriverStandingCardProps> = ({ standing, position }) => {
    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <Box flexDirection={"row"} display={"flex"} alignItems={"center"} height={"100px"} padding={"0px 20px"} justifyContent={"space-between"}>
                <Box display={"flex"} flexDirection={"row"} gap={4} alignItems={"center"}>
                    <Typography fontWeight={"bold"} fontSize={22}>
                        {position}
                    </Typography>
                    <Box>
                        <Typography fontWeight={"bold"} fontSize={22}>
                            {standing.name}
                        </Typography>
                        <Typography fontSize={18} color={"#" + standing.teamColour}>
                            {standing.team}
                        </Typography>
                    </Box>
                </Box>
                <Box gap={4} flexDirection={"row"} display={"flex"} alignItems={"center"} >
                    <Box flexDirection={"row"} display={"flex"} gap={1} alignItems={"center"}>
                        <EmojiEventsIcon fontSize="small" htmlColor="#ffc247" />
                        <Typography fontSize={16} fontWeight={"bold"}>
                            {standing.wins}
                        </Typography>
                    </Box>
                    <Typography fontSize={19}>
                        {standing.points}pts{position == 1 ? "" : ` (+${standing.interval})`}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};


interface StandingsListProps {
    standings: Standing[];
}

interface DriverStandingsListProps {
    standings: DriverStanding[];
}

const StandingsList: React.FC<StandingsListProps> = ({ standings }) => {
    return (
        <>
            {standings.map((standing, index) => (
                <StandingCard key={index} standing={standing} position={index + 1} />
            ))}
        </>
    );
};

const DriverStandings: React.FC<DriverStandingsListProps> = ({ standings }) => {
    return (
        <>
            {standings.map((standing, index) => (
                <DriverStandingCard key={index} standing={standing} position={index + 1} />
            ))}
        </>
    );
};


interface StandingsProps {
    standings: Standing[];
}

interface DriverStandingsProps {
    standings: DriverStanding[];
}

export function DisplayDriverStandings({ standings }: DriverStandingsProps) {
    return (
        <Box padding={"20px"} sx={{ width: '700px', maxWidth: '100%' }}>
            <Typography fontWeight={"bold"} fontSize={28} gutterBottom>
                Driver Standings
            </Typography>
            <DriverStandings standings={standings} />
        </Box>
    );
};

export function DisplayConstructorStandings({ standings }: StandingsProps) {
    return (
        <Box padding={"20px"} sx={{ width: '700px', maxWidth: '100%' }}>
            <Typography fontWeight={"bold"} fontSize={28} gutterBottom>
                Constructor Standings
            </Typography>
            <StandingsList standings={standings} />
        </Box>
    );
};

