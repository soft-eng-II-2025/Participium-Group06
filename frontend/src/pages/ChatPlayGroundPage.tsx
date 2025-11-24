// frontend/src/pages/ChatPlaygroundPage.tsx

import React from "react";
import {
  Container,
  Box,
  Typography,
} from "@mui/material";
import Chat from "../components/Chat";

const ChatPlaygroundPage: React.FC = () => {
  const reportId = 1; // <-- fisso, statico

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Chat Playground
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Test della chat sul report ID {reportId}.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 700 }}>
        <Chat reportId={reportId} />
      </Box>
    </Container>
  );
};

export default ChatPlaygroundPage;