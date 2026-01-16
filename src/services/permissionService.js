import { Platform } from 'react-native';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

const androidForeground = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
const androidBackground = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;

const iOSForeground = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
const iOSBackground = PERMISSIONS.IOS.LOCATION_ALWAYS;

function mapResult(result) {
  switch (result) {
    case RESULTS.GRANTED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
    case RESULTS.UNAVAILABLE:
    default:
      return 'blocked';
  }
}

async function checkPermissionSingle(permission) {
  try {
    const res = await check(permission);
    console.log(`[Permission] Check ${permission}:`, res);
    return mapResult(res);
  } catch (e) {
    console.log(`[Permission] Check failed for ${permission}:`, e);
    return 'blocked';
  }
}

async function requestPermissionSingle(permission) {
  try {
    console.log(`[Permission] Requesting ${permission}...`);
    const res = await request(permission);
    console.log(`[Permission] Result for ${permission}:`, res);
    return mapResult(res);
  } catch (e) {
    console.log(`[Permission] Request failed for ${permission}:`, e);
    return 'blocked';
  }
}

/**
 * Check permissions
 */
export async function checkPermissions() {
  console.log('[Permission] Checking current permissions...');
  if (Platform.OS === 'ios') {
    const fg = await checkPermissionSingle(iOSForeground);
    const bg = await checkPermissionSingle(iOSBackground);
    console.log(`[Permission] iOS check → FG: ${fg}, BG: ${bg}`);
    return { foreground: fg, background: bg };
  } else {
    const fg = await checkPermissionSingle(androidForeground);
    let bg = 'granted';
    try {
      bg = await checkPermissionSingle(androidBackground);
    } catch {
      bg = 'granted';
    }
    console.log(`[Permission] Android check → FG: ${fg}, BG: ${bg}`);
    return { foreground: fg, background: bg };
  }
}

/**
 * Request permissions
 */
export async function requestPermissions() {
  console.log('[Permission] Requesting permissions...');
  if (Platform.OS === 'ios') {
    const fg = await requestPermissionSingle(iOSForeground);
    const bg = fg === 'granted' ? await requestPermissionSingle(iOSBackground) : fg;
    console.log(`[Permission] iOS request done → FG: ${fg}, BG: ${bg}`);
    return { foreground: fg, background: bg };
  } else {
    const fg = await requestPermissionSingle(androidForeground);
    let bg = fg === 'granted' ? await requestPermissionSingle(androidBackground) : fg;
    console.log(`[Permission] Android request done → FG: ${fg}, BG: ${bg}`);
    return { foreground: fg, background: bg };
  }
}

/**
 * Combined check + request
 */
export async function checkAndRequestPermissions() {
  console.log('🔹 [PermissionFlow] Step 1: Checking current permission state...');
  let current = await checkPermissions();

  const needsRequestFg = current.foreground === 'denied';
  const needsRequestBg = current.background === 'denied';
  console.log('🔹 [PermissionFlow] Initial status →', current);

  if (needsRequestFg || needsRequestBg) {
    console.log('🔹 [PermissionFlow] Requesting missing permissions...');
    await requestPermissions();

    // Wait for system to update permission state
    console.log('🔹 [PermissionFlow] Waiting 400ms for state to update...');
    await new Promise(resolve => setTimeout(resolve, 400));

    current = await checkPermissions();
    console.log('🔹 [PermissionFlow] Final status after request →', current);
  } else {
    console.log('✅ [PermissionFlow] All permissions already granted:', current);
  }

  return current;
}

/**
 * Open app settings
 */
export function openAppSettings() {
  console.log('[Permission] Opening app settings...');
  return openSettings();
}
