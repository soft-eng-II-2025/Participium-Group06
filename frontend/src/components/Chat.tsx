// frontend: src/components/Chat.tsx
import React, { FormEvent, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";
import { useMessagesByReport, useSendMessage } from "../hook/messagesApi.hook";
import { useChatIdentity } from "../hook/useChatIdentity";
import {
  initSocketClient,
  subscribeToNewMessages,
  unsubscribeFromNewMessages,
} from "../services/socketClient";
import { SendMessageRequestDTO } from "../api/messageApi";

interface ChatProps {
  report: ReportResponseDTO;     // contiene id, user, officer
  socketBaseUrl?: string;
}

const Chat: React.FC<ChatProps> = ({ report, socketBaseUrl = "http://localhost:3000" }) => {
  const reportId = report.id;
  const { senderType, currentId, isUser, isOfficer } = useChatIdentity();

  const { data: messages = [], isLoading } = useMessagesByReport(reportId, !!reportId);
  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage(reportId);

  const [localMessages, setLocalMessages] = useState<MessageResponseDTO[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);

  // sync iniziale
  useEffect(() => {
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setLocalMessages(sorted);
  }, [messages]);

  // scroll
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages]);

  // socket
  useEffect(() => {
    if (!senderType || !currentId) return;

    initSocketClient({
      baseUrl: socketBaseUrl,
      userId: isUser ? currentId : undefined,
      officerId: isOfficer ? currentId : undefined,
    });

    const handleNewMessage = (m: MessageResponseDTO) => {
      if (m.report_id !== reportId) return;
      setLocalMessages((prev) => [...prev, m]);
    };

    subscribeToNewMessages(handleNewMessage);
    return () => {
      unsubscribeFromNewMessages(handleNewMessage);
    };
  }, [senderType, currentId, isUser, isOfficer, reportId, socketBaseUrl]);

  // chi è il destinatario
  const getRecipientId = (): number | undefined => {
    if (!senderType) return undefined;

    if (senderType === "USER") {
      return report.officer?.id;      // user -> officer
    }
    if (senderType === "OFFICER") {
      return report.user.userId;      // officer -> user
    }
    return undefined;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !senderType || !currentId) return;

    const recipientId = getRecipientId();

    if (senderType === "USER" && !report.officer) {
      setError("Nessun operatore assegnato al report al momento.");
      return;
    }

    setError(null);

    const payload: SendMessageRequestDTO = {
      content: input.trim(),
      reportId,
      senderType,
      recipientId,
    };

    try {
      const msg = await sendMessage(payload);
      setInput("");
      setLocalMessages((prev) => [...prev, msg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore durante l'invio del messaggio");
    }
  };

  const isOwnMessage = (m: MessageResponseDTO) => {
    if (!senderType || !currentId) return false;

    if (senderType === "USER") {
      return m.sender === "USER" && m.user?.userId === currentId;
    }
    if (senderType === "OFFICER") {
      return m.sender === "OFFICER" && m.municipality_officer?.id === currentId;
    }
    return false;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!senderType || !currentId) {
    return (
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="body2">Caricamento utente...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ display: "flex", flexDirection: "column", height: 400 }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Chat report #{report.id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Stai chattando come {isUser ? "utente" : "operatore"}
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1,
          overflowY: "auto",
          bgcolor: "grey.50",
        }}
      >
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {!isLoading && !localMessages.length && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nessun messaggio ancora.
          </Typography>
        )}

        {localMessages.map((m, idx) => {
          const own = isOwnMessage(m);
          return (
            <Box
              key={idx}
              sx={{
                display: "flex",
                justifyContent: own ? "flex-end" : "flex-start",
                mb: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: "75%",
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: own ? "primary.main" : "grey.300",
                  color: own ? "primary.contrastText" : "text.primary",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                    fontSize: "0.7rem",
                    opacity: 0.8,
                  }}
                >
                  <span>{m.sender === "USER" ? "Utente" : "Operatore"}</span>
                  <span>{formatTime(m.created_at)}</span>
                </Box>
                <Typography variant="body2">{m.content}</Typography>
              </Box>
            </Box>
          );
        })}

        <div ref={endRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          px: 1,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <TextField
          size="small"
          fullWidth
          placeholder="Scrivi un messaggio..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <IconButton
          color="primary"
          type="submit"
          disabled={sending || !input.trim()}
        >
          {sending ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Chat;