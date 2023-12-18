const { rejects } = require("assert");
const { initializeApp } = require("firebase/app");
const { getMessaging, getToken, onMessage } = require("firebase/messaging");
const mqtt = require("mqtt");
const { resolve } = require("url");
const EventEmitter = require('events');
const { Client } = require('@stomp/stompjs');
const CryptoJS = require("crypto-js");

class Arad extends EventEmitter {
  constructor() {
    super();
    this.fcm = null;
    this.initing = false;
    this.config = null;
    this.broker = '';
    // this.broker = 'wss://o77efe7a.ala.us-east-1.emqxsl.com:8084/mqtt';
    this.mqttTopic = 'omid';
    this.client = null;
    this.secretKey = null;
  }
  // 1. init fb
  init(firebaseConfig, vapidkey) {
    return new Promise((resolve, reject) => {
      if (!this.initing) {
        this.initing = true;
        const app = initializeApp(firebaseConfig);
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            const messaging = getMessaging();
            getToken(messaging, { vapidKey: vapidkey }).then((currentToken) => {
              if (currentToken) {
                this.fcm = currentToken;
                resolve(this.fcm);
                this.initing = false;
              } else {
                reject('Can not init firebase.');
                this.initing = false;
              }
            }).catch((err) => {
              // console.error('An error occurred while retrieving token. ', err);
              reject('Can not init firebase.');
              this.initing = false;
            });

            // Handle incoming messages
            onMessage(messaging, (payload) => {
              // console.log('Message received. ', payload.notification);
              if (checkConfig()) {
                // connectMQTT(payload.notification);
                connect();
              }
            });
          } else {
            // console.log('Unable to get permission to notify.');
          }
        });
      }
    });
  }
  setKey(key) {
    this.secretKey = key;
  }
  getToken() {
    return this.fcm;
  }
  // clientId generator
  generateClientId() {
    let result = 'omid-pwa-';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 16; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  encryptConfig(plainText, secretKey) {
    var ciphertext = CryptoJS.AES.encrypt(plainText, secretKey);
    return ciphertext.toString();
  }
  decryptConfig(ciphertext, secretKey) {
    var bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    var originalConfig = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(originalConfig);
  }
  setConfig(user, pass, broker) {
    this.broker = broker;
    const config = {
      username: user,
      password: pass,
    };
    // encrypt and store the config
    const encConfig = this.encryptConfig(JSON.stringify(config), this.secretKey);
    localStorage.setItem('config', encConfig);
  }
  // 2. check localStorage for config (omid notification data)
  checkConfig() {
    const mqttObject = localStorage.getItem('config');
    let ready = false;
    if (!mqttObject) {
      ready = false;
    } else {
      this.config = this.decryptConfig(mqttObject, this.secretKey);
      if (this.config.username && this.config.username !== '' && this.config.username !== null && this.config.username !== undefined &&
        this.config.password && this.config.password !== '' && this.config.password !== null && this.config.password !== undefined &&
        this.config.clientId && this.config.clientId !== '' && this.config.clientId !== null && this.config.clientId !== undefined) {
        ready = true;
      } else {
        ready = false;
      }
    }
    return ready;
  }
  // connect to server
  connect() {
    const config = this.decryptConfig(localStorage.getItem('config'), this.secretKey);
    console.warn(config);
    console.warn(this.broker);
    const client = new Client({
      brokerURL: this.broker,
      connectHeaders: {
        login: config.username,
        passcode: config.password,
      },
      onConnect: () => {
        client.subscribe(
          config.username,
          (message) => {
            console.log(`Received: ${message.body}`);
            // Disconnect after receiving the message
            this.emit('message', message.body);
            client.deactivate();
          });
      },
      onStompError: (frame) => {
        // Will be called in case of error
        console.log('Broker reported error: ' + frame.headers['message']);
        console.log('Additional details: ' + frame.body);
      },
      onWebSocketClose: (event) => {
        // Will be called when WebSocket closes
        console.log('WebSocket connection closed: ', event);
      },
    });
  
    client.activate();
  }
  connectMQTT() {
    const config = this.decryptConfig(localStorage.getItem('config'), this.secretKey);
    config.clientId = this.generateClientId();
    console.warn(config);
    console.warn(this.broker);
    console.log('▬ ▬ ▬', config);
    this.client = mqtt.connect(this.broker, config);
    this.client.on("connect", (err) => {
      if (!err) {
        // subscribe();
        console.warn('MQTT CONNECTED to', this.broker);
      } else {
        console.log('can not connect to mqtt', err);
      }
    });
  }
  // utils
  getOs() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS' + '(' + platform + ')';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS' + '(' + platform + ')';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows' + '(' + platform + ')';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
    return os;
  }
  getBrowser() {
    const [userAgent] = [navigator.userAgent];
    let browserName = '';
    if (/MSIE|Trident/.test(userAgent)) {
      browserName = 'ie';
    } else if (/Edge/.test(userAgent)) {
      browserName = 'edge';
    } else if (/CriOS/.test(userAgent)) {
      browserName = 'chrome';
    } else if (/Chrome/.test(userAgent)) {
      browserName = 'chrome';
    } else if (/Firefox/.test(userAgent)) {
      browserName = 'firefox';
    } else if (/Safari/.test(userAgent)) {
      browserName = 'safari';
    } else {
      browserName = 'Unknown';
    }
    return browserName;
  }
}
module.exports = Arad;
