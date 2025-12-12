// src/tests/email-confirmation.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmailConfirmationPage from '../../pages/EmailConfirmationPage';

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'john', verified: false },
    isAuthenticated: true,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock API hook
const mockMutateAsync = jest.fn();
jest.mock('../../hook/authApi.hook', () => ({
  useConfirmEmail: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

// React Query wrapper
const createWrapper = () => {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('EmailConfirmationPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
  });

  const renderPage = () => {
    const Wrapper = createWrapper();
    return render(
      <Wrapper>
        <BrowserRouter>
          <EmailConfirmationPage />
        </BrowserRouter>
      </Wrapper>
    );
  };

  it('renders 6 inputs', () => {
    renderPage();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('allows inserting digits and rejects letters', () => {
    renderPage();
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: 'A' } });
    expect(inputs[0]).toHaveValue('');

    fireEvent.change(inputs[0], { target: { value: '5' } });
    expect(inputs[0]).toHaveValue('5');
  });

  it('autofocuses next input after typing a digit', () => {
    renderPage();
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: '3' } });
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('fills all inputs on paste', () => {
    renderPage();
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: { getData: () => '123456' },
    });

    inputs.forEach((input, idx) => {
      expect(input).toHaveValue(String(idx + 1));
    });
  });

  it('calls confirmEmail on valid code', async () => {
    renderPage();
    mockMutateAsync.mockResolvedValueOnce({});

    const inputs = screen.getAllByRole('textbox');
    ['1','2','3','4','5','6'].forEach((digit, i) => {
      fireEvent.change(inputs[i], { target: { value: digit } });
    });

    fireEvent.click(screen.getByRole('button', { name: /confirm email/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('123456');
    });
  });

  it('shows error if code invalid', async () => {
    renderPage();

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '9' } });

    fireEvent.click(screen.getByRole('button', { name: /confirm email/i }));

    // Aggiornato al testo reale della pagina
    expect(
      await screen.findByText(/confirmation code we sent/i)
    ).toBeInTheDocument();
  });
});
