import {UserDTO} from "./UserDTO";

export interface ReportDTO {
    longitude: number;
    latitude: number;
    title: string;
    description: string;
    user: UserDTO;
    categoryId: number;
    photos: string[];
}