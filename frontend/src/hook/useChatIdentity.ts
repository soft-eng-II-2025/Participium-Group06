// frontend/src/hook/useChatIdentity.ts
import { useAuth } from "../contexts/AuthContext";
import { UserResponseDTO } from "../DTOs/UserResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../DTOs/MunicipalityOfficerResponseDTO";

export function useChatIdentity() {
  const { user, role } = useAuth();

  const isUser = role === "USER";
  const isOfficer = role === "TECH_AGENT_INFRASTRUCTURE" || role === "TECH_AGENT_MOBILITY" || role === "TECH_AGENT_GREEN_AREAS" || 
                    role === "TECH_AGENT_WASTE_MANAGEMENT" || role === "TECH_AGENT_ENERGY_LIGHTING" || role === "TECH_AGENT_PUBLIC_BUILDINGS";
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