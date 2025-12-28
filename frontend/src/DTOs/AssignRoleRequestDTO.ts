

export interface AssignRoleRequestDTO {
    username: string;
    // server expects an array of role titles for assignment
    rolesTitle: string[] | null;
    external: boolean | null;
    companyName: string | null;
}