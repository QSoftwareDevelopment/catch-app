import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { SignUpInput } from '@/auth/AuthProvider';

import SignUpScreen from '../app/(auth)/sign-up';

/**
 * Signup is the only screen that writes a business, and sector is the field that decides
 * features and price. These tests cover the paths that would silently produce a bad
 * account: submitting without a sector, double-tapping submit, and a duplicate email.
 */

const mockSignUp = jest.fn<Promise<void>, [SignUpInput]>();
const mockReplace = jest.fn();

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ signUp: mockSignUp }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

function fillValidForm() {
  fireEvent.changeText(screen.getByTestId('sign-up-email'), 'owner@northsideair.com');
  fireEvent.changeText(screen.getByTestId('sign-up-password'), 'a-good-password');
  fireEvent.changeText(screen.getByTestId('sign-up-business-name'), 'Northside Heating');
  fireEvent.press(screen.getByTestId('sector-hvac'));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSignUp.mockResolvedValue(undefined);
});

describe('SignUpScreen', () => {
  it('creates the account and routes to the confirmation screen', async () => {
    render(<SignUpScreen />);
    fillValidForm();
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'owner@northsideair.com',
      password: 'a-good-password',
      businessName: 'Northside Heating',
      sector: 'hvac',
    });
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/(auth)/check-email',
      params: { email: 'owner@northsideair.com' },
    });
  });

  it('refuses to submit without a sector', async () => {
    // An account with no sector would be served no features and billed nothing, so this
    // must never reach the network.
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByTestId('sign-up-email'), 'owner@northsideair.com');
    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'a-good-password');
    fireEvent.changeText(screen.getByTestId('sign-up-business-name'), 'Northside Heating');

    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(screen.getByText('Choose the sector you work in')).toBeTruthy());
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('shows every field error at once rather than one per submit', async () => {
    render(<SignUpScreen />);
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(screen.getByText('Enter your email address')).toBeTruthy());
    expect(screen.getByText('Enter a password')).toBeTruthy();
    expect(screen.getByText('Enter your business name')).toBeTruthy();
    expect(screen.getByText('Choose the sector you work in')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates locally before hitting the network', async () => {
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByTestId('sign-up-email'), 'not-an-email');
    fireEvent.changeText(screen.getByTestId('sign-up-password'), 'short');
    fireEvent.changeText(screen.getByTestId('sign-up-business-name'), 'Northside Heating');
    fireEvent.press(screen.getByTestId('sector-restaurant'));

    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() =>
      expect(screen.getByText('That does not look like an email address')).toBeTruthy(),
    );
    expect(screen.getByText('Use at least 8 characters')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('does not create two accounts when submit is double-tapped', async () => {
    let release: () => void = () => {};
    mockSignUp.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    render(<SignUpScreen />);
    fillValidForm();

    const submit = screen.getByTestId('sign-up-submit');
    fireEvent.press(submit);
    fireEvent.press(submit);
    fireEvent.press(submit);

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
    // Settle the in-flight request so the trailing state update lands inside act().
    await act(async () => {
      release();
    });
  });

  it('puts a duplicate-email error on the email field', async () => {
    const error = new Error('User already registered');
    (error as unknown as { code: string }).code = 'user_already_exists';
    mockSignUp.mockRejectedValue(error);

    render(<SignUpScreen />);
    fillValidForm();
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() =>
      expect(screen.getByText('That email is already registered. Try logging in.')).toBeTruthy(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('reports a network failure without losing what was typed', async () => {
    mockSignUp.mockRejectedValue(new Error('Network request failed'));

    render(<SignUpScreen />);
    fillValidForm();
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() =>
      expect(screen.getByText('Could not reach Catch. Check your connection and try again.')).toBeTruthy(),
    );
    // Retrying must not mean retyping the whole form.
    expect(screen.getByTestId('sign-up-business-name').props.value).toBe('Northside Heating');
  });

  it('re-enables submit after a failure so the user can retry', async () => {
    mockSignUp.mockRejectedValueOnce(new Error('Network request failed'));

    render(<SignUpScreen />);
    fillValidForm();
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));

    mockSignUp.mockResolvedValue(undefined);
    fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(2));
  });
});
