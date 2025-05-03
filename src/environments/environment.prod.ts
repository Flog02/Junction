export interface Environment {
  production: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
}

export const environment: Environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyDNjW1pBUSsRpQoINUKCf_JW7Ru4nMAASk',
    authDomain: 'junction-d7522.firebaseapp.com',
    databaseURL: 'https://junction-d7522-default-rtdb.firebaseio.com',
    projectId: 'junction-d7522',
    storageBucket: 'junction-d7522.firebasestorage.app',
    messagingSenderId: '152871248574',
    appId: '1:152871248574:web:ba314c6426d947d6aaf4ef',
    measurementId: 'G-NNQTVVSSLF',
  },
};
