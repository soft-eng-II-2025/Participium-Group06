// src/tests/pages/UserReportsPage.test.tsx
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UserReportsPage from "../../pages/UserReportsPage";
import { useAuth } from "../../contexts/AuthContext";
import { useUserReports } from "../../hook/useUserReports.hook";
import { ChatMode } from "../../enums/ChatMode";
import { StatusType } from "../../DTOs/StatusType";

const mockReports = [
  {
    id: 1,
    longitude: 12.34,
    latitude: 56.78,
    title: "Report 1",
    description: "Description for Report 1",
    user: { id: 1, username: "testuser", email: "test@example.com" },
    category: "Category A",
    status: StatusType.Assigned,
    explanation: "Explanation 1",
    officer: { id: 1, name: "Officer 1" },
    photos: [],
    createdAt: new Date("2025-01-01T10:00:00Z"),
    updatedAt: new Date("2025-01-01T10:00:00Z"),
    chats: [{ id: 101, reportId: 1, type: ChatMode.OFFICER_USER }],
    leadOfficer: { id: 2, name: "Lead Officer" },
  },
  {
    id: 2,
    longitude: 23.45,
    latitude: 67.89,
    title: "Report 2",
    description: "Description for Report 2",
    user: { id: 1, username: "testuser", email: "test@example.com" },
    category: "Category B",
    status: StatusType.Resolved,
    photos: [],
    createdAt: new Date("2025-02-01T10:00:00Z"),
    updatedAt: new Date("2025-02-01T10:00:00Z"),
    chats: [{ id: 102, reportId: 2, type: ChatMode.OFFICER_USER }],
  },
];

// Mock hooks
jest.mock("../../hook/useUserReports.hook");
jest.mock("../../contexts/AuthContext");

const mockedUseUserReports = useUserReports as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

describe("UserReportsPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();

    mockedUseUserReports.mockReturnValue({
      reports: mockReports,
      loading: false,
      error: null,
    });

    mockedUseAuth.mockReturnValue({
      user: { username: "testuser", id: 1, email: "test@example.com" },
    });
  });

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <UserReportsPage />
      </QueryClientProvider>
    );

  test("renders reports list", () => {
    renderPage();

    // Narrow scope to the reports list container
    const listContainer = screen.getByRole("list");
    mockReports.forEach((report) => {
      expect(
        within(listContainer).getByText(report.title)
      ).toBeInTheDocument();
    });

    // Check that the preview shows the first report
    expect(screen.getByText(/description for report 1/i)).toBeInTheDocument();
  });

  test("selecting a report updates the preview", () => {
    renderPage();

    const listContainer = screen.getByRole("list");
    fireEvent.click(within(listContainer).getByText("Report 2"));

    expect(screen.getByText(/description for report 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/description for report 1/i)).not.toBeInTheDocument();
  });

  test("shows loading and error states", () => {
    mockedUseUserReports.mockReturnValueOnce({
      reports: [],
      loading: true,
      error: null,
    });
    renderPage();
    expect(screen.getByText(/loading your reports/i)).toBeInTheDocument();

    mockedUseUserReports.mockReturnValueOnce({
      reports: [],
      loading: false,
      error: "Network Error",
    });
    renderPage();
    expect(screen.getByText(/failed to load reports/i)).toBeInTheDocument();
  });
});
