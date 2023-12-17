# Arad Push Notification system (APN)

**APN** documentation for node.js applications. It can be use in **ReactJS**, **VueJS** or **AngularJS**.

## Installation

Always get the latest version with the following code
`npm install arad-push-js-sdk`

## How to use

### Import

`import APN from arad-push-js-sdk’`

### usage

Create an object of APN In your `App.js` (in react) or `App.vue` (in vuejs) and start coding
```js
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

## Methods 

| Method | Info |
| ------------- | ------------- |
| `init(firebaseConfig, vapidKey)`  | create a firebase account and get your `firebaseConfig` (object) and `vapidKey` (string) (promise) |
| `setKey(key)` | set a **secretKey** to ecnrypt configs `void` |
| `checkConfig()` | check if configs **defined** and **valid** `boolean` |
| `setConfig()` | **set** connection data `void` |
| `getToken()` | return firebase token `string` (return `null` before initilize complete) |
| `getOs()` | return OS name `string` |
| `getBrowser()` | return browser name `string` |


## Events

| Event  | Info |
| ---------- | ---------- |
| **message**  | trigger when a message received from server `apn.on('message', (message) => handleNotification())` |
