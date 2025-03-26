"use client"; // Needed in Next.js App Router for interactive components

import { useState } from "react";
import styles from "./Home.module.css";



export default function Home() {
  const [count, setCount] = useState(0);

  const increment = () => {setCount(count + 1);};

  const reset = () => {setCount(0)};

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#0070f3",
    color: "white",
    border: "none",
    borderRadius: "5px",
    display: "block",
    marginTop: "10px",
  };

  return (
    <main
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginTop: "20px",
      marginBottom: "20px",
      height: "100vh", // Ensures the main container takes full height of the viewport
    }}
    >
      <h1 className={styles.countText}>{count}</h1>
      <button
        onClick={() => {
          console.log("increment()");
          increment();
        }}
        style={buttonStyle}
      >
        Click Me
      </button>
      <button
        onClick={() => {
          console.log("reset()");
          reset();
        }}
        style={buttonStyle}
      >
      Reset
      </button>
    </main>
  );
}
