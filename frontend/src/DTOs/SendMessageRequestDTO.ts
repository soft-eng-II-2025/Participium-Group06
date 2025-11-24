export interface SendMessageRequestDTO {
    content: string;
    senderType: "USER" | "OFFICER";
}