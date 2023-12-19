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
    // private data and functions
    let fcm = null;
    let initing = false;
    let broker = '';
    // this.broker = 'wss://o77efe7a.ala.us-east-1.emqxsl.com:8084/mqtt';
    let secretKey = null;
    const generateClientId = function() {
      let result = 'omid-pwa-';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
    const connectMQTT = function() {
      const config = this.decryptConfig(localStorage.getItem('config'), this.secretKey);
      config.clientId = generateClientId();
      // console.warn(config);
      // console.warn(broker);
      // console.log('▬ ▬ ▬', config);
      const client = mqtt.connect(broker, config);
      client.on("connect", (err) => {
        if (!err) {
          // subscribe();
          // console.warn('MQTT CONNECTED to', broker);
        } else {
          // console.log('can not connect to mqtt', err);
        }
      });
    }
    const encryptConfig = function(plainText, secretKey) {
      // console.log('ecn', plainText, secretKey);
      var ciphertext = CryptoJS.AES.encrypt(plainText, secretKey);
      return ciphertext.toString();
    }
    const decryptConfig = function(ciphertext, secretKey) {
      // console.log('dec', ciphertext, secretKey);
      var bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
      var originalConfig = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(originalConfig);
    }
    const connect = function() {
      // console.warn('start connecting ...');
      const config = this.decryptConfig(localStorage.getItem('config'), this.secretKey);
      // console.warn(config);
      // console.warn(this.broker);
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
              // console.log(`Received: ${message.body}`);
              // Disconnect after receiving the message
              this.emit('message', message.body);
              client.deactivate();
            });
        },
        onStompError: (frame) => {
          // Will be called in case of error
          // console.log('Broker reported error: ' + frame.headers['message']);
          // console.warn('Additional details: ' + frame.body);
          console.warn('connection error', frame.headers['message']);
        },
        onWebSocketClose: (event) => {
          // Will be called when WebSocket closes
          console.warn('connection closed: ', event);
        },
      });
    
      client.activate();
    }
    // public functions
    this.publicFunction = function() {
      privateFunction('from publicFunction');
    }
    this.init = function(firebaseConfig, vapidkey) {
      return new Promise((resolve, reject) => {
        if (!initing) {
          initing = true;
          const app = initializeApp(firebaseConfig);
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              const messaging = getMessaging();
              getToken(messaging, { vapidKey: vapidkey }).then((currentToken) => {
                if (currentToken) {
                  fcm = currentToken;
                  resolve(fcm);
                  initing = false;
                } else {
                  reject('Can not init firebase.');
                  initing = false;
                }
              }).catch((err) => {
                // console.error('An error occurred while retrieving token. ', err);
                reject('Can not init firebase.');
                initing = false;
              });
  
              // Handle incoming messages
              onMessage(messaging, (payload) => {
                // console.log('Message received. ', payload.notification);
                if (this.checkConfig()) {
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
    this.checkConfig = function() { 
      const configObject = localStorage.getItem('config');
      // console.log('checkConfig', secretKey);
      let ready = false;
      if (!configObject) {
        ready = false;
      } else {
        const c = decryptConfig(configObject, secretKey);
        if (c.username && c.username !== '' && c.username !== null && c.username !== undefined &&
          c.password && c.password !== '' && c.password !== null && c.password !== undefined) {
          ready = true;
        } else {
          ready = false;
        }
      }
      return ready;
    }
    this.setConfig = function(user, pass, url) {
      broker = url;
      const config = {
        username: user,
        password: pass,
      };
      // encrypt and store the config
      const encConfig = encryptConfig(JSON.stringify(config), secretKey);
      localStorage.setItem('config', encConfig);
    }
    this.getToken = function() {
      return fcm;
    }
    this.setKey = function(key) {
      secretKey = key;
      // console.log(key, secretKey);
    }
    this.getOs = function() {
      const userAgent = window.navigator.userAgent;
      const platform = window.navigator.platform;
      const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
      const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
      const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
      let os = null;
      if (macosPlatforms.indexOf(platform) !== -1) {
        os = 'Mac OS' + ' (' + platform + ')';
      } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = 'iOS' + ' (' + platform + ')';
      } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = 'Windows' + ' (' + platform + ')';
      } else if (/Android/.test(userAgent)) {
        os = 'Android';
      } else if (!os && /Linux/.test(platform)) {
        os = 'Linux';
      }
      return os;
    }
    this.getBrowser = function() {
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
}
module.exports = Arad;
