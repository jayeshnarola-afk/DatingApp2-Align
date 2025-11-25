var FCM = require('fcm-node');
var APN = require('apn');
import { env } from '../../infrastructure/env'
import { logger } from '../lib/logger'
const fcm = new FCM(env.FCM_SERVER_KEY);


    /**
     * push notification
     * * @param {string} value
    */

    export function sentPushNotification(dataObj : {registrationDeviceToken:string,title:string,        body:string,id:string,url:string,deviceType:string,redirectType:string},callback:any){
        if(dataObj['deviceType'] === "Android"){
            sentAndroidPush(dataObj,callback)
        }else if(dataObj['deviceType'] === "Ios"){
            sentApplePush(dataObj,callback); 
        }
    }

    /**
     * push notification android
     * * @param {string} value
    */

    const sentAndroidPush = (dataObj : {registrationDeviceToken:string,title:string,body:string,id:string,url:string,deviceType:string,redirectType:string},callback:any):any =>{
        var message = { 
            //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: dataObj['registrationDeviceToken'], 
            collapse_key: env.SITE_TITLE,
            
            notification: {
                title: dataObj['title'], 
                body: dataObj['body']
            },
            
            data: {  //you can send only notification or only data(or include both)
                id: dataObj['id'],
                url: dataObj['url'],
                redirectType: dataObj['redirectType']
            }
        };
        fcm.send(message, function(err: any, response: any){
            if (err) {
                logger.error(err)
                callback(err)
            } else {
                logger.info(response)
                callback(response)
            }
        });
    }

    /**
     * push notification Apple
     * * @param {string} value
    */

    const sentApplePush = (dataObj : {registrationDeviceToken:string,title:string,body:string,id:string,url:string,deviceType:string,redirectType:string},callback:any):any =>{
    	let self = this;
    	let options = {
					  token: {
					    key   : "",
					    keyId : "DV2NAKPY5W",
					    teamId: "3FR26TP83Y",
					  },
					  production: false
					};
		let redirectType      = dataObj['redirectType'];
    	let apnProvider       = new APN.Provider(options);
    	let note              = new APN.Notification();
    	let notificationSound = "SIMPLE_NOTIFICATION_APP_IN_BACKGROUND.caf";
    	note.badge   = 1;
    	note.alert   = dataObj['body'];
    	note.payload = dataObj;
    	note.sound   = notificationSound;
    	note.topic   = "com.lms.petApp"; // BUNDEL ID

    	apnProvider.send(note, dataObj['registrationDeviceToken']).then( (result: any) => {
		  console.log('result',JSON.stringify(result));
		  callback(result);
		});
    }