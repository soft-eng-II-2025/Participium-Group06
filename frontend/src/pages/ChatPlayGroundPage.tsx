// src/pages/ChatPlaygroundPage.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container, Box, Typography, CircularProgress, Alert } from "@mui/material";
import api from "../api/api";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";
import Chat from "../components/Chat";

async function fetchReport(reportId: number): Promise<ReportResponseDTO> {
  const res = await api.get<ReportResponseDTO>(`/messages/${reportId}`);
  return res.data;
}

const ChatPlaygroundPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reportIdParam = searchParams.get("reportId");
  const reportId = reportIdParam ? Number(reportIdParam) : 1; // default: 1

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["playgroundReport", reportId],
    queryFn: () => fetchReport(reportId),
    enabled: !Number.isNaN(reportId),
  });

  if (Number.isNaN(reportId)) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Param reportId non valido.</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Chat Playground
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Stai testando il componente di chat sul report con ID {reportId}.  
          Cambia l’URL in /chat-playground?reportId=2 per provare altri report.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Errore nel caricamento del report: {(error as any)?.message ?? "sconosciuto"}
        </Alert>
      )}

      {!isLoading && !isError && report && (
        <Box sx={{ maxWidth: 700 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">{report.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {report.description}
            </Typography>
          </Box>

          <Chat report={report} />
        </Box>
      )}
    </Container>
  );
};

export default ChatPlaygroundPage;