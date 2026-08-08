import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBanner, Loading, Screen } from "@/components/ui";
import { AuthProvider, useAuth } from "@/lib/auth";
import { isFirebaseConfigured, missingFirebaseConfig } from "@/lib/firebase";
import { HouseholdProvider, useHousehold } from "@/lib/store";
import { ThemeProvider, useTheme } from "@/lib/theme";

/** Send the user to sign-in, household setup or the app, depending on state. */
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const { householdId, loading, error } = useHousehold();
  const segments = useSegments();
  const router = useRouter();

  const signedIn = !!user;

  useEffect(() => {
    if (initializing || (signedIn && loading)) return;

    const first = segments[0];
    const onSignIn = first === "sign-in";
    const onHousehold = first === "household";

    if (!signedIn && !onSignIn) {
      router.replace("/sign-in");
    } else if (signedIn && !householdId && !onHousehold) {
      router.replace("/household");
    } else if (signedIn && householdId && (onSignIn || onHousehold)) {
      router.replace("/");
    }
  }, [signedIn, householdId, initializing, loading, segments, router]);

  if (initializing || (signedIn && loading)) {
    return (
      <Screen>
        <Loading label="Loading your pantry…" />
      </Screen>
    );
  }

  // Without a household id there is nowhere to route to, so show the reason
  // rather than dropping the user on a setup screen that will fail too.
  if (signedIn && !householdId && error) {
    return (
      <Screen>
        <ErrorBanner message={`Couldn't load your household: ${error}`} />
      </Screen>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ThemedApp />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

/** Inside the provider, so the chrome (status bar, headers) follows the theme. */
function ThemedApp() {
  const { theme, colors } = useTheme();

  if (!isFirebaseConfigured) {
    return (
      <Screen>
        <ErrorBanner
          message={`Firebase isn't configured yet. Add these to .env and restart Expo: ${missingFirebaseConfig.join(", ")}.`}
        />
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <AuthProvider>
        <HouseholdProvider>
          <RouteGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: colors.surface },
                headerTitleStyle: { color: colors.text },
                headerTintColor: colors.primary,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="household" />
              <Stack.Screen
                name="item/[id]"
                options={{
                  headerShown: true,
                  title: "Edit item",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="recipe/[id]"
                options={{ headerShown: true, title: "Recipe" }}
              />
              <Stack.Screen
                name="recipe/new"
                options={{
                  headerShown: true,
                  title: "New recipe",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="shopping/review"
                options={{
                  headerShown: true,
                  title: "Bought all",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="settings"
                options={{ headerShown: true, title: "Household" }}
              />
            </Stack>
          </RouteGuard>
        </HouseholdProvider>
      </AuthProvider>
    </>
  );
}
