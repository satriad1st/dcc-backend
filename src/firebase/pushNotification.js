const firebaseAdmin = require("firebase-admin");
let firebaseApp = require("./firebaseapp.json");

let firebase = firebaseAdmin.initializeApp({
    credential : firebaseAdmin.credential.cert(firebaseApp),
});

exports.pushNotification = async (data)=>{
    try {
        const payload = {
            notification: {
                body : data.message,
                title : data.title,
                description : data.description,
            },
            data : {
                click_action : data.click_action,
                message : data.message,
                title : data.title,
                description : data.description,
                type : data.type,
                sub_type : data.sub_type,
                _id : data._id ? data._id : ""
            },  
        };

        const options = {
            priority : "high",
        };
        
        //console.log(data)
        await firebase.messaging().sendToDevice(data.fcmTokens, payload, options).then((response) => {
            //console.log('Successfully sent message:', response);
          })
          .catch((error) => {
            console.log('Error sending message:', error);
          });
        
    } catch (error) {
        console.log(error)
    }
};

exports.pushNotificationtoTopic = async (data)=>{

    try {
        const payload = {
            notification: {
                body : data.message,
                title : data.title
            },
            data : {
                click_action : data.click_action,
                message : data.message,
                title : data.title,
                description : data.description,
                type : data.type,
                sub_type : data.sub_type,
                _id : data._id ? data._id : ""
            },  
                topic : data.topic ? data.topic : ""
        };  

        console.log(payload)
        await firebase.messaging().send(payload).then((response) => {
            console.log('Successfully sent message:', response);
          })
          .catch((error) => {
            console.log('Error sending message:', error);
          });
        
    } catch (error) {
        console.log(error)
    }
};

exports.subscribeToTopic = async (data)=>{
    try {        
        await firebase.messaging().subscribeToTopic(data.fcmTokens, data.topic).then(function(response) {
          console.log('Successfully subscribed to topic:', response);
        })
        .catch(function(error) {
          console.log('Error subscribing to topic:', error);
        });
        
    } catch (error) {
        console.log(error)
    }
};

exports.UnsubscribeToTopic = async (data)=>{
    try {        
        await firebase.messaging().unsubscribeFromTopic(data.fcmTokens, data.topic).then(function(response) {
          console.log('Successfully unsubscribed to topic:', response);
        })
        .catch(function(error) {
          console.log('Error unsubscribing to topic:', error);
        });
        
    } catch (error) {
        console.log(error)
    }
};