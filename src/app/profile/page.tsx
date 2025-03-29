"use client";

import React, { useState, useEffect } from 'react';
import styles from "../Home.module.css";
import darkTheme from "../theme";
import { auth } from "../firebaseConfig";
import { TextField, Button, CssBaseline, ThemeProvider, Stack, Typography, Box } from "@mui/material";
import { defaultTextField } from "../styles"; // Ensure correct spelling
import { signInWithEmailAndPassword } from "firebase/auth";
import Navbar from "../components/Navbar";
import { exo2, exo2Regular } from "../styles";
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function LogIn() {

    const [user, setUser] = useState<User | null>(null); // Explicitly type as User | null

        useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); // TypeScript knows currentUser is User | null
        });

        return () => unsubscribe();
        }, []);

    
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
                <Navbar/>
                
                    {/* Use Stack to ensure proper spacing */}
                    <Stack spacing={2} alignItems="center">

                        <Typography variant="h4" fontFamily={exo2.style.fontFamily} fontWeight="600">Profile</Typography>
                        
                        {user ? (
                            <Box>
                                <Typography variant="h4" fontFamily={exo2.style.fontFamily} fontWeight="600">{user.displayName}</Typography>
                                <Typography variant="h4" fontFamily={exo2.style.fontFamily} fontWeight="500">{user.email}</Typography>
                            </Box>
                            
                        ) : (
                            <Typography variant="h4" fontFamily={exo2.style.fontFamily} fontWeight="600">Not Logged In</Typography>
                        )}

                        <Button onClick={() => signOut(auth)} variant="contained" color="primary">
                            Sign Out
                        </Button>
                    </Stack>
        </ThemeProvider>
    );
}