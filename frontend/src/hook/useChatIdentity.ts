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
  const isLead = role === "TECH_LEAD_INFRASTRUCTURE" || role === "TECH_LEAD_MOBILITY" || role === "TECH_LEAD_GREEN_AREAS" || 
                    role === "TECH_LEAD_WASTE_MANAGEMENT" || role === "TECH_LEAD_ENERGY_LIGHTING" || role === "TECH_LEAD_PUBLIC_BUILDINGS";

  let senderType: "USER" | "OFFICER" | "EXTERNAL" | "LEAD" | null = null;
  let displayName: string | undefined;

  if (isUser && user) {
    const u = user as UserResponseDTO;
    senderType = "USER";
    displayName = u.username;
  } else if (isOfficer && user) {
    const o = user as MunicipalityOfficerResponseDTO;
    if(o.external) {
      senderType = "EXTERNAL";
      displayName = o.username;
    } else {
      senderType = "OFFICER";
      displayName = o.roles? o.roles[0] : o.username;
    }
  } else if (isLead && user) {
    senderType = "LEAD";
    const o = user as MunicipalityOfficerResponseDTO;
    displayName = o.roles? o.roles[0] : o.username;
  }

  return {
    senderType,
    displayName,
    isUser,
    isOfficer,
    isAdmin,
    isLead
  };
}