import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrips, deleteTrip } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IN_PROGRESS_TRIP_KEY = 'in_progress_trip_v1';
const { width } = Dimensions.get('window');

const TripListScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [hasInProgressTrip, setHasInProgressTrip] = useState(false);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTrips();
    });
    fetchTrips(); // initial load
    return unsubscribe;
  }, [navigation]);

  const fetchTrips = async () => {
    try {
      const dbTrips = await getTrips();
      setTrips(dbTrips);
      console.log('Fetched trips:', dbTrips);
    } catch (e) {
      console.log('Error fetching trips:', e);
    }
  };

  useEffect(() => {
    const checkInProgressTrip = async () => {
      const saved = await AsyncStorage.getItem(IN_PROGRESS_TRIP_KEY);
      setHasInProgressTrip(!!saved);
    };
    checkInProgressTrip();
    const unsubscribe = navigation.addListener('focus', checkInProgressTrip);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = (tripId) => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(tripId);
            fetchTrips();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    let dateStr = item.date;
    let timeStr = item.date;
    try {
      const d = new Date(item.date);
      dateStr = d.toLocaleDateString('en-GB'); // DD/MM/YYYY
      dateStr = dateStr.split('/').reverse().join('-'); // YYYY-MM-DD
      dateStr = dateStr.split('-').reverse().join('-'); // DD-MM-YYYY
      timeStr = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }); 
    } catch {}
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDate}>
            {dateStr} <Text style={{ fontSize: 13, color: '#555' }}> ({timeStr})</Text>
          </Text>

          <Text style={styles.tripMeta}>
            {(() => {
              const totalSec = item.duration || 0;
              const hrs = Math.floor(totalSec / 3600);
              const mins = Math.floor((totalSec % 3600) / 60);
              const secs = totalSec % 60;
              let formatted = '';
              if (hrs > 0) formatted += `${hrs}h `;
              if (mins > 0 || hrs > 0) formatted += `${mins}m `;
              formatted += `${secs}s`;
              return formatted;
            })()}
            <Text>  •  {item.distance ? (item.distance / 1000).toFixed(2) + ' km' : ''}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
          onLongPress={() => handleDelete(item.id)}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      {trips.length === 0 ? (
        // 🔹 Empty State
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptyTitle}>No Trips Yet</Text>
          <Text style={styles.emptyText}>
            You haven’t recorded any trips yet. Start a new trip to begin tracking your journey.
          </Text>
            <TouchableOpacity
              style={styles.startTripButton}
              onPress={() => navigation.navigate('Tracking')}
            >
              <Text style={styles.startTripText}>
                {hasInProgressTrip ? 'Check Trip Status' : 'Start New Trip'}
              </Text>
            </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      {trips.length > 0 && (
        <TouchableOpacity
          style={styles.newTripButton}
          onPress={() => navigation.navigate('Tracking')}
        >
          <Text style={styles.newTripText}>
            {hasInProgressTrip ? 'Check Trip Status' : 'Start New Trip'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa' },
  listContainer: { padding: 16 },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  tripInfo: { flex: 1 },
  tripDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tripMeta: { fontSize: 14, color: '#666' },
  viewButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 12,
  },
  viewButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  newTripButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#0a84ff',
    paddingVertical: 14,
    paddingHorizontal: width * 0.3,
    borderRadius: 30,
    elevation: 5,
  },
  newTripText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // 🔹 Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 15,
  },
  emptyIcon: { fontSize: 64, marginBottom: 12 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 21,
  },
  startTripButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 2,
  },
  startTripText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default TripListScreen;