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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from "@mui/icons-material/Send";

import { MessageResponseDTO } from "../DTOs/MessageResponseDTO";
import {
  useMessagesByReportLeadExternal,
  useMessagesByReportOfficerUser,
  useSendMessage,
} from "../hook/messagesApi.hook";
import { useChatIdentity } from "../hook/useChatIdentity";
import { CreateMessageDTO } from "../api/messageApi";
import { useAuth } from "../contexts/AuthContext";
import {
  initSocketClient,
  subscribeToNewMessages,
  unsubscribeFromNewMessages,
} from "../services/socketClient";
import { ChatMode } from "../enums/ChatMode";

interface ChatProps {
  reportId: number;
  chatId?: number;
  chatMode?: ChatMode;
  socketBaseUrl?: string;
  closeChat?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  reportId,
  chatId,
  chatMode,
  socketBaseUrl = "http://localhost:3000",
  closeChat,
}) => {
  const { senderType, isUser, isOfficer, isLead } = useChatIdentity();
  const { user, loading: authLoading } = useAuth();

  // Se lead/external → usiamo hook LeadExternal, altrimenti OfficerUser
  // Hooks sempre chiamati, ma con enabled che li rende "inerti"
  // Determina quale usare (lead/external vs officer/user)
  const isLeadExternalChat = chatMode === ChatMode.LEAD_EXTERNAL;


  // Call both hooks but enable only the one we need. This keeps hook order stable
  // while preventing unnecessary network calls.
  const officerUserQuery = useMessagesByReportOfficerUser(reportId, !isLeadExternalChat);
  const leadExternalQuery = useMessagesByReportLeadExternal(reportId, isLeadExternalChat);


  // Select the active query's data (note: choose leadExternal when isLeadExternalChat === true)
  const rawMessages = isLeadExternalChat
    ? leadExternalQuery.data || []
    : officerUserQuery.data || [];


  const messagesLoading = isLeadExternalChat
    ? leadExternalQuery.isLoading
    : officerUserQuery.isLoading;


  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();

  const [socketReceivedMessages, setSocketReceivedMessages] = useState<MessageResponseDTO[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Merge API + socket messages, removing duplicates
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
    return [...rawMessages, ...uniqueSocketMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [rawMessages, socketReceivedMessages]);

  // Other side username (for header)
  const otherSideUsername = React.useMemo(() => {
    if (!allMessages.length) return undefined;

    if (isUser) {
      return allMessages.find((m) => m.sender !== "USER")?.username;
    } else if (isOfficer) {
      return allMessages.find((m) => m.sender === "USER")?.username;
    } else if (isLead) {
      return allMessages.find((m) => m.sender === "EXTERNAL")?.username;
    } else if (senderType === "EXTERNAL") {
      return allMessages.find((m) => m.sender === "LEAD")?.username;
    }
  }, [allMessages, isUser, isOfficer, isLead, senderType]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Socket setup
  useEffect(() => {
    if (!senderType || !user) return;

    initSocketClient({
      baseUrl: socketBaseUrl,
      UserUsername: isUser ? user.username : undefined,
      OfficerUsername: isOfficer ? user.username : undefined,
      // aggiungiamo eventuale Lead / External se necessario
    });

    const handleNewMessage = (m: MessageResponseDTO) => {
      if (m.reportId !== reportId) return;
      setSocketReceivedMessages((prev) => [...prev, m]);
    };

    subscribeToNewMessages(handleNewMessage);
    return () => unsubscribeFromNewMessages(handleNewMessage);
  }, [senderType, user, isUser, isOfficer, reportId, socketBaseUrl]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !senderType || isUser) return; // Users cannot send

    setError(null);

    const dto: CreateMessageDTO = {
      chat_id: chatId as number,
      content: input.trim(),
      sender: senderType,
    };


    try {
      await sendMessage(dto);
      setInput("");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || err.message || "Failed to send message"
      );
    }
  }

  function formatTime(v: Date | string) {
    return new Date(v).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const isOwn = (m: MessageResponseDTO) => m.sender === senderType;

  // AUTH loading screen
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
          Loading authentication...
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
          Error: user identity not defined.
        </Typography>
      </Paper>
    );
  }

  // Header subtitle
  function getSubtitle(): string {
    if (isLead) {
      if (chatMode === ChatMode.LEAD_EXTERNAL){
        return 'Chat with External Officer';
      }
      return `Chat with Reporter  ${otherSideUsername ? ` (${otherSideUsername})` : ""}`;
    }

    if (isOfficer && senderType !== "EXTERNAL") {
      return `Chat with Reporter ${otherSideUsername ? ` (${otherSideUsername})` : ""}`;
    }
    if (isUser) {
      return 'Chat with Officer';
    }
    if (senderType === "EXTERNAL" && chatMode === ChatMode.LEAD_EXTERNAL) {
      return 'Chat with Officer';
    }
    return "";
  }

  function getUsername(m: MessageResponseDTO): string {
   return m.username ?? "";
  }


  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "85vh",
        borderRadius: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/** back arrow to close the chat and clear mode in parent */}
          {/** show only if parent passed a closeChat callback */}
          {typeof closeChat === 'function' && (
            <IconButton size="small" onClick={() => closeChat?.()} sx={{ mr: 1 }} color="primary">
              <ArrowBackIcon />
            </IconButton>
          )}
          {getSubtitle() && (
            <Typography
              variant="subtitle1"
              sx={{ color: 'primary.main', fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1rem' } }}
            >
              {getSubtitle()}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1,
          overflowY: "auto",
          // bgcolor: "grey.50",
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
            No messages yet.
          </Typography>
        )}

        {allMessages.map((m, idx) => {
          const own = isOwn(m);
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
                  <Typography variant="caption" color="text.main" sx={{mr: 1}}>
                    {own ? "You" : getUsername(m)}
                  </Typography>
                  <Typography variant="caption" color="text.main">
                    {formatTime(m.created_at)}
                  </Typography>
                </Box>
                <Typography variant="body2">{m.content}</Typography>
              </Box>
            </Box>
          );
        })}

        <div ref={endRef} />
      </Box>

      {/* Input (officers, lead, external only) */}
      {!isUser && (
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
            placeholder="Type a message..."
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
      )}
    </Paper>
  );
};

export default Chat;
