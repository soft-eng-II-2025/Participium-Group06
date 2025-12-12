import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TechLeadHomePage from "../../pages/TechLeadHomePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../../contexts/AuthContext";

// ---- MOCK HOOKS ----
import {
  useGetTechLeadReports,
  useAssignTechAgent,
  useGetAgentsByTechLead,
} from "../../hook/techleadApi.hook";

jest.mock("../../hook/techleadApi.hook", () => ({
  useGetTechLeadReports: jest.fn(),
  useAssignTechAgent: jest.fn(),
  useGetAgentsByTechLead: jest.fn(),
}));

// ---- FIX PORTAL ----
jest.mock("@mui/material/Portal", () => {
  return function MockPortal({ children }: any) {
    return <div data-testid="portal-root">{children}</div>;
  };
});

// ---- MOCK MUI useMediaQuery ----
jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    useMediaQuery: jest.fn(() => false),
  };
});

// ---- MOCK DATA ----
const mockReports = [
  {
    id: 1,
    title: "Report 1",
    status: "Assigned",
    chats: [],
    longitude: 0,
    latitude: 0,
    description: "Test description",
    user: {
      username: "user1",
      first_name: "User",
      last_name: "One",
      external: false,
      email: "",
    },
    category: "Maintenance",
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockMutateAsync = jest.fn();

// ---- BEFORE EACH ----
beforeEach(() => {
  (useGetTechLeadReports as jest.Mock).mockReturnValue({
    data: mockReports,
  });

  (useAssignTechAgent as jest.Mock).mockReturnValue({
    mutateAsync: mockMutateAsync,
  });

  (useGetAgentsByTechLead as jest.Mock).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  });

  jest.clearAllMocks();
});

// ---- RENDER FUNCTION ----
const queryClient = new QueryClient();

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TechLeadHomePage />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

// ---- TESTS ----
describe("TechLeadHomePage", () => {
  test("renders report list", () => {
    renderPage();
    expect(screen.getByText("Report 1")).toBeInTheDocument();
  });

  test("opens preview when a report is selected", () => {
    renderPage();
    fireEvent.click(screen.getByText("Report 1"));
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

});
