

export interface AssignRoleRequestDTO {
    username: string;
    roleTitle: string | null;
    external: boolean | null;
    companyName: string | null;
}