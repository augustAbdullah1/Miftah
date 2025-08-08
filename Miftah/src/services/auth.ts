import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export class AuthService {
  // Register new user
  static async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, { displayName });

      // Send email verification
      await sendEmailVerification(firebaseUser);

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email!,
        displayName,
        photoURL: firebaseUser.photoURL,
        phoneNumber: firebaseUser.phoneNumber,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 0,
        totalRatings: 0,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign in user
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = userDoc.data();
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName,
        photoURL: firebaseUser.photoURL || userData.photoURL,
        phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber,
        isVerified: firebaseUser.emailVerified,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        location: userData.location,
        rating: userData.rating || 0,
        totalRatings: userData.totalRatings || 0,
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out user
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Send password reset email
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Send email verification
  static async sendEmailVerification(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user signed in');
      
      await sendEmailVerification(user);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<User>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user signed in');

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName || user.displayName,
          photoURL: updates.photoURL || user.photoURL,
        });
      }

      // Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || userData.displayName,
        photoURL: firebaseUser.photoURL || userData.photoURL,
        phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber,
        isVerified: firebaseUser.emailVerified,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        location: userData.location,
        rating: userData.rating || 0,
        totalRatings: userData.totalRatings || 0,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              photoURL: firebaseUser.photoURL || userData.photoURL,
              phoneNumber: firebaseUser.phoneNumber || userData.phoneNumber,
              isVerified: firebaseUser.emailVerified,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              location: userData.location,
              rating: userData.rating || 0,
              totalRatings: userData.totalRatings || 0,
            };
            callback(user);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Handle authentication errors
  private static handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('No user found with this email');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/email-already-in-use':
        return new Error('Email is already registered');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters');
      case 'auth/invalid-email':
        return new Error('Invalid email address');
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later');
      default:
        return new Error(error.message || 'Authentication error occurred');
    }
  }
}