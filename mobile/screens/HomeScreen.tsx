import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { getPendingCount } from '../lib/offline';
import { Ionicons } from '@expo/vector-icons';
import { Journey, ServiceOrder, Machine, Vehicle } from '../lib/types';

export default function HomeScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [activeService, setActiveService] = useState<ServiceOrder | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<string>('');
  const [pendingSync, setPendingSync] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];
    const pending = await getPendingCount();
    setPendingSync(pending);

    if (profile) {
      const { data: j } = await supabase.from('journeys').select('*')
        .eq('operator_id', profile.id).eq('date', today).is('garage_return_at', null).maybeSingle();
      setJourney(j as Journey | null);

      const { data: svc } = await supabase.from('service_orders').select('*, machine:machines(*), vehicle:vehicles(*)')
        .eq('operator_id', profile.id).eq('status', 'open').maybeSingle();
      if (svc) {
        setActiveService(svc as ServiceOrder);
        const m = (svc as any).machine;
        const v = (svc as any).vehicle;
        setSelectedEquip(m?.name || v?.plate || '');
      }
    }
  }

  async function handleStartDay() {
    if (!profile) return;
    const { data, error } = await supabase.from('journeys').insert({
      operator_id: profile.id, date: new Date().toISOString().split('T')[0],
    }).select().single();
    if (!error && data) { setJourney(data as Journey); }
  }

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting},</Text>
          <Text style={s.name}>{profile?.name?.split(' ')[0]} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#5a7a73" />
        </TouchableOpacity>
      </View>

      {/* Sync indicator */}
      {pendingSync > 0 && (
        <View style={s.syncBanner}>
          <Ionicons name="cloud-upload-outline" size={18} color="#facc15" />
          <Text style={s.syncText}>{pendingSync} eventos pendentes de sincronização</Text>
        </View>
      )}

      {/* Status Card */}
      <View style={s.statusCard}>
        <Text style={s.statusLabel}>Status da Jornada</Text>
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: journey ? '#22c55e' : '#5a7a73' }]} />
          <Text style={s.statusText}>{journey ? 'Em campo' : 'Na garagem'}</Text>
        </View>
        {journey && (
          <Text style={s.statusDetail}>
            Saída: {new Date(journey.garage_out_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {selectedEquip && <Text style={s.statusDetail}>Equipamento: {selectedEquip}</Text>}
      </View>

      {/* Action Buttons */}
      <View style={s.actions}>
        {!journey ? (
          <ActionButton icon="play-circle" label="Saída da Garagem" subtitle="Iniciar jornada de trabalho"
            color="#16a34a" onPress={handleStartDay} />
        ) : (
          <>
            {!activeService ? (
              <>
                <ActionButton icon="construct" label="Iniciar Serviço" subtitle="Selecionar máquina e começar"
                  color="#16a34a" onPress={() => navigation.navigate('SelectMachine', { journeyId: journey.id })} />
                <ActionButton icon="home" label="Retorno à Garagem" subtitle="Encerrar dia de trabalho"
                  color="#ca8a04" onPress={() => navigation.navigate('EndDay', { journeyId: journey.id })} />
              </>
            ) : (
              <ActionButton icon="checkmark-circle" label="Serviço em Andamento" subtitle="Toque para ver detalhes"
                color="#3b82f6" onPress={() => navigation.navigate('ActiveService', { serviceId: activeService.id })} />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function ActionButton({ icon, label, subtitle, color, onPress }: any) {
  return (
    <TouchableOpacity style={[s.actionBtn, { borderColor: color + '30' }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.actionLabel}>{label}</Text>
        <Text style={s.actionSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#5a7a73" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f0d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 16, color: '#5a7a73' },
  name: { fontSize: 28, fontWeight: '700', color: '#f0fdf4' },
  logoutBtn: { padding: 8 },
  syncBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(234,179,8,0.1)', borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)', borderRadius: 12, padding: 12, marginBottom: 20 },
  syncText: { fontSize: 13, color: '#facc15' },
  statusCard: { backgroundColor: 'rgba(17,25,22,0.9)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)', borderRadius: 16, padding: 20, marginBottom: 24 },
  statusLabel: { fontSize: 12, color: '#5a7a73', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 18, fontWeight: '600', color: '#f0fdf4' },
  statusDetail: { fontSize: 13, color: '#b8d4cc', marginTop: 6 },
  actions: { gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(17,25,22,0.9)', borderWidth: 1, borderRadius: 16, padding: 20 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 16, fontWeight: '600', color: '#f0fdf4' },
  actionSub: { fontSize: 13, color: '#5a7a73', marginTop: 2 },
});
