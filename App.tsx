import React, { useState,useEffect } from 'react';
import { Button, Image, View } from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const App = () => {
  const [imageSource, setImageSource] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  const chooseImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('Image picker error: ', response.error);
      } else {
        let imageUri = response.uri || response.assets?.[0]?.uri;
        console.log(imageUri);
        setImageSource(imageUri);
        uploadImage(imageUri);
      }
    });
  };
  const login = async () => {
    auth()
    .signInWithEmailAndPassword('xiaolutan@apexglobe.com', 'Tan1981')
    .then(() => {
      console.log('User account created & signed in!');
    })
    .catch(error => {
      if (error.code === 'auth/email-already-in-use') {
        console.log('That email address is already in use!');
      }

      if (error.code === 'auth/invalid-email') {
        console.log('That email address is invalid!');
      }

      console.error(error);
    });
  }
  const uploadImage = async imagePath => {
    // const response = await fetch(uri);
    // const blob = await response.blob();
    // var ref = storage().ref().child("my-image");
    // return ref.put(blob);
    const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1);
    const uploadUri = Platform.OS === 'ios' ? imagePath.replace('file://', '') : imagePath;

    // 创建一个引用到 Firebase Storage 上的文件
    const storageRef = storage().ref(filename);

    // 上传文件
    const task = storageRef.putFile(uploadUri);

    // 监听上传进度
    task.on('state_changed', snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(progress);
    });

    try {
      // 等待上传任务完成
      await task;
    } catch (e) {
      console.error(e);
    }

    // 获取上传好的图片的 URL
    const url = await storageRef.getDownloadURL();
    console.log('url->', url);
    console.log('upload progress->', uploadProgress);
    return url;
  };
  const saveToFirebase = async () => {
    const usersCollection = firestore().collection('Users');
    const userDocument = firestore().collection('Users').doc('ABC');
     await userDocument.set({
        name: 'Los Angeles',
        state: 'CA',
        country: 'USA'
      });
    console.log('userDocument->', userDocument);
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {!user && <Button title="login" onPress={login} />}
      {user && <Button title='Save to Firebase' onPress={saveToFirebase} />}
      <Button title="Choose Image" onPress={chooseImage} />
      {imageSource && <Image source={{ uri: imageSource }} style={{ width: 200, height: 200 }} />}
      {user && <Button title='Sign Off' onPress={() => auth().signOut()} />}
    </View>
  );
};

export default App;