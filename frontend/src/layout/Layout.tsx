import React from "react";
import Header from "./Header";
import { Box, Toolbar } from "@mui/material";

type LayoutProps = {
    children?: React.ReactNode;
};
export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
      <Header />
      <Toolbar />

      <Box component="main" sx={{ width: "100%", flex: 1 }}>
        {children}
      </Box>
    </Box>
  );
}