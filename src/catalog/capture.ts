import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import {
  ACCEPTED_MIME_TYPES,
  validateFile,
  type CatalogSource,
} from './sources';

/**
 * Device capture for business-context sources.
 *
 * Separated from the screen so the permission, cancel, and rejection paths can be tested
 * without rendering anything — those are the branches that actually break in the field.
 */

export type CaptureResult =
  | { ok: true; source: Omit<CatalogSource, 'id' | 'addedAt' | 'status'> }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false; error: string };

const CANCELLED: CaptureResult = { ok: false, cancelled: true };

/**
 * Take a photo of a menu, price list, or product label.
 *
 * Web browsers have no camera API behind expo-image-picker, so on web this opens the
 * file chooser instead. Silently doing nothing there would look like a broken button.
 */
export async function capturePhoto(): Promise<CaptureResult> {
  try {
    if (Platform.OS === 'web') {
      return pickImageFromLibrary();
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return {
        ok: false,
        cancelled: false,
        error: permission.canAskAgain
          ? 'Catch needs camera access to scan a page.'
          : 'Camera access is off. Turn it on for Catch in your device settings.',
      };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      // A photographed page usually needs straightening before it reads cleanly.
      allowsEditing: true,
    });

    if (result.canceled) return CANCELLED;

    const asset = result.assets[0];
    if (!asset) return CANCELLED;

    return {
      ok: true,
      source: {
        kind: 'photo',
        name: asset.fileName ?? `Scan ${new Date().toLocaleDateString()}`,
        sizeBytes: asset.fileSize ?? null,
        mimeType: asset.mimeType ?? 'image/jpeg',
        uri: asset.uri,
      },
    };
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      error: 'Could not open the camera. Try uploading a file instead.',
    };
  }
}

async function pickImageFromLibrary(): Promise<CaptureResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });

  if (result.canceled) return CANCELLED;

  const asset = result.assets[0];
  if (!asset) return CANCELLED;

  return {
    ok: true,
    source: {
      kind: 'photo',
      name: asset.fileName ?? 'Photo',
      sizeBytes: asset.fileSize ?? null,
      mimeType: asset.mimeType ?? 'image/jpeg',
      uri: asset.uri,
    },
  };
}

/** Pick a PDF, spreadsheet, or text file already on the device. */
export async function captureFile(): Promise<CaptureResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...ACCEPTED_MIME_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return CANCELLED;

    const asset = result.assets?.[0];
    if (!asset) return CANCELLED;

    // The picker's type filter is advisory — on several platforms a user can still
    // choose anything — so the extension and size are checked here.
    const rejection = validateFile(asset.name, asset.size ?? null);
    if (rejection) return { ok: false, cancelled: false, error: rejection };

    return {
      ok: true,
      source: {
        kind: 'file',
        name: asset.name,
        sizeBytes: asset.size ?? null,
        mimeType: asset.mimeType ?? null,
        uri: asset.uri,
      },
    };
  } catch {
    return {
      ok: false,
      cancelled: false,
      error: 'Could not open that file. Try a different one.',
    };
  }
}
