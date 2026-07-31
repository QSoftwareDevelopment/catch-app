import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import HomeScreen from '../app/(app)/index';

/**
 * Home is where sector stops being a stored value and starts changing the product, so
 * the tests focus on the sector-driven tile and on Settings staying out of the primary
 * group.
 */

const mockPush = jest.fn();
let mockAuth: {
  business: { name: string; sector: string } | null;
  businessMissing: boolean;
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = {
    business: { name: 'Northside Heating & Air', sector: 'hvac' },
    businessMissing: false,
  };
});

describe('HomeScreen', () => {
  it('shows the three primary destinations', () => {
    render(<HomeScreen />);
    expect(screen.getByTestId('tile-conversations')).toBeTruthy();
    expect(screen.getByTestId('tile-catalog')).toBeTruthy();
    expect(screen.getByTestId('tile-outreach')).toBeTruthy();
  });

  it('names the middle tile after what the sector sells', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Our Services')).toBeTruthy();
  });

  it.each([
    ['restaurant', 'Our Menu Items'],
    ['real_estate', 'Our Property Listings'],
    ['fitness', 'Our Memberships & Classes'],
    ['auto_repair', 'Our Services'],
  ])('renders %s as "%s"', (sector, expected) => {
    mockAuth.business = { name: 'Test Co', sector };
    render(<HomeScreen />);
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('falls back to a generic noun when the business has no sector', () => {
    // Every existing row in the database is in this state until the migration runs.
    mockAuth.business = null;
    render(<HomeScreen />);
    expect(screen.getByText('Our Offerings')).toBeTruthy();
  });

  it('shows the business name', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Northside Heating & Air')).toBeTruthy();
  });

  it('routes each tile to its own screen', () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByTestId('tile-conversations'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/conversations');

    fireEvent.press(screen.getByTestId('tile-catalog'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/catalog');

    fireEvent.press(screen.getByTestId('tile-outreach'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/outreach');
  });

  it('keeps Settings out of the primary tile group', () => {
    // Settings must not be reachable by a mis-tap aimed at a daily action, so it is a
    // separate control rather than a fourth tile.
    render(<HomeScreen />);
    const settings = screen.getByTestId('home-settings');
    expect(settings).toBeTruthy();

    fireEvent.press(settings);
    expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
  });

  it('warns when the business record is missing instead of rendering blank', () => {
    mockAuth = { business: null, businessMissing: true };
    render(<HomeScreen />);
    expect(screen.getByText(/no business record/i)).toBeTruthy();
  });
});
