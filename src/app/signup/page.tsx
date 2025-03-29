"use client";

import { useState } from "react";
import styles from "../Home.module.css";
import darkTheme from "../theme";
import { auth } from "../firebaseConfig";
import { TextField, Button, CssBaseline, ThemeProvider, Stack, Typography } from "@mui/material";
import { defaultTextField } from "../styles"; // Ensure correct spelling
import { createUserWithEmailAndPassword } from "firebase/auth";
import Navbar from "../components/Navbar";
import { exo2, exo2Regular } from "../styles";

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log("User signed up:", userCredential.user);
    } catch (error: any) {
      console.error("Sign-up error:", error.message);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
        <CssBaseline />
            <Navbar/>
            <form onSubmit={handleSignUp} style={{ textAlign: "center", marginTop: "30px" }}>
                
                {/* Use Stack to ensure proper spacing */}
                <Stack spacing={2} alignItems="center">

                    <Typography variant="h4"  fontFamily={exo2.style.fontFamily} fontWeight="600">Sign Up</Typography>

                    <TextField
                        label="Username"
                        name="username"
                        value={formData.username}
                        sx={defaultTextField}
                        onChange={handleChange}
                        variant="outlined"
                    />

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
                        Sign Up
                    </Button>
                </Stack>

            </form>
    </ThemeProvider>
  );
}