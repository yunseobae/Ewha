
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // Firestore를 사용하기 위해 추가
import { getAuth } from 'firebase/auth'; // <-- 이 줄을 추가합니다.

// Firebase 콘솔에서 복사한 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyDxeD2Ban4vVwlALhfeSHQDq_bVBBR3GTY",
  authDomain: "ewhanight.firebaseapp.com",
  projectId: "ewhanight",
  storageBucket: "ewhanight.firebasestorage.app",
  messagingSenderId: "273731484133",
  appId: "1:273731484133:web:6755b1a3fe3dcde07c170c",
  measurementId: "G-61JD7C59GP"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 인스턴스 가져오기
const db = getFirestore(app);

// Firebase Authentication 인스턴스 가져오기 <-- 이 줄을 추가합니다.
const auth = getAuth(app);

// db와 auth 인스턴스를 함께 내보냅니다. <-- 이 줄을 수정합니다.
export { db, auth }; // db 인스턴스를 다른 파일에서 사용할 수 있도록 내보내기