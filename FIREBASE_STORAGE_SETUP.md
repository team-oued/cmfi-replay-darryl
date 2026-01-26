# Firebase Storage Configuration

## Issue
Users were getting permission errors when uploading profile photos:
```
FirebaseError: Firebase Storage: User does not have permission to access 'avatars/meI8eUoJxjSd3MHd7BmXqK1l7TS2/1769223701976_Image1.png'. (storage/unauthorized)
```

## Solution
Firebase Storage security rules need to be configured to allow users to upload their own avatar files.

## Steps to Fix

### 1. Deploy Storage Rules
The `storage.rules` file has been created with the following rules:
- Users can read/write their own avatar files (`/avatars/{userId}/`)
- Anyone can read avatar files (for profile display)
- All other paths are denied by default

To deploy these rules:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy storage rules
firebase deploy --only storage
```

### 2. Alternative: Manual Setup via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `c-m-f-i-replay-f-63xui3`
3. Navigate to Storage → Rules
4. Replace the existing rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can read/write their own avatar files
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read avatar files (for profile display)
    match /avatars/{userId}/{fileName} {
      allow read: if true;
    }
    
    // Default deny for all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click "Publish"

## Code Improvements
The `EditProfileScreen.tsx` has been improved with:
- Better error handling for specific Firebase Storage errors
- Sanitized filenames to prevent invalid characters
- Added metadata for uploads
- More descriptive error messages in French

## Testing
After deploying the storage rules, test the photo upload functionality:
1. Go to Profile → Edit Profile
2. Click "Change Photo"
3. Select an image file (under 5MB)
4. Verify the upload completes successfully
5. Check that the new avatar appears in the profile

## Security Notes
- Users can only upload to their own avatar directory
- File size is limited to 5MB in the client code
- File type is validated to be images only
- Filenames are sanitized to prevent path traversal attacks
