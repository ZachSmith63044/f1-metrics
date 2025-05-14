import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    Skeleton,
} from '@mui/material';
import { PracticeResult, QualiResult, RaceResult } from '../utils/fetchResults';

import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';


function formatRaceTime(result: RaceResult, maxLaps: number): string {
    if (result.position === 1) {
        const hours = Math.floor(result.time / 3600);
        const minutes = Math.floor((result.time % 3600) / 60);
        const seconds = (result.time % 60).toFixed(3);
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(6, '0')}`;
    } else {
        if (maxLaps - result.lapsCompleted == 0) {
            return `+${result.time.toFixed(3)}`;
        }
        else if (maxLaps - result.lapsCompleted == 1) {
            return `+ 1 LAP`;
        }
        else {
            return `+ ${maxLaps - result.lapsCompleted} LAP`;
        }

    }
}

function formatToMinSecMillis(seconds: number): string {
    if (seconds == -1)
    {
        return "nan";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds % 1) * 1000);

    const paddedSecs = secs.toString().padStart(2, '0');
    const paddedMillis = millis.toString().padStart(3, '0');

    return `${mins}:${paddedSecs}.${paddedMillis}`;
}


interface RaceResultsTableProps {
    results: RaceResult[];
    year: string;
    round: string;
    session: string;
}

export const RaceResultsTable: React.FC<RaceResultsTableProps> = ({ results, year, round, session }) => {
    let maxLaps = Math.max(...results.map((x) => x.lapsCompleted));

    let fastestLap = Math.min(...results.map((x) => x.fastestLap == -1 ? 999 : x.fastestLap));

    return (
        <Box padding={"20px"} sx={{ width: '1300px', maxWidth: '100%' }} >
            <TableContainer component={Paper} style={{ borderRadius: 12 }}>
                <Typography fontWeight={"bold"} fontSize={22} sx={{ m: 2 }}>
                    {year} {round.slice(3)} {session} Results
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography fontWeight={"bold"}>Pos</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Driver</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Team</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Time/Gap</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Fastest Lap</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Positions Gained</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Points</Typography></TableCell>
                            <TableCell><Typography fontWeight={"bold"}>Laps</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {
                            results.length == 0 ?
                                Array.from({ length: 20 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 30,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 120,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 120,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 100,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 140,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 60,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 50,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton
                                                variant="rectangular"
                                                animation="wave"
                                                sx={{
                                                    height: 30,
                                                    width: 50,
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                                :
                                results.map((result) => (
                                    <TableRow key={result.position}>
                                        <TableCell>
                                            <Typography fontWeight={result.position <= 3 ? "bold" : "regular"} color={result.position <= 3 ? ["#ffc247", "#a8a8a8", "#CD7F32"][result.position - 1] : "#EAEAEA"}>
                                                {result.position}
                                            </Typography>
                                        </TableCell>
                                        <TableCell><Typography>{result.name}</Typography></TableCell>
                                        <TableCell><Typography>{result.team}</Typography></TableCell>
                                        <TableCell><Typography>{result.time > 0 ? formatRaceTime(result, maxLaps) : result.status}</Typography></TableCell>
                                        <TableCell>
                                            {fastestLap === result.fastestLap ? (
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb' }} />
                                                    <Typography fontWeight="bold" color="#db34eb">
                                                        {formatToMinSecMillis(result.fastestLap)}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography>{formatToMinSecMillis(result.fastestLap)}</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            {(() => {
                                                const diff = result.gridPos - result.position;
                                                if (diff > 0) {
                                                    return (
                                                        <>
                                                            <Box display={"flex"} flexDirection={"row"} alignItems={"center"}>
                                                                <ArrowDropUpIcon fontSize="small" sx={{ color: 'green', verticalAlign: 'middle' }} />
                                                                <Typography>{Math.abs(diff)}</Typography>
                                                            </Box>
                                                        </>
                                                    );
                                                } else if (diff < 0) {
                                                    return (
                                                        <>
                                                            <Box display={"flex"} flexDirection={"row"} alignItems={"center"}>
                                                                <ArrowDropDownIcon fontSize="small" sx={{ color: 'red', verticalAlign: 'middle' }} />
                                                                <Typography>{Math.abs(diff)}</Typography>
                                                            </Box>
                                                        </>
                                                    );
                                                } else {
                                                    return <RemoveIcon fontSize="small" sx={{ color: 'gray' }} />;
                                                }
                                            })()}
                                        </TableCell>
                                        <TableCell><Typography>{result.points}</Typography></TableCell>
                                        <TableCell><Typography>{result.lapsCompleted}</Typography></TableCell>
                                    </TableRow>
                                ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

interface QualiResultsTableProps {
    results: QualiResult[];
    year: string;
    round: string;
    session: string;
}

export const QualiResultsTable: React.FC<QualiResultsTableProps> = ({ results, year, round, session }) => {
    let fastq1 = Math.min(...results.map((x) => x.q1 == -1 ? 9999 : x.q1));
    let fastq2 = Math.min(...results.map((x) => x.q2 == -1 ? 9999 : x.q2));
    let fastq3 = Math.min(...results.map((x) => x.q3 == -1 ? 9999 : x.q3));

    return (
        <Box padding={"20px"} sx={{ width: '1300px', maxWidth: '100%' }} >
            <TableContainer component={Paper} style={{ borderRadius: 12 }}>
                <Typography fontWeight={"bold"} fontSize={22} sx={{ m: 2 }}>
                    {year} {round.slice(3)} {session} Results
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography>Pos</Typography></TableCell>
                            <TableCell><Typography>Driver</Typography></TableCell>
                            <TableCell><Typography>Team</Typography></TableCell>
                            <TableCell><Typography>Q1</Typography></TableCell>
                            <TableCell><Typography>Q2</Typography></TableCell>
                            <TableCell><Typography>Q3</Typography></TableCell>
                            <TableCell><Typography>Laps</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.map((result) => (
                            <TableRow key={result.position}>
                                <TableCell>
                                    <Typography fontWeight={result.position <= 3 ? "bold" : "regular"} color={result.position <= 3 ? ["#ffc247", "#a8a8a8", "#CD7F32"][result.position - 1] : "#EAEAEA"}>
                                        {result.position}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>{result.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>{result.team}</Typography>
                                </TableCell>
                                <TableCell>
                                    {fastq1 === result.q1 ? (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb' }} />
                                            <Typography fontWeight="bold" color="#db34eb">
                                                {formatToMinSecMillis(result.q1)}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        result.q1 == -1 ?
                                            <Typography></Typography>
                                            :
                                            <Typography>+{(result.q1 - fastq1).toFixed(3)}</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {fastq2 === result.q2 ? (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb' }} />
                                            <Typography fontWeight="bold" color="#db34eb">
                                                {formatToMinSecMillis(result.q2)}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        result.q2 == -1 ?
                                            <Typography></Typography>
                                            :
                                            <Typography>+{(result.q2 - fastq2).toFixed(3)}</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {fastq3 === result.q3 ? (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb' }} />
                                            <Typography fontWeight="bold" color="#db34eb">
                                                {formatToMinSecMillis(result.q3)}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        result.q3 == -1 ?
                                            <Typography></Typography>
                                            :
                                            <Typography>+{(result.q3 - fastq3).toFixed(3)}</Typography>
                                    )}
                                </TableCell>
                                <TableCell><Typography>{result.laps}</Typography></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};


interface PracticeResultsTableProps {
    results: PracticeResult[];
    year: string;
    round: string;
    session: string;
}

export const PracticeResultsTable: React.FC<PracticeResultsTableProps> = ({ results, year, round, session }) => {
    let fastestLap = Math.min(...results.map((x) => x.fastestLap == -1 ? 9999 : x.fastestLap));

    return (
        <Box padding={"20px"} sx={{ width: '1300px', maxWidth: '100%' }} >
            <TableContainer component={Paper} style={{ borderRadius: 12 }}>
                <Typography fontWeight={"bold"} fontSize={22} sx={{ m: 2 }}>
                    {year} {round.slice(3)} {session} Results
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><Typography>Pos</Typography></TableCell>
                            <TableCell><Typography>Driver</Typography></TableCell>
                            <TableCell><Typography>Team</Typography></TableCell>
                            <TableCell><Typography>Fastest Lap</Typography></TableCell>
                            <TableCell><Typography>Laps</Typography></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.map((result) => (
                            <TableRow key={result.position}>
                                <TableCell>
                                    <Typography fontWeight={result.position <= 3 ? "bold" : "regular"} color={result.position <= 3 ? ["#ffc247", "#a8a8a8", "#CD7F32"][result.position - 1] : "#EAEAEA"}>
                                        {result.position}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>{result.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography>{result.team}</Typography>
                                </TableCell>
                                <TableCell>
                                    {fastestLap === result.fastestLap ? (
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <AccessTimeIcon fontSize="small" sx={{ color: '#db34eb' }} />
                                            <Typography fontWeight="bold" color="#db34eb">
                                                {formatToMinSecMillis(result.fastestLap)}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        result.fastestLap == -1 ?
                                            <Typography></Typography>
                                            :
                                            <Typography>+{(result.fastestLap - fastestLap).toFixed(3)}</Typography>
                                    )}
                                </TableCell>
                                <TableCell><Typography>{result.laps}</Typography></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};