// frontend/src/components/Chat.tsx
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
import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";
import { useMessagesByReport, useSendMessage } from "../hook/messagesApi.hook";
import { useChatIdentity } from "../hook/useChatIdentity";
import { CreateMessageDTO } from "../api/messageApi";

interface ChatProps {
  reportId: number;          // arriva dal componente che apre la chat
}

const Chat: React.FC<ChatProps> = ({ reportId }) => {
  const { senderType, displayName, isUser, isOfficer } = useChatIdentity();

  const { data: messages = [], isLoading } = useMessagesByReport(reportId, !!reportId);
  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = React.useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [messages]
  );

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !senderType) return;

    setError(null);

    const dto: CreateMessageDTO = {
      report_id: reportId,
      content: input.trim(),
      sender: senderType,
    };

    try {
      await sendMessage(dto);
      setInput("");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Errore invio messaggio");
    }
  };

  const formatTime = (value: Date | string) => {
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isOwnMessage = (m: MessageResponseDTO) => {
    if (!senderType || !displayName) return false;
    return m.sender === senderType && m.username === displayName;
  };

  if (!senderType) {
    return (
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="body2">Caricamento identità utente...</Typography>
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
          Chat report #{reportId}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Stai chattando come {isUser ? "utente" : isOfficer ? "operatore" : "sconosciuto"}
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

        {!isLoading && !sortedMessages.length && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nessun messaggio ancora.
          </Typography>
        )}

        {sortedMessages.map((m, idx) => {
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
                  <span>
                    {m.username ||
                      (m.sender === "USER" ? "Utente" : m.role_label ?? "Operatore")}
                  </span>
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