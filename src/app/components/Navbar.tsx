"use client"; // Needed in Next.js App Router

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { AppBar, Toolbar, Button, Box, Typography, Avatar } from "@mui/material";
import { exo2, exo2Regular } from "../styles";
import { onAuthStateChanged, User, getAuth } from 'firebase/auth'; // Import User type
import { auth } from '../firebaseConfig';


export default function Navbar() {
  const [user, setUser] = useState<User | null>(null); // Explicitly type as User | null

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // TypeScript knows currentUser is User | null
    });

    return () => unsubscribe();
  }, []);



  return (
    <AppBar position="static">
      <Toolbar>
        <Button
          color="inherit"
          component={Link}
          href="/" // Use href instead of to for Next.js Link
          sx={{ textTransform: "none" }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: "24px", fontWeight: "bold", fontFamily: exo2.style.fontFamily }}
          >
            F1-Metrics
          </Typography>
        </Button>
        <Box sx={{ marginLeft: "auto" }} flexDirection={"row"} display={"flex"} gap={2} alignItems={"center"}>
          <Button
            variant="outlined"
            sx={{
              color: 'red',
              borderColor: 'red',
              fontWeight: 'bold',
              ml: 2,
              textTransform: 'none',
              fontFamily: exo2Regular.style.fontFamily,
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
              height: "38px"
            }}
            component={Link}
            href="/liveDash"
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: 'red',
                marginRight: 1,
                animation: 'flash 1s infinite ease-in-out',
              }}
            />
            LIVE
          </Button>
          {user ? (
            <Button
              color="inherit"
              component={Link}
              href="/profile" // Use href instead of to
              sx={{ textTransform: "none", fontFamily: exo2Regular.style.fontFamily }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={user.photoURL || "/default-avatar.png"} // Default avatar if no photo URL
                  // alt={user.displayName}
                  sx={{
                    width: 32,
                    height: 32,
                    border: "2px solid lightgrey",
                    marginRight: 1
                  }}

                />
                <Typography
                  sx={{ color: 'lightgrey', fontFamily: exo2.style.fontFamily, fontWeight: "700", fontSize: 22, }}
                >
                  {`${user.displayName || 'User'}`}
                </Typography>
                {/* <Typography
                  sx={{ color: 'inherit', fontFamily: exo2.style.fontFamily}}
                >
                  {`${user.email}`}
                </Typography> */}
              </Box>
            </Button>
          ) : (
            <>
              <Button
                color="inherit"
                component={Link}
                href="/login" // Use href instead of to
                sx={{ textTransform: "none", fontFamily: exo2Regular.style.fontFamily }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                component={Link}
                href="/signup" // Use href instead of to
                sx={{ textTransform: "none", fontFamily: exo2Regular.style.fontFamily }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}