import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkAndRequestPermissions,
  openAppSettings,
} from '../services/permissionService';
import { SafeAreaView } from 'react-native-safe-area-context';

const CONSENT_KEY = 'user_consent_v1';

export default function ConsentScreen({ navigation, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  async function acceptAndRequest() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const perms = await checkAndRequestPermissions();

      if (perms.foreground === 'granted') {
        await AsyncStorage.setItem(CONSENT_KEY, 'true');
        setLoading(false);
        onComplete && onComplete();

        // ✅ Navigate to TripList immediately
        navigation.reset({
          index: 0,
          routes: [{ name: 'TripList' }],
        });
        return;
      }

      if (perms.foreground === 'blocked' || perms.background === 'blocked') {
        setStatusMsg(
          '⚠️ Location permission is blocked. Please open Settings and allow full Location access.'
        );
      } else {
        setStatusMsg('❗ Location permission denied. Please allow location tracking.');
      }
    } catch (e) {
      setStatusMsg('Permission check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function openSettings() {
    try {
      await openAppSettings();
    } catch {
      Linking.openSettings();
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Location Tracking Consent</Text>

        <Text style={styles.body}>
          Location access is required to record your trips accurately.
          All data remains stored locally on your device.
          Please allow location access ("Allow all the time") for best experience.
        </Text>

        {statusMsg ? <Text style={styles.status}>{statusMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={acceptAndRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>I Agree & Allow Permissions</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={openSettings}>
          <Text style={styles.linkText}>Open Settings (if permissions blocked)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa' },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0a84ff',
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    color: '#444',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  status: {
    color: '#d32f2f',
    fontWeight: '500',
    marginBottom: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0a84ff',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 18 },
  linkText: { color: '#0a84ff', fontSize: 14, textAlign: 'center' },
});
