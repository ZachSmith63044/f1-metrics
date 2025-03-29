import React from "react";
import { Button, Box, Typography } from "@mui/material";
import { exo2, exo2Regular } from "../styles";
import Link from "next/link";

interface PageCardProps {
  url: string;
  description: string;
  pageLink: string;
  title: string;
  onClick: () => void;
}

const PageCard: React.FC<PageCardProps> = ({ url, description, title, pageLink, onClick }) => {
  return (
    <Button
      onClick={onClick}
      sx={{
        height: 350,
        width: 460,
        padding: 0,
        borderRadius: "8px",
        backgroundColor: "#4A4A4A",
        textTransform: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid #ccc",
        overflow: "hidden",
      }}
      component={Link} href={pageLink}
    >
      {/* Image Section */}
      <Box
        sx={{
          height: 260, // Reduced height to leave space for description
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <img
          src={url}
          alt={title}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </Box>

      {/* Description Section (Pushes to Bottom) */}
      <Box
        sx={{
          width: "100%",
          borderTop: "1px solid #ccc",
          padding: "6px",
          flexGrow: 1, // Pushes description to take up remaining space
          display: "flex",
          alignItems: "center", // Centers text vertically
        }}
      >
        <Typography sx={{ fontSize: "14px", color: "#CCCCCC", textAlign: "left", fontFamily: exo2Regular.style.fontFamily }}>{description}</Typography>
      </Box>

      {/* Title Section */}
      <Box
        sx={{
          width: "100%",
          borderTop: "1px solid #ccc",
          borderRadius: "0 0 8px 8px",
          padding: "6px",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "18px", fontWeight: "bold", color: "white", fontFamily: exo2.style.fontFamily }}>{title}</Typography>
      </Box>
    </Button>
  );
};

export default PageCard;
