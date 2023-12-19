![](https://i.postimg.cc/t4PCNhgB/apn.png)

# Arad Push Notification system (APN)
You can use this sdk in node.js applications such as **ReactJS**, **VueJS** or **AngularJS**.

> ## Before start (IMPORTANT)
> You need The **firebase configuration object** and **vapidKey** before initialize APN sdk.
> ### — Firebase Configuration
> 1. **Create a Firebase project:** Open the [Firebase console](https://console.firebase.google.com) and click on **“Add project”**. Follow the instructions to create your project.
> 2. **Get your Firebase configuration:** After your project is created, click on the gear icon next to **“Project Overview”** and select **“Project settings”**. Here, you’ll find your Firebase SDK snippet under the **“General”** tab. It will look something like this:
>```js
>const firebaseConfig = {
>  apiKey: "AIzaSy...",
>  authDomain: "your-project-id.firebaseapp.com",
>  databaseURL: "https://your-project-id.firebaseio.com",
>  projectId: "your-project-id",
>  storageBucket: "your-project-id.appspot.com",
>  messagingSenderId: "sender-id",
>  appId: "app-id",
>  measurementId: "G-measurement-id",
>};
>```
> ### — VAPID Key
> 1. **Enable Cloud Messaging in your Firebase project:** In the Firebase console, navigate to “Cloud Messaging” under the “Grow” section. Here, you can enable Firebase Cloud Messaging for your project.
> 2. **Get your VAPID key:** After enabling Cloud Messaging, you’ll find your **VAPID key** under the **“Cloud Messaging”** settings. It will be labeled as **“Web Push certificates”**. It will look something like this:
> ```js
> const vapidkey = 'BB0rUaCvQVl1NA9sENxz9y...'
> ```


## Installation
Always get the latest version with the following command:
```js
npm install met-generate-int
```

## Import
```js
import APN from ‘met-generate-int’
```

## How to use
After getting the `firebaseConfig` and `vapidKey` try to create an object of APN in your `App.js` (react) or `App.vue` (vuejs) and start coding:
```js

  const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "sender-id",
    appId: "app-id",
    measurementId: "G-measurement-id",
  };
  const vapidkey = 'BB0rUaCvQVl1NA9sENxz9y...';

  // create apn object from APN
  const apn = new APN();

  //  initialize apn ↓
  apn.init(firebaseConfig, vapidKey).then(() => {
    console.log('Initialize successful');
    apn.setKey('arad-secret-key');
    if (!apn.checkConfig()) {
      apn.setConfig('clientUserName', 'clientPassword', 'connectionURL');
    }
  }).catch((error) => {
    console.error('Error: ', error);
    // here you can handle retry to call apn.init()
  });

  // this will listen to notifications
  apn.on('message', (message) => {
    console.log('notification: ', message);
    // do something with notification data
  });
```

> ## Background Notification
> The `firebase-messaging-sw.js` file is a **service worker** file used by Firebase Cloud Messaging (FCM) to handle the receiving and displaying of push notifications in the **background**, **even when your web app is not currently open in the browser**.
> Here’s how you can use it in your web projects:
> 1. **Create the Service Worker File:** Create a new file named `firebase-messaging-sw.js` in the `public` folder of your project. The public directory is the root of your server, and the service worker file must be located at the root level to have control over all the pages of your site.
> 2. **Initialize Firebase in the Service Worker:** In the `firebase-messaging-sw.js` file, you’ll need to initialize Firebase and the messaging service. Here’s a basic example:
>```js
>// Import and configure Firebase
>importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
>importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
>
>const firebaseConfig = {
>  apiKey: "AIzaSy...",
>  authDomain: "your-project-id.firebaseapp.com",
>  databaseURL: "https://your-project-id.firebaseio.com",
>  projectId: "your-project-id",
>  storageBucket: "your-project-id.appspot.com",
>  messagingSenderId: "sender-id",
>  appId: "app-id",
>  measurementId: "G-measurement-id",
>};
>
>// Retrieve an instance of Firebase Messaging
>// so that it can handle background messages.
>const messaging = firebase.messaging();
>
>messaging.onBackgroundMessage((payload) => {
>  self.registration.showNotification(notificationTitle,
>    notificationOptions);
>});
>
>```

## Methods 

| Method | Info |
| ------------- | ------------- |
| `init(firebaseConfig, vapidKey)`  | initialize sdk width `firebaseConfig` (object) and `vapidKey` (string) `promise` |
| `setKey(key)` | set a **secretKey** to ecnrypt configs `void` |
| `checkConfig()` | check if configs **defined** and **valid** `boolean` |
| `setConfig()` | **set** connection data `void` |
| `getToken()` | return firebase token `string` (return `null` before initilize complete) |
| `getOs()` | returns OS name `string` |
| `getBrowser()` | returns browser name `string` |


## Events

| Event  | Info |
| ---------- | ---------- |
| **message**  | trigger when a message received from server `apn.on('message', (message) => handleNotification())` |
