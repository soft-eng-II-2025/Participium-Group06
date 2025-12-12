// src/tests/pages/AdminRegisterPage.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminRegisterPage from "../../pages/AdminRegisterPage";
import { useRegisterMunicipalityOfficer } from "../../hook/adminApi.hook";
import { BrowserRouter } from "react-router-dom";
import { CreateOfficerRequestDTO } from "../../DTOs/CreateOfficerRequestDTO";

// Mock the hook
jest.mock("../../hook/adminApi.hook");
const mockedUseRegister = useRegisterMunicipalityOfficer as jest.Mock;

const mockNavigate = jest.fn();

// Mock react-router-dom useNavigate
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockNavigate,
}));

describe("AdminRegisterPage", () => {
  const dummyPayload: CreateOfficerRequestDTO = {
    first_name: "Test",
    last_name: "Officer",
    username: "testofficer",
    password: "password123",
    email: "officer@example.com",
    external: true, // will be overridden to false in the handler
  };

  beforeEach(() => {
    mockNavigate.mockReset();
    mockedUseRegister.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ status: 201 }),
      isPending: false,
      error: null,
    });
  });

  const renderPage = () =>
    render(
      <BrowserRouter>
        <AdminRegisterPage />
      </BrowserRouter>
    );

  test("renders registration form with title", () => {
    renderPage();

    expect(
      screen.getByText(/create municipality officer/i)
    ).toBeInTheDocument();

    // Updated button text to match actual DOM
    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
  });

  test("calls mutation on form submit and navigates on success", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue({ status: 201 });
    mockedUseRegister.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
    });

    renderPage();

    // Fill all form fields
    fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: dummyPayload.first_name },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: dummyPayload.last_name },
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: dummyPayload.username },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: dummyPayload.email },
    });

    // Handle multiple password inputs
    const passwordInputs = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordInputs[0], { target: { value: dummyPayload.password } });
    fireEvent.change(passwordInputs[1], { target: { value: dummyPayload.password } });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
        ...dummyPayload,
        external: false,
        });
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    });


  test("displays server error message if mutation fails", async () => {
    mockedUseRegister.mockReturnValue({
      mutateAsync: jest.fn().mockRejectedValue(new Error("Failed")),
      isPending: false,
      error: true,
    });

    renderPage();

    expect(
      screen.getByText(/registration failed\. please try again\./i)
    ).toBeInTheDocument();
  });

  test("disables submit button when loading", () => {
    mockedUseRegister.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
      error: null,
    });

    renderPage();

    // Updated button text to match loading state
    const submitButton = screen.getByRole("button", { name: /registering.../i });
    expect(submitButton).toBeDisabled();
  });
});
