import { firebaseConfig } from './config';

// Initialize Firebase with platform-specific imports
import { Platform } from 'react-native';

let auth: any;
let firestore: any;
let app: any;

if (Platform.OS === 'web') {
  // Use regular Firebase SDK for web
  const { initializeApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  const { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, increment, serverTimestamp } = require('firebase/firestore');
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Create a firestore wrapper that matches the React Native Firebase API
  firestore = () => ({
    collection: (name: string) => ({
      add: (data: any) => addDoc(collection(getFirestore(app), name), data),
      where: (field: string, operator: string, value: any) => ({
        orderBy: (field: string, direction: string) => ({
          get: () => getDocs(query(collection(getFirestore(app), name), where(field, operator, value), orderBy(field, direction)))
        })
      }),
      doc: (id: string) => ({
        update: (data: any) => updateDoc(doc(getFirestore(app), name, id), data),
        delete: () => deleteDoc(doc(getFirestore(app), name, id))
      })
    }),
    FieldValue: {
      serverTimestamp: () => serverTimestamp(),
      increment: (value: number) => increment(value)
    }
  });
} else {
  // Use React Native Firebase for mobile
  const { initializeApp } = require('@react-native-firebase/app');
  const authModule = require('@react-native-firebase/auth');
  const firestoreModule = require('@react-native-firebase/firestore');
  
  app = initializeApp(firebaseConfig);
  auth = authModule.default;
  firestore = firestoreModule.default;
}

export { auth, firestore };
export default app;

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  PRAYER_REQUESTS: 'prayerRequests',
  READING_PROGRESS: 'readingProgress',
  MEMORY_VERSES: 'memoryVerses',
  PRACTICE_LOGS: 'practiceLogs',
  DEVOTION_NOTES: 'devotionNotes',
  STATISTICS: 'statistics',
} as const;

// Firebase utility functions
export class FirebaseManager {
  static async syncUserData(userId: string, data: any): Promise<void> {
    try {
      // In a real implementation, this would sync to Firestore
      console.log('Syncing user data to Firebase:', userId, data);
      // await firestore().collection(COLLECTIONS.USERS).doc(userId).set(data);
    } catch (error) {
      console.error('Error syncing user data:', error);
      throw error;
    }
  }


  static async getUserData(userId: string): Promise<any> {
    try {
      // In a real implementation, this would fetch from Firestore
      console.log('Getting user data from Firebase:', userId);
      // const doc = await firestore().collection(COLLECTIONS.USERS).doc(userId).get();
      // return doc.exists ? doc.data() : null;
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  static async saveReadingSession(userId: string, session: any): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.READING_PROGRESS).add({
        userId,
        ...session,
        timestamp: firestore().FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving reading session:', error);
      throw error;
    }
  }

  static async getReadingSessions(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.READING_PROGRESS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting reading sessions:', error);
      return [];
    }
  }

  static async savePrayerRequest(userId: string, request: any): Promise<string> {
    try {
      const docRef = await firestore().collection(COLLECTIONS.PRAYER_REQUESTS).add({
        userId,
        ...request,
        timestamp: firestore().FieldValue.serverTimestamp(),
        prayerCount: 0,
        isAnswered: false,
        isPrivate: request.isPrivate || false,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving prayer request:', error);
      throw error;
    }
  }

  static async getPrayerRequests(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.PRAYER_REQUESTS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        dateAdded: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting prayer requests:', error);
      return [];
    }
  }

  static async incrementPrayerCount(requestId: string): Promise<void> {
    try {
      const requestRef = firestore().collection(COLLECTIONS.PRAYER_REQUESTS).doc(requestId);
      await requestRef.update({
        prayerCount: firestore().FieldValue.increment(1)
      });
    } catch (error) {
      console.error('Error incrementing prayer count:', error);
      throw error;
    }
  }

  static async markPrayerAsAnswered(requestId: string, testimony?: string): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.PRAYER_REQUESTS).doc(requestId).update({
        isAnswered: true,
        answeredDate: firestore().FieldValue.serverTimestamp(),
        ...(testimony && { testimony })
      });
    } catch (error) {
      console.error('Error marking prayer as answered:', error);
      throw error;
    }
  }

  static async deletePrayerRequest(requestId: string): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.PRAYER_REQUESTS).doc(requestId).delete();
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      throw error;
    }
  }

  static async saveMemoryVerse(userId: string, verse: any): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.MEMORY_VERSES).add({
        userId,
        ...verse,
        timestamp: firestore().FieldValue.serverTimestamp(),
        mastery: 'learning',
        reviewCount: 0,
        correctCount: 0,
        lastReviewed: null
      });
    } catch (error) {
      console.error('Error saving memory verse:', error);
      throw error;
    }
  }

  static async getMemoryVerses(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.MEMORY_VERSES)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting memory verses:', error);
      return [];
    }
  }

  static async updateVerseProgress(verseId: string, isCorrect: boolean): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.MEMORY_VERSES).doc(verseId).update({
        reviewCount: firestore().FieldValue.increment(1),
        correctCount: isCorrect ? firestore().FieldValue.increment(1) : firestore().FieldValue.increment(0),
        lastReviewed: firestore().FieldValue.serverTimestamp(),
        mastery: isCorrect ? 'mastered' : 'learning'
      });
    } catch (error) {
      console.error('Error updating verse progress:', error);
      throw error;
    }
  }

  // Prayer Timer Functions
  static async savePrayerSession(userId: string, sessionData: any): Promise<void> {
    try {
      await firestore().collection('prayer_sessions').add({
        userId,
        ...sessionData,
        timestamp: firestore().FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving prayer session:', error);
      throw error;
    }
  }

  static async getPrayerSessions(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection('prayer_sessions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting prayer sessions:', error);
      return [];
    }
  }

  // Spiritual Practices Functions
  static async savePractice(userId: string, practiceData: any): Promise<void> {
    try {
      await firestore().collection('practices').add({
        userId,
        ...practiceData,
        createdAt: firestore().FieldValue.serverTimestamp(),
        isActive: true,
        streak: 0,
        lastCompleted: null
      });
    } catch (error) {
      console.error('Error saving practice:', error);
      throw error;
    }
  }

  static async getPractices(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection('practices')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting practices:', error);
      return [];
    }
  }

  static async updatePracticeCompletion(practiceId: string, completed: boolean): Promise<void> {
    try {
      await firestore().collection('practices').doc(practiceId).update({
        lastCompleted: firestore().FieldValue.serverTimestamp(),
        streak: completed ? firestore().FieldValue.increment(1) : 0
      });
    } catch (error) {
      console.error('Error updating practice completion:', error);
      throw error;
    }
  }

  // Reading Plans Functions
  static async saveReadingPlan(userId: string, planData: any): Promise<string> {
    try {
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase operation timeout')), 10000)
      );
      
      const savePromise = firestore().collection('reading_plans').add({
        userId,
        ...planData,
        createdAt: firestore().FieldValue.serverTimestamp(),
      });
      
      const docRef = await Promise.race([savePromise, timeoutPromise]) as any;
      return docRef.id; // Return the actual Firestore document ID
    } catch (error) {
      console.error('Error saving reading plan:', error);
      throw error;
    }
  }

  static async getReadingPlans(userId: string): Promise<any[]> {
    try {
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase operation timeout')), 10000)
      );
      
      const getPromise = firestore()
        .collection('reading_plans')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const snapshot = await Promise.race([getPromise, timeoutPromise]) as any;
      return snapshot.docs.map((doc: any) => ({ 
        id: doc.data().id, // Use the original plan ID
        firestoreId: doc.id, // Store the Firestore document ID
        ...doc.data() 
      }));
    } catch (error) {
      console.error('Error getting reading plans:', error);
      return [];
    }
  }

  static async updateReadingProgress(userId: string, firestoreDocId: string, completed: boolean): Promise<void> {
    try {
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase operation timeout')), 10000)
      );
      
      const updatePromise = firestore().collection('reading_plans').doc(firestoreDocId).update({
        lastUpdated: firestore().FieldValue.serverTimestamp(),
        completedDays: completed ? firestore().FieldValue.increment(1) : firestore().FieldValue.increment(-1),
      });
      
      await Promise.race([updatePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error updating reading progress:', error);
      throw error;
    }
  }

  // Statistics Functions
  static async getUserStatistics(userId: string): Promise<any> {
    try {
      const [prayerSessions, readingSessions, practices, memoryVerses] = await Promise.all([
        this.getPrayerSessions(userId),
        this.getReadingSessions(userId),
        this.getPractices(userId),
        this.getMemoryVerses(userId),
      ]);

      return {
        prayerSessions,
        readingSessions,
        practices,
        memoryVerses,
        totalPrayerTime: prayerSessions.reduce((total, session) => total + (session.duration || 0), 0),
        totalReadingTime: readingSessions.reduce((total, session) => total + (session.duration || 0), 0),
        activePractices: practices.filter(p => p.isActive).length,
        masteredVerses: memoryVerses.filter(v => v.mastery === 'mastered').length,
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  static async backupData(userId: string, data: any): Promise<void> {
    try {
      console.log('Backing up data to Firebase:', userId, data);
      // await firestore().collection(COLLECTIONS.USERS).doc(userId).set({
      //   ...data,
      //   lastBackup: firestore.FieldValue.serverTimestamp()
      // });
    } catch (error) {
      console.error('Error backing up data:', error);
      throw error;
    }
  }

  static async restoreData(userId: string): Promise<any> {
    try {
      console.log('Restoring data from Firebase:', userId);
      // const doc = await firestore().collection(COLLECTIONS.USERS).doc(userId).get();
      // return doc.exists ? doc.data() : null;
      return null;
    } catch (error) {
      console.error('Error restoring data:', error);
      return null;
    }
  }
}
