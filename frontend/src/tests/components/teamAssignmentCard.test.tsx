import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamAssignmentCard from '../../components/TeamAssignmentCard';
import { MunicipalityOfficerResponseDTO } from '../../DTOs/MunicipalityOfficerResponseDTO';

const officeMembers: MunicipalityOfficerResponseDTO[] = [
  {
    username: 'john_doe',
    first_name: 'John',
    last_name: 'Doe',
    external: false,
    id: 0,
    email: '',
    role: null,
    companyName: null,
  },
  {
    username: 'jane_smith',
    first_name: 'Jane',
    last_name: 'Smith',
    external: false,
    id: 0,
    email: '',
    role: null,
    companyName: null,
  },
];

const externalMembers: MunicipalityOfficerResponseDTO[] = [
  {
    username: 'ext_gary',
    first_name: 'Gary',
    last_name: 'Jones',
    external: true,
    id: 0,
    email: '',
    role: null,
    companyName: null,
  },
];

describe('TeamAssignmentCard', () => {
  test('renders office and external members', () => {
    render(<TeamAssignmentCard officeMembers={officeMembers} externalMembers={externalMembers} />);

    // Check office members render
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // External members are in collapsed accordion, text should exist
    expect(screen.getByText('Gary Jones')).toBeInTheDocument();
    expect(screen.getByText('External')).toBeInTheDocument();
  });

  test('selecting an office member enables button and calls onAction', async () => {
    const onAction = jest.fn();
    render(<TeamAssignmentCard officeMembers={officeMembers} externalMembers={[]} onAction={onAction} />);

    const johnCard = screen.getByText('John Doe');
    const assignButton = screen.getByRole('button', { name: /Assign to officer/i });

    expect(assignButton).toBeDisabled();

    fireEvent.click(johnCard);

    expect(assignButton).toBeEnabled();

    fireEvent.click(assignButton);
    expect(onAction).toHaveBeenCalledWith('approve', { assignee: 'john_doe' });
  });

  test('selecting an external member enables button and calls onAction', async () => {
    const onAction = jest.fn();
    render(<TeamAssignmentCard officeMembers={[]} externalMembers={externalMembers} onAction={onAction} />);

    // Expand the External Maintainer accordion
    const accordionSummary = screen.getByText('Assign to External Maintainer');
    fireEvent.click(accordionSummary);

    // Wait for the button to appear
    const assignButton = await screen.findByRole('button', { name: /Assign external maintainer/i });
    expect(assignButton).toBeDisabled();

    const garyCard = screen.getByText('Gary Jones');
    fireEvent.click(garyCard);

    expect(assignButton).toBeEnabled();

    fireEvent.click(assignButton);
    expect(onAction).toHaveBeenCalledWith('approve', { assignee: 'ext_gary' });
  });

  test('shows "No office members available" and "No external maintainers available" when empty', () => {
    render(<TeamAssignmentCard officeMembers={[]} externalMembers={[]} />);

    expect(screen.getByText(/No office members available/i)).toBeInTheDocument();
    expect(screen.getByText(/No external maintainers available/i)).toBeInTheDocument();
  });
});
