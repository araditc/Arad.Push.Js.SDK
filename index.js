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
    let initing = false;
    let fcm = null;
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
    const encryptConfig = function(plainText, secretKey) {
      var ciphertext = CryptoJS.AES.encrypt(plainText, secretKey);
      return ciphertext.toString();
    }
    const decryptConfig = function(ciphertext, secretKey) {
      var bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
      var originalConfig = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(originalConfig);
    }
    const connect = function() {
      const config = this.decryptConfig(localStorage.getItem('config'), this.secretKey);
      const client = new Client({
        brokerURL: config.url,
        connectHeaders: {
          login: config.username,
          passcode: config.password,
        },
        onConnect: () => {
          client.subscribe(
            config.username,
            (message) => {
              this.emit('MessageReceive', message.body);
              client.deactivate();
            });
        },
        onStompError: (frame) => {
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
                reject('Can not init firebase.');
                initing = false;
              });
              // Handle incoming messages
              onMessage(messaging, (payload) => {
                if (this.checkConfig()) {
                  this.emit('WakeUp', true);
                }
              });
            } else {
              // else
            }
          });
        }
      });
    }
    this.getMessage = function() {
      connect();
    }
    this.checkConfig = function() { 
      const configObject = localStorage.getItem('config');
      let ready = false;
      if (!configObject) {
        return false;
      } else {
        const c = decryptConfig(configObject, secretKey);
        for (let key in c) {
          if (c[key] === null || c[key] === undefined || c[key] === '') {
            return false;
          }
        }
        return true;
      }
    }
    this.setConfig = function(user, pass, connectUrl) {
      const config = {
        username: user,
        password: pass,
        url: connectUrl,
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
    }
  }
}

class DeviceUtils {
  constructor() {
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
// class deviceUtils
module.exports = {
  Arad,
  DeviceUtils
};
