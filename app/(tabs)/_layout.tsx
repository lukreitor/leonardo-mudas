import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/theme/typography';
import { useThemeColors } from '@/theme/hook';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, mode } = useThemeColors();
  const bottomPad = Math.max(insets.bottom, 12);
  const tabHeight = 56 + bottomPad;
  const isDark = mode === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mata,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: {
          fontFamily: fonts.uiSemibold,
          fontSize: 10,
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,58,46,0.06)',
          height: tabHeight,
          paddingBottom: bottomPad,
          paddingTop: 10,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : isDark ? 'rgba(14,27,20,0.95)' : 'rgba(255,255,255,0.95)',
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(14,27,20,0.95)' : 'rgba(255,255,255,0.95)' }]} />
          ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Semana',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="farms"
        options={{
          title: 'Fazendas',
          tabBarIcon: ({ color }) => <Ionicons name="leaf-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="financial"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="currency-usd" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
