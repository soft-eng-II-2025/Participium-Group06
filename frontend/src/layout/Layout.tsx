import React from "react";
import Header from "./Header";
import { Container, Box, Stack } from "@mui/material";

type LayoutProps = {
    children?: React.ReactNode;
};
export default function Layout({ children }: LayoutProps) {
  return (
   <Box sx={{ display: "flex" , minWidth: "100vh" }}>
      <Header />
      <Box>
        {children}
      </Box>
    </Box>
  );
}