// frontend: src/hooks/useChatIdentity.ts
import { useAuth } from "../contexts/AuthContext";
import { UserResponseDTO } from "../DTOs/UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";

export type SenderTypeFE = "USER" | "OFFICER";

export function useChatIdentity() {
  const { user, role } = useAuth();

  const isUser = role === "USER";
  const isOfficer = role === "OFFICER";
  const isAdmin = role === "ADMIN";

  let senderType: SenderTypeFE | null = null;
  let currentId: number | undefined;

  if (isUser && user) {
    const u = user as UserResponseDTO;
    senderType = "USER";
    currentId = u.userId;
  } else if (isOfficer && user) {
    const o = user as MunicipalityOfficerResponseDTO;
    senderType = "OFFICER";
    currentId = o.id;
  }

  return {
    senderType,
    currentId,   // userId se USER, officerId se OFFICER
    isUser,
    isOfficer,
    isAdmin,
  };
}