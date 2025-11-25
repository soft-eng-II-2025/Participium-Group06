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
import { useAuth } from "../contexts/AuthContext";
import {
  initSocketClient,
  subscribeToNewMessages,
  unsubscribeFromNewMessages,
} from "../services/socketClient";

interface ChatProps {
  reportId: number;
  socketBaseUrl?: string;
}

const Chat: React.FC<ChatProps> = ({
  reportId,
  socketBaseUrl = "http://localhost:3000",
}) => {
  const { senderType, isUser, isOfficer } = useChatIdentity();
  const { loading: authLoading } = useAuth();

  const { data: rawMessages = [], isLoading: messagesLoading } =
    useMessagesByReport(reportId, !!reportId);
  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();

  const [socketReceivedMessages, setSocketReceivedMessages] = useState<
    MessageResponseDTO[]
  >([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Unione messaggi da API + socket
  const allMessages = React.useMemo(() => {
    const uniqueSocketMessages = socketReceivedMessages.filter(
      (sm) =>
        !rawMessages.some(
          (rm) =>
            rm.content === sm.content &&
            rm.sender === sm.sender &&
            new Date(rm.created_at).getTime() ===
              new Date(sm.created_at).getTime()
        )
    );

    const combined = [...rawMessages, ...uniqueSocketMessages];

    return combined.sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
  }, [rawMessages, socketReceivedMessages]);

  // Username dell'utente, usato SOLO quando sei officer
  const otherSideUsername = React.useMemo(() => {
    if (!allMessages.length) return undefined;

    if (isOfficer) {
      /*const userMsg = allMessages.find(
        (m) => m.sender === "USER" && m.username
      );*/
      return allMessages[0].username;
    }

    return undefined;
  }, [allMessages, isOfficer]);

  // Scroll automatico in fondo
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages]);

  // Socket.IO
  useEffect(() => {
    if (!senderType) return;

    initSocketClient({ baseUrl: socketBaseUrl });

    const handleNewMessage = (m: MessageResponseDTO) => {
      // Se non hai ancora reportId nel DTO lato backend, togli pure questo if
      if ((m as any).reportId !== undefined && (m as any).reportId !== reportId) {
        return;
      }
      setSocketReceivedMessages((prev) => [...prev, m]);
    };

    subscribeToNewMessages(handleNewMessage);
    return () => {
      unsubscribeFromNewMessages(handleNewMessage);
    };
  }, [senderType, socketBaseUrl, reportId]);

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
      setError(
        err.response?.data?.error ||
          err.message ||
          "Errore invio messaggio"
      );
    }
  };

  const formatTime = (value: Date | string) => {
    const d = new Date(value);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (m: MessageResponseDTO) => {
    return m.sender === senderType;
  };

  // Stato auth
  if (authLoading) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "85vh",
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Caricamento autenticazione...
        </Typography>
      </Paper>
    );
  }

  if (!senderType) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "85vh",
        }}
      >
        <Typography variant="body2" color="error">
          Errore: Identità utente non definita o non autenticato.
        </Typography>
        <Typography variant="caption" sx={{ mt: 1 }}>
          Assicurati di aver effettuato il login con un ruolo USER o OFFICER
          valido.
        </Typography>
      </Paper>
    );
  }

  // Header: SOLO sottotitolo, niente "report #"
  let headerSubtitle: string;

  if (isOfficer) {
    if (otherSideUsername) {
      headerSubtitle = `Stai chattando con l'utente ${otherSideUsername}`;
    } else {
      headerSubtitle = "Stai chattando con l'utente del report";
    }
  } else if (isUser) {
    headerSubtitle = "Chat con l’operatore assegnato al report";
  } else {
    headerSubtitle = "";
  }

  return (
    <Paper
      elevation={3}
      sx={{ display: "flex", flexDirection: "column", height: "85vh" }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {headerSubtitle && (
          <Typography variant="caption" color="text.secondary">
            {headerSubtitle}
          </Typography>
        )}
      </Box>

      {/* Area messaggi */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1,
          overflowY: "auto",
          bgcolor: "grey.50",
        }}
      >
        {messagesLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {!messagesLoading && !allMessages.length && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Nessun messaggio ancora.
          </Typography>
        )}

        {allMessages.map((m, idx) => {
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
                  <span>{formatTime(m.created_at)}</span>
                </Box>
                <Typography variant="body2">{m.content}</Typography>
              </Box>
            </Box>
          );
        })}

        <div ref={endRef} />
      </Box>

      {/* Input */}
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