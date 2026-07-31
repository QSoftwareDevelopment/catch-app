import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import LogInScreen from '../app/(auth)/log-in';

const mockSignIn = jest.fn<Promise<void>, [string, string]>();
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSignIn.mockResolvedValue(undefined);
});

describe('LogInScreen', () => {
  it('signs in and leaves navigation to the root layout', async () => {
    render(<LogInScreen />);
    fireEvent.changeText(screen.getByTestId('log-in-email'), 'owner@northsideair.com');
    fireEvent.changeText(screen.getByTestId('log-in-password'), 'a-good-password');
    fireEvent.press(screen.getByTestId('log-in-submit'));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith('owner@northsideair.com', 'a-good-password'),
    );
    // Routing is session-driven; the screen must not navigate on its own or it will
    // race the provider.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('accepts a short password so accounts predating the length rule still work', async () => {
    render(<LogInScreen />);
    fireEvent.changeText(screen.getByTestId('log-in-email'), 'owner@northsideair.com');
    fireEvent.changeText(screen.getByTestId('log-in-password'), 'old');
    fireEvent.press(screen.getByTestId('log-in-submit'));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
  });

  it('shows a neutral message for wrong credentials', async () => {
    const error = new Error('Invalid login credentials');
    (error as unknown as { code: string }).code = 'invalid_credentials';
    mockSignIn.mockRejectedValue(error);

    render(<LogInScreen />);
    fireEvent.changeText(screen.getByTestId('log-in-email'), 'owner@northsideair.com');
    fireEvent.changeText(screen.getByTestId('log-in-password'), 'wrong-password');
    fireEvent.press(screen.getByTestId('log-in-submit'));

    await waitFor(() =>
      expect(screen.getByText('That email and password do not match an account.')).toBeTruthy(),
    );
  });

  it('tells an unconfirmed user to check their inbox', async () => {
    const error = new Error('Email not confirmed');
    (error as unknown as { code: string }).code = 'email_not_confirmed';
    mockSignIn.mockRejectedValue(error);

    render(<LogInScreen />);
    fireEvent.changeText(screen.getByTestId('log-in-email'), 'owner@northsideair.com');
    fireEvent.changeText(screen.getByTestId('log-in-password'), 'a-good-password');
    fireEvent.press(screen.getByTestId('log-in-submit'));

    await waitFor(() => expect(screen.getByText(/confirm your email first/i)).toBeTruthy());
  });

  it('does not call the network with an empty form', async () => {
    render(<LogInScreen />);
    fireEvent.press(screen.getByTestId('log-in-submit'));

    await waitFor(() => expect(screen.getByText('Enter your email address')).toBeTruthy());
    expect(screen.getByText('Enter your password')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('does not submit twice on a double tap', async () => {
    let release: () => void = () => {};
    mockSignIn.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    render(<LogInScreen />);
    fireEvent.changeText(screen.getByTestId('log-in-email'), 'owner@northsideair.com');
    fireEvent.changeText(screen.getByTestId('log-in-password'), 'a-good-password');

    const submit = screen.getByTestId('log-in-submit');
    fireEvent.press(submit);
    fireEvent.press(submit);

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledTimes(1));
    // Settle the in-flight request so the trailing state update lands inside act().
    await act(async () => {
      release();
    });
  });

  it('routes to password reset', () => {
    render(<LogInScreen />);
    fireEvent.press(screen.getByText('Forgot password?'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/forgot-password');
  });
});
