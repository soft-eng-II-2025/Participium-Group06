// frontend/src/hook/useChatIdentity.ts
import { useAuth } from "../contexts/AuthContext";
import { UserResponseDTO } from "../DTOs/UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";

export function useChatIdentity() {
  const { user, role } = useAuth();

  const isUser = role === "USER";
  const isOfficer = role === "OFFICER";
  const isAdmin = role === "ADMIN";

  let senderType: "USER" | "OFFICER" | null = null;
  let displayName: string | undefined;

  if (isUser && user) {
    const u = user as UserResponseDTO;
    senderType = "USER";
    displayName = u.username;
  } else if (isOfficer && user) {
    const o = user as MunicipalityOfficerResponseDTO;
    senderType = "OFFICER";
    displayName = o.username;
  }

  return {
    senderType,
    displayName,
    isUser,
    isOfficer,
    isAdmin,
  };
}