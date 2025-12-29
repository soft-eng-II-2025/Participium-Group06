import { useMemo } from "react";
import { ChatMode } from "../enums/ChatMode";

export type SenderType = "LEAD" | "EXTERNAL" | "OFFICER" | "USER";
export interface ChatIdentity {
  senderType?: SenderType;
  isUser: boolean;
  isOfficer: boolean;
  isLead: boolean;
}


export function useChatIdentity(chatMode?: ChatMode, currentUser?: 'USER' | 'AGENT' | 'LEAD') : ChatIdentity { 

  const identity = useMemo<ChatIdentity>(() => {
    if (chatMode === "LEAD_EXTERNAL") {
      return {
        senderType: currentUser === 'LEAD' ? "LEAD" : "EXTERNAL",
        isUser: false,
        isOfficer: currentUser === 'AGENT',
        isLead: currentUser === 'LEAD',
      };
    } else if (chatMode === "OFFICER_USER") {
      if (currentUser === 'AGENT' ) {
        return { senderType: "OFFICER", isUser: false, isOfficer: true, isLead: false };
      } else if (currentUser === 'LEAD') {
        return { senderType: "LEAD", isUser: false, isOfficer: false, isLead: true };
      }else if (currentUser === 'USER') {
        return { senderType: "USER", isUser: true, isOfficer: false, isLead: false };
      }
    }

    return { senderType: undefined, isUser: false, isOfficer: false, isLead: false };
  }, [chatMode, currentUser]);

  return identity;
}