"use client";

import SpeedDistancePage from "../../../components/SpeedDistancePage";
import { usePathname } from "next/navigation";

const SpeedDistance = () => {
    const pathname = usePathname();
    const fileName1 = pathname.split("/")[2];
    const fileName2 = decodeURI(pathname.split("/")[3]);

  return <SpeedDistancePage userURL={fileName1} fileURL={fileName2} />;
};

export default SpeedDistance;