import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'

import {StatusBar} from 'expo-status-bar';
import Constants from 'expo-constants';
import {Platform, StyleSheet, Text, View} from 'react-native';
import {useEffect, useRef, useState} from "react";
import appConfig from "./app.json";


Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false
    }),
})


export default function App() {

    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

        //when app in foreground
        notificationListener.current = Notifications.addNotificationReceivedListener(
            notification => setNotification(notification)
        );

        //when user interacts with pushNotification(app in: foreground, background, killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            response => {
                console.log(response)

            }
        );

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current)
            Notifications.removeNotificationSubscription(responseListener.current)
        }

    }, [])


    const appConfig = require('./app.json');
    const projectId = appConfig?.expo?.extra?.eas?.projectId;


    return (
        <View style={styles.container}>
            <Text>your expo push token: {expoPushToken}</Text>
            <View style={styles.notifcationContainer}>
                <Text>Title: {notification && notification.request.content.title}</Text>
                <Text>Body: {notification && notification.request.content.body}</Text>
                <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
                <Text>Constants.manifest.id: {Constants?.manifest?.id}</Text>
                <Text>projectId: {projectId}</Text>
            </View>
            <StatusBar style="auto"/>
        </View>
    );
}


async function registerForPushNotificationsAsync() {

    console.log('Constants.manifest.id: ', Constants?.manifest?.id)

    let token = null;
    if (!Device.isDevice) {
        alert('Must use physical device for Push Notifications');
        return;
    }
    const {status: existingStatus} = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('Permissions for PushNotifications were declined')
            return;
        }
    }
    // token = (await Notifications.getExpoPushTokenAsync({experienceId: "@robertmaciaszczyk/rn-poc-push"})).data;  //works OK

    const appConfig = require('./app.json');
    const projectId = appConfig?.expo?.extra?.eas?.projectId;

    token = (await Notifications.getExpoPushTokenAsync({projectId:projectId})).data;
    console.log(`Token: ${token}`)

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        })
    }

    return token
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifcationContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    }
});
