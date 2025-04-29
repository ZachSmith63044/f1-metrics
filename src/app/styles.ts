import { Exo_2 } from "next/font/google";

export const defaultTextField = {
    "& .MuiOutlinedInput-root": {
        // "& fieldset": { borderColor: "lightblue" },
        // "&:hover fieldset": { borderColor: "blue" },
        // "&.Mui-focused fieldset": { borderColor: "lightblue" },
        width: "300px"
    },
    };

export const exo2 = Exo_2({ weight: "700", subsets: ["latin"] });
export const exo2Regular = Exo_2({ weight: "300", subsets: ["latin"] });


