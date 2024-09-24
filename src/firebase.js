import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBeoQpP97QqjMFgt9Ff1PdxdzqI-rSesOA",
    authDomain: "chatapp-33db6.firebaseapp.com",
    projectId: "chatapp-33db6",
    storageBucket: "chatapp-33db6.appspot.com",
    messagingSenderId: "518857851790",
    appId: "1:518857851790:web:7b2f3d3dbb33d9f29cdadf"
};

const app = initializeApp(firebaseConfig);
 const auth = getAuth(app);
 const db = getFirestore(app);
 const storage = getStorage(app);

 export {auth,db,storage}