// src/DTOs/UpdateStatusReportDTO.ts

import { StatusType } from "../enums/StatusType";

export interface UpdateStatusReportDTO {
    newStatus: StatusType;
    // opzionale lato type, ma obbligatoria lato backend quando newStatus = Rejected
    explanation?: string;
}
