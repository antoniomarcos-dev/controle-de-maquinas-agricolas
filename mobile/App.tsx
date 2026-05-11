import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { UserProfile } from './lib/types';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SelectMachineScreen from './screens/SelectMachineScreen';
import StartServiceScreen from './screens/StartServiceScreen';
import ActiveServiceScreen from './screens/ActiveServiceScreen';
import EndDayScreen from './screens/EndDayScreen';

// Auth Context
interface AuthCtx {
  session: Session | null;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
}
export const AuthContext = createContext<AuthCtx>({ session: null, profile: null, signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('users_profile').select('*').eq('id', userId).single();
    if (data) setProfile(data as UserProfile);
  }

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ session, profile, signOut }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0f0d' } }}>
          {!session ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="SelectMachine" component={SelectMachineScreen} />
              <Stack.Screen name="StartService" component={StartServiceScreen} />
              <Stack.Screen name="ActiveService" component={ActiveServiceScreen} />
              <Stack.Screen name="EndDay" component={EndDayScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
