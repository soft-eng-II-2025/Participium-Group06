import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  currentRole?: 'USER' | 'AGENT' | 'LEAD';
  socketBaseUrl?: string;
  closeChat?: () => void;
}

const Chat: React.FC<ChatProps> = ({
  reportId,
  chatId,
  chatMode,
  currentRole,
  socketBaseUrl = "http://localhost:3000",
  closeChat,
}) => {
  const { senderType, isUser, isOfficer, isLead } = useChatIdentity(chatMode, currentRole);
  const { user, loading: authLoading } = useAuth();

  const isLeadExternalChat = chatMode === ChatMode.LEAD_EXTERNAL;

  const officerUserQuery = useMessagesByReportOfficerUser(reportId, !isLeadExternalChat);
  const leadExternalQuery = useMessagesByReportLeadExternal(reportId, isLeadExternalChat);

  const rawMessages = useMemo(() => {
    return isLeadExternalChat
      ? leadExternalQuery.data ?? []
      : officerUserQuery.data ?? [];
  }, [isLeadExternalChat, leadExternalQuery.data, officerUserQuery.data]);

  const messagesLoading = isLeadExternalChat
    ? leadExternalQuery.isLoading
    : officerUserQuery.isLoading;

  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage();

  const [socketReceivedMessages, setSocketReceivedMessages] = useState<MessageResponseDTO[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  useEffect(() => {
    if (!senderType || !user) return;

    initSocketClient({
      baseUrl: socketBaseUrl,
      UserUsername: isUser ? user.username : undefined,
      OfficerUsername: isOfficer ? user.username : undefined,
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
    if (!input.trim() || !senderType || isUser) return;

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

  function getSubtitle(): string {
    if (isLead) {
      if (chatMode === ChatMode.LEAD_EXTERNAL) {
        return 'Chat with External Officer';
      }
      return 'Chat with Reporter';
    }

    if (isOfficer && senderType !== "EXTERNAL") {
      return 'Chat with Reporter';
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
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '70px'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {typeof closeChat === 'function' && (
            <IconButton onClick={() => closeChat?.()} sx={{ mr: 1 }} color="primary">
              <ArrowBackIcon fontSize="medium" />
            </IconButton>
          )}
          {getSubtitle() && (
            <Typography
              variant="h6"
              sx={{ color: 'primary.main', fontWeight: 800 }}
            >
              {getSubtitle()}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1,
          overflowY: "auto",
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
                  maxWidth: "80%",
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: own ? "primary.main" : "grey.300",
                  color: own ? "primary.contrastText" : "text.primary",
                  boxShadow: 1
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                    fontSize: "0.85rem",
                    opacity: 0.9,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 'bold' }}>
                    {own ? "You" : getUsername(m)}
                  </Typography>
                  <Typography variant="caption">
                    {formatTime(m.created_at)}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
                  {m.content}
                </Typography>
              </Box>
            </Box>
          );
        })}

        <div ref={endRef} />
      </Box>

      {!isUser && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            px: 2,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            InputProps={{
              sx: { fontSize: '1.1rem', borderRadius: 3 }
            }}
          />
          <IconButton
            color="primary"
            type="submit"
            disabled={sending || !input.trim()}
            sx={{ p: 1.5 }}
          >
            {sending ? <CircularProgress size={28} /> : <SendIcon sx={{ fontSize: 30 }} />}
          </IconButton>
        </Box>
      )}
    </Paper>
  );
};

export default Chat;