import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from './AuthProvider';

/**
 * The provider is the single source of truth for "is anyone signed in", and the root
 * layout routes off it. These tests pin the behaviour that matters there: the three
 * states, and the fact that a failed business fetch must not strand a signed-in user.
 */

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
    },
    from: (table: string) => mockFrom(table),
  },
}));

const BUSINESS = {
  id: 'b-1',
  owner_id: 'u-1',
  name: 'Northside Heating & Air',
  sector: 'hvac',
  created_at: '2026-07-31T00:00:00Z',
  updated_at: '2026-07-31T00:00:00Z',
};

const SESSION = { user: { id: 'u-1', email: 'owner@northsideair.com' } };

function mockBusinessQuery(result: { data: unknown; error: unknown }) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => result,
      }),
    }),
  });
}

function Probe() {
  const { status, business, businessMissing } = useAuth();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="business">{business?.name ?? 'none'}</Text>
      <Text testID="missing">{String(businessMissing)}</Text>
    </>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  mockBusinessQuery({ data: BUSINESS, error: null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('settles to signedOut when there is no stored session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));
    expect(screen.getByTestId('business')).toHaveTextContent('none');
  });

  it('restores a stored session and loads the business', async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedIn'));
    expect(screen.getByTestId('business')).toHaveTextContent('Northside Heating & Air');
    expect(screen.getByTestId('missing')).toHaveTextContent('false');
  });

  it('starts in restoring so a returning user never sees the landing screen flash', async () => {
    // getSession is left unresolved to hold the provider in its initial state.
    mockGetSession.mockReturnValue(new Promise(() => {}));
    renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('restoring');
  });

  it('flags a signed-in user whose business row is missing', async () => {
    // Impossible if the signup trigger is installed, so it is surfaced rather than
    // hidden — it is the symptom of the migration never having been run.
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockBusinessQuery({ data: null, error: null });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('missing')).toHaveTextContent('true'));
    expect(screen.getByTestId('status')).toHaveTextContent('signedIn');
  });

  it('keeps the user signed in when the business fetch fails', async () => {
    // A transient read failure must not bounce someone back to the login screen.
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    mockBusinessQuery({ data: null, error: { message: 'network down' } });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedIn'));
    expect(screen.getByTestId('business')).toHaveTextContent('none');
    expect(screen.getByTestId('missing')).toHaveTextContent('false');
  });

  it('subscribes to auth changes and unsubscribes on unmount', async () => {
    const unsubscribe = jest.fn();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const view = renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signedOut'));

    view.unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
