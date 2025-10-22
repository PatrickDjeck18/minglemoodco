import 'react-native-polyfill-globals';

// Add setImmediate polyfill for web compatibility
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback: any, ...args: any[]) => {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id: any) => {
    clearTimeout(id);
  };
}

// Ensure Buffer is available
if (typeof global.Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
