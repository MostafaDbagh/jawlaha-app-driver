import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, sp } from '@/theme';
import { t } from '@/i18n';
import { usePushRegistration } from '@/features/push/usePushRegistration';

export default function TabsLayout() {
  // Driver is authenticated by the time the tabs render — register for push
  // notifications and wire up tap/foreground handling here.
  usePushRegistration();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primaryColorTheme,
        tabBarInactiveTintColor: AppColors.lightGray,
        tabBarStyle: { backgroundColor: AppColors.white },
        tabBarLabelStyle: { fontSize: sp(12) },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('jobs'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: t('active'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'navigate' : 'navigate-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: t('earnings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('account'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
