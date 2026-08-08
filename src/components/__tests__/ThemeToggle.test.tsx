import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { ThemeToggle } from '../ThemeToggle';

function CurrentTheme() {
  return <Text>{useTheme().theme}</Text>;
}

beforeEach(() => AsyncStorage.clear());

describe('ThemeToggle', () => {
  it('flips the theme and relabels itself', async () => {
    await render(
      <ThemeProvider>
        <ThemeToggle />
        <CurrentTheme />
      </ThemeProvider>,
    );

    expect(screen.getByText('light')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Switch to dark theme'));

    expect(screen.getByText('dark')).toBeTruthy();
    expect(screen.getByLabelText('Switch to light theme')).toBeTruthy();
  });
});
