"use client";

import { useState } from "react";
import darkTheme from "../theme";
import { auth } from "../firebaseConfig";
import { TextField, Button, CssBaseline, ThemeProvider, Stack, Typography } from "@mui/material";
import { defaultTextField } from "../styles"; // Ensure correct spelling
import { signInWithEmailAndPassword } from "firebase/auth";
import Navbar from "../components/Navbar";
import { exo2 } from "../styles";
import { useRouter } from "next/navigation";

export default function LogIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log("User signed up:", userCredential.user);
      router.push("/");
    } catch (error: any) {
      console.error("Sign-up error:", error.message);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
            <Navbar/>
            <form onSubmit={handleLogIn} style={{ textAlign: "center", marginTop: "30px" }}>
                
                {/* Use Stack to ensure proper spacing */}
                <Stack spacing={2} alignItems="center">

                    <Typography variant="h4" fontFamily={exo2.style.fontFamily} fontWeight="600">Log In</Typography>

                    <TextField
                        label="Email"
                        name="email"
                        value={formData.email}
                        sx={defaultTextField}
                        onChange={handleChange}
                        variant="outlined"
                    />

                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        sx={defaultTextField}
                        onChange={handleChange}
                        variant="outlined"
                    />

                    <Button type="submit" variant="contained" color="primary">
                        Log In
                    </Button>
                </Stack>

            </form>
    </ThemeProvider>
  );
}