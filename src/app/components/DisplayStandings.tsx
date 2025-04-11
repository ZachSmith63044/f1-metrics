import { Box, Card, CardContent, Typography } from '@mui/material';
import { Standing } from '../utils/fetchStandings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface StandingCardProps {
    standing: Standing;
    position: number;
}

const StandingCard: React.FC<StandingCardProps> = ({ standing, position }) => {
    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <Box flexDirection={"row"} display={"flex"} alignItems={"center"} padding={"20px"} justifyContent={"space-between"}>
                <Typography fontWeight={"bold"} fontSize={22}>
                    {position} - {standing.name}
                </Typography>
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

const StandingsList: React.FC<StandingsListProps> = ({ standings }) => {
    return (
        <>
            {standings.map((standing, index) => (
                <StandingCard key={index} standing={standing} position={index + 1} />
            ))}
        </>
    );
};


interface StandingsProps {
    standings: Standing[];
}

export function DisplayDriverStandings({ standings }: StandingsProps) {
    return (
        <Box padding={"20px"} sx={{width: '700px',maxWidth: '100%'}}>
            <Typography fontWeight={"bold"} fontSize={28} gutterBottom>
                Driver Standings
            </Typography>
            <StandingsList standings={standings} />
        </Box>
    );
};

export function DisplayConstructorStandings({ standings }: StandingsProps) {
    return (
        <Box padding={"20px"} sx={{width: '700px',maxWidth: '100%'}}>
            <Typography fontWeight={"bold"} fontSize={28} gutterBottom>
                Constructor Standings
            </Typography>
            <StandingsList standings={standings} />
        </Box>
    );
};

