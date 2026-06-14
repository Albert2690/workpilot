import { Platform } from 'react-native';

const extensionFromMime = (mimeType) => {
  if (!mimeType) return 'jpg';
  const [, subtype] = mimeType.split('/');
  return subtype || 'jpg';
};

export const appendImageToFormData = async (formData, fieldName, image, index, prefix = 'image') => {
  const mimeType = image.mimeType || image.type || 'image/jpeg';
  const fileName = image.fileName || `${prefix}_${index + 1}.${extensionFromMime(mimeType)}`;

  if (Platform.OS === 'web') {
    if (image.file) {
      formData.append(fieldName, image.file, fileName);
      return;
    }

    const response = await fetch(image.uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, fileName);
    return;
  }

  formData.append(fieldName, {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  });
};
