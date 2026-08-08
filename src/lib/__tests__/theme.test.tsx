import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { ThemeProvider, useTheme } from '../theme';

function Probe() {
  const { theme, colors, toggleTheme } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={toggleTheme}>
      <Text>{`${theme} ${colors.bg}`}</Text>
    </Pressable>
  );
}

beforeEach(() => AsyncStorage.clear());

describe('theme provider', () => {
  it('starts light and swaps the palette when toggled', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByText('light #f6f7f9')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByText('dark #101418')).toBeTruthy();
  });

  it('remembers the choice for the next launch', async () => {
    const first = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await fireEvent.press(screen.getByRole('button'));
    await first.unmount();

    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('dark #101418')).toBeTruthy());
  });

  it('falls back to a usable palette with no provider around it', async () => {
    await render(<Probe />);
    expect(screen.getByText('light #f6f7f9')).toBeTruthy();
  });
});
