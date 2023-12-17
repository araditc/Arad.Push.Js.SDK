# Arad Push Notification system (APN)

**APN** documentation for node.js applications. It can be use in **ReactJS**, **VueJS** or **AngularJS**.

## Installation

Always get the latest version with the following code
`npm install met-generate-int`

## How to use

### Import

`import APN from ‘met-generate-int’`

### usage

Create an object of APN In your `App.js` (in react) or `App.vue` (in vuejs) and start coding
```js
  //  initialize apn ↓
  const apn = new APN();
  apn.init().then(() => {
    console.log('Initialize successful');

    // IMPORTANT: all connection configs will encrypt
    // with AES alg and you have to set e secretKey
    apn.setKey('arad-secret-key');

    if (!apn.checkConfig()) {
      // this methods check’s localStorage ecrypted config
      // here you should set config for mqtt connection ↓
      apn.setConfig('clientUserName', 'clientPassword', 'brokerURL');
    }

    // optional methods ↓
    console.log(apn.getToken());
    console.log(apn.getOs());
    console.log(apn.getBrowser());
  }).catch((error) => {
    console.error('Error: ', error);
    // here you can handle retry to call apn.init()
  });

  // this will listen to notifications
  apn.on('notif', (notif) => {
    console.log('notification: ', notif);
    // do something with notification data
  });
  // initialize apn sdk ↑

```


| First Header  | Second Header |
| ------------- | ------------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |

| First Header  | Second Header |
| ---------- | ---------- |
| Content Cell  | Content Cell  |
| Content Cell  | Content Cell  |
