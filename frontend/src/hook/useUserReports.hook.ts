import { useState, useEffect } from "react";
import { UserApi } from "../api/userApi";
import { ReportResponseDTO } from "../DTOs/ReportResponseDTO";

const userApi = new UserApi();

export function useUserReports(username: string) {
    const [reports, setReports] = useState<ReportResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log("Fetching reports for username:", username);
        if (!username) return;

        const fetchReports = async () => {
            try {
                setLoading(true);
                const data = await userApi.getUserReports(username);
                setReports(data);
            } catch (err: any) {
                setError(err.message || "Failed to fetch reports");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [username]);

    return { reports, loading, error };
}
