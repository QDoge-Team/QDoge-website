import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getAccount,
  register,
  submitActivity,
  type AccountStatus,
  type ActivityResult,
} from './src/api';
import { SessionRecorder } from './src/session';

const WALLET_ID_RE = /^[A-Z]{60}$/;

export default function App() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState('');
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [recorder, setRecorder] = useState<SessionRecorder | null>(null);
  const [lastResult, setLastResult] = useState<ActivityResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async (id: string) => {
    try {
      setStatus(await getAccount(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'status fetch failed');
    }
  }, []);

  useEffect(() => {
    if (accountId) void refreshStatus(accountId);
  }, [accountId, refreshStatus]);

  const onRegister = async () => {
    const walletId = walletInput.trim().toUpperCase();
    if (!WALLET_ID_RE.test(walletId)) {
      setError('Enter your 60-letter Qubic wallet ID');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { accountId: id } = await register(walletId);
      setAccountId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'registration failed');
    } finally {
      setBusy(false);
    }
  };

  const onStartWalk = async () => {
    setError(null);
    setLastResult(null);
    const r = new SessionRecorder();
    if (!(await r.start())) {
      setError('No step sensor available on this device');
      return;
    }
    setRecorder(r);
  };

  const onStopWalk = async () => {
    if (!recorder || !accountId) return;
    const telemetry = recorder.stop();
    setRecorder(null);
    setBusy(true);
    try {
      const day = new Date().toISOString().slice(0, 10);
      setLastResult(await submitActivity(accountId, day, telemetry));
      await refreshStatus(accountId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'submit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style='light' />
      <Text style={styles.title}>
        QDOGE <Text style={styles.accent}>Move to Earn</Text>
      </Text>

      {!accountId ? (
        <View style={styles.card}>
          <Text style={styles.label}>LINK YOUR QUBIC WALLET</Text>
          <TextInput
            style={styles.input}
            value={walletInput}
            onChangeText={setWalletInput}
            placeholder='60-letter wallet ID'
            placeholderTextColor='#4b5563'
            autoCapitalize='characters'
            autoCorrect={false}
          />
          <Pressable style={styles.button} onPress={onRegister} disabled={busy}>
            {busy ? (
              <ActivityIndicator color='#000' />
            ) : (
              <Text style={styles.buttonText}>Join the kennel</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>TODAY</Text>
            <Text style={styles.big}>
              {status?.today.creditedSteps ?? 0}
              <Text style={styles.unit}> steps credited</Text>
            </Text>
            <Text style={styles.dim}>
              {status
                ? `${status.today.sessions} sessions · trust ${status.trustScore.toFixed(2)}`
                : 'loading…'}
            </Text>
          </View>

          <View style={styles.card}>
            {recorder ? (
              <Pressable style={[styles.button, styles.stop]} onPress={onStopWalk}>
                <Text style={styles.buttonText}>Finish walkies</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.button} onPress={onStartWalk} disabled={busy}>
                <Text style={styles.buttonText}>Start walkies</Text>
              </Pressable>
            )}
            {lastResult ? (
              <Text style={styles.dim}>
                {lastResult.rejected
                  ? `Session rejected: ${lastResult.reasons.join(', ')}`
                  : `Credited ${lastResult.credited} steps at ${Math.round(lastResult.rate * 100)}%`}
              </Text>
            ) : null}
          </View>

          {status && status.payouts.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.label}>TREATS</Text>
              {status.payouts.map((p) => (
                <Text key={p.epoch} style={styles.dim}>
                  Epoch {p.epoch}: {p.amountQus.toLocaleString()} qus ({p.status})
                </Text>
              ))}
            </View>
          ) : null}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', padding: 20, gap: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 24 },
  accent: { color: '#22d3ee' },
  card: {
    backgroundColor: '#0a0a0a',
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  label: { color: '#9ca3af', fontSize: 11, letterSpacing: 2 },
  big: { color: '#fff', fontSize: 32, fontWeight: '700' },
  unit: { color: '#9ca3af', fontSize: 14, fontWeight: '400' },
  dim: { color: '#9ca3af', fontSize: 13 },
  input: {
    color: '#fff',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#22d3ee',
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: 14,
  },
  stop: { backgroundColor: '#f59e0b' },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 15 },
  error: { color: '#f87171', fontSize: 13 },
});
