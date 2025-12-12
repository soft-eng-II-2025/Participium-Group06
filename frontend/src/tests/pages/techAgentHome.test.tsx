import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TechAgentHomePage from '../../pages/TechAgentHomePage';
import { AuthProvider } from '../../contexts/AuthContext';
import { useGetTechReports } from '../../hook/techApi.hook';
import { StatusType } from '../../DTOs/StatusType';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../hook/techApi.hook', () => ({
  useGetTechReports: jest.fn(),
}));

const mockReports = [
  {
    id: 1,
    title: "Report 1",
    status: StatusType.Assigned,
    chats: [],
    longitude: 0,
    latitude: 0,
    description: "Test description",
    user: { username: "user1", first_name: "User", last_name: "One", external: false, email: "" },
    category: "Maintenance",
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const queryClient = new QueryClient();

const renderPage = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TechAgentHomePage />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );

describe('TechAgentHomePage', () => {
  beforeEach(() => {
    (useGetTechReports as jest.Mock).mockReturnValue({ data: mockReports });
  });

  test('renders report list', () => {
    renderPage();
    expect(screen.getByText('Report 1')).toBeInTheDocument();
  });

  test('opens preview when a report is selected', () => {
    renderPage();
    fireEvent.click(screen.getByText('Report 1'));
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });
});
