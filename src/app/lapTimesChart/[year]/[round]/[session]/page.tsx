"use client";

import LapTimesChartPage from "../../../../components/LapTimesChartPage";
import { useParams } from "next/navigation";

const LapTimesChart = () => {
    const params = useParams();
    const year = params.year as string;
    const round = decodeURIComponent(params.round as string);
    const session = decodeURIComponent(params.session as string);

    return <LapTimesChartPage yearURL={year} roundURL={round} sessionURL={session} uidURL={undefined} fileURL={undefined} />;
};

export default LapTimesChart;