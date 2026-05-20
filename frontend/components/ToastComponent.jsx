import { Alert, Platform, ToastAndroid } from 'react-native';

const ToastComponent = (title, message) => {
  const displayMessage = message ? `${title}: ${message}` : title;

  if (Platform.OS === 'web') {
    window.alert(displayMessage);
    return;
  }

  if (Platform.OS === 'android') {
    ToastAndroid.show(displayMessage, ToastAndroid.SHORT);
    return;
  }

  // ios
  if (message) {
    Alert.alert(title, message);
  } else {
    Alert.alert(title);
  }
};

export default ToastComponent;
