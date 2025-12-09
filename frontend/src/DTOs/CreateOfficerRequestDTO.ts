
export interface CreateOfficerRequestDTO {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    external: boolean;
}