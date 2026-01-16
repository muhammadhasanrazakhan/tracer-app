import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrips } from '../services/storageService';
import MapPreviewTrip from '../components/mapPreviewTrip';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Alert, Platform, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const { width, height } = Dimensions.get('window');

const TripDetailScreen = ({ route, navigation }) => {
  const { tripId } = route.params;
  const [tripData, setTripData] = useState(null);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    const fetchTrip = async () => {
      const trips = await getTrips();
      const trip = trips.find(t => t.id == tripId);
      setTripData(trip);
      // Set initial region after trip is loaded
      let points = [];
      try {
        points = JSON.parse(trip?.points || '[]');
      } catch {}
      if (points.length > 0) {
        const lats = points.map(p => p.latitude);
        const lons = points.map(p => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        setRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: Math.max(0.01, (maxLat - minLat) * 2),
          longitudeDelta: Math.max(0.01, (maxLon - minLon) * 2),
        });
      } else {
        Geolocation.getCurrentPosition(
          pos => {
            setRegion({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          },
          error => {
            console.log('Location error:', error);
            // fallback only if location fetch fails
            setRegion({
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    };
    fetchTrip();
  }, [tripId]);

  if (!tripData) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.container}>
          <Text>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  let points = [];
  try {
    points = JSON.parse(tripData?.points || '[]');
  } catch {}

  const exportToCSV = async () => {
    if (!points.length) {
      Alert.alert('No data', 'This trip has no GPS points to export.');
      return;
    }

    try {
      let csv = 'latitude,longitude,timestamp\n';
      csv += points.map(p => `${p.latitude},${p.longitude},${p.timestamp || ''}`).join('\n');

      const filePath = `${RNFS.DownloadDirectoryPath}/trip_${tripData.id}.csv`;
      await RNFS.writeFile(filePath, csv, 'utf8');

      Alert.alert('✅ Export Successful', `File saved to:\n${filePath}`);

      // Optional: open the file directly
      if (Platform.OS === 'android') {
        Linking.openURL(`file://${filePath}`).catch(() => {
          Alert.alert('Info', 'File saved, but cannot open automatically.');
        });
      }
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('❌ Export Failed', 'Could not export the trip data.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Trip Summary Card */}
        <View style={styles.summaryCard}>
          {/* 🔹 Formatted Date & Time */}
          {tripData.date && (() => {
            const d = new Date(tripData.date);
            const formattedDate = d.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }); 

            const formattedTime = d.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }); 

            return (
              <View style={{ alignItems: 'center', marginBottom: 0 }}>
                <Text style={styles.dateText}>{formattedDate}</Text>
                <Text style={[styles.dateText, { fontSize: 14, color: '#555' }]}>{formattedTime}</Text>
              </View>
            );
          })()}

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>
                {(() => {
                  const totalSec = tripData.duration || 0;
                  const hrs = Math.floor(totalSec / 3600);
                  const mins = Math.floor((totalSec % 3600) / 60);
                  const secs = totalSec % 60;
                  let formatted = '';
                  if (hrs > 0) formatted += `${hrs}h `;
                  if (mins > 0 || hrs > 0) formatted += `${mins}m `;
                  formatted += `${secs}s`;
                  return formatted;
                })()}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoBox}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>
                {tripData.distance ? (tripData.distance / 1000).toFixed(2) + ' km' : '--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Map Preview with Polyline, Start/End Markers, Zoom Controls */}
        <View style={styles.mapContainer}>
          <MapPreviewTrip
            points={points}
            region={region}
            renderMarkers={true}
          />
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
          <Text style={styles.exportButtonText}>⬇️ Export to CSV</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flex: 1, padding: 16 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoBox: {
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#777',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  divider: {
    height: '100%',
    width: 1,
    backgroundColor: '#ddd',
  },
  mapContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  mapText: {
    color: '#777',
    fontSize: 15,
  },
  exportButton: {
    alignSelf: 'center',
    backgroundColor: '#0a84ff',
    paddingVertical: 12,
    paddingHorizontal: width * 0.25,
    borderRadius: 30,
    elevation: 5,
  },
  exportButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

export default TripDetailScreen;