# Multi-User Profile System (Netflix-like)

## Overview

The Multi-User Profile System allows Premium account holders to create and manage multiple user profiles under a single company account, similar to Netflix's profile management system. Each profile has its own permissions, role, and personalized experience.

## Features

### 🎯 Core Features

- **Multiple User Profiles**: Create up to 10 profiles per Premium account
- **Role-Based Access Control**: 5 different roles with specific permissions
- **Profile Switching**: Quick profile switching without logging out
- **Permission Management**: Granular permissions for each profile
- **Profile Management**: Add, edit, and delete profiles
- **User Invitations**: Invite new users via email
- **Premium Restriction**: Only available for Premium accounts

### 👥 User Roles

1. **Administrateur (Admin)**
   - Full access to all features
   - Can manage other users
   - Can modify company settings
   - All permissions enabled

2. **Gestionnaire (Manager)**
   - Manage quotes, invoices, and clients
   - View analytics
   - Cannot manage users or settings

3. **Comptable (Accountant)**
   - Manage invoices and view analytics
   - Limited to financial operations

4. **Commercial (Sales)**
   - Manage quotes and clients
   - Focus on sales activities

5. **Lecteur (Viewer)**
   - Read-only access to assigned features
   - Cannot make changes

### 🔐 Permissions

- **quotes**: Manage quotes and quote creation
- **invoices**: Manage client and supplier invoices
- **clients**: Manage client information
- **analytics**: View analytics and reports
- **settings**: Modify application settings
- **users**: Manage user profiles (admin only)

## Technical Implementation

### Components

#### 1. MultiUserProfile Component
```jsx
<MultiUserProfile
  currentUser={currentUser}
  companyUsers={companyUsers}
  onProfileSwitch={handleProfileSwitch}
  onAddProfile={handleAddProfile}
  onEditProfile={handleEditProfile}
  onDeleteProfile={handleDeleteProfile}
  isPremium={isPremium}
  maxProfiles={10}
/>
```

#### 2. ProfileSwitcher Component
```jsx
<ProfileSwitcher className="ml-auto" />
```

#### 3. MultiUserContext
```jsx
const {
  currentProfile,
  companyProfiles,
  switchProfile,
  hasPermission,
  isAdmin
} = useMultiUser();
```

### Services

#### MultiUserService
- `getCompanyProfiles(companyId)`: Fetch all profiles for a company
- `addProfile(companyId, profileData)`: Create a new profile
- `updateProfile(companyId, profileId, profileData)`: Update existing profile
- `deleteProfile(companyId, profileId)`: Delete a profile
- `switchProfile(companyId, profileId)`: Switch to a different profile
- `hasPermission(companyId, permission)`: Check user permissions
- `inviteUser(companyId, email, role, permissions)`: Send user invitation

### Context Management

The `MultiUserContext` provides:
- Current profile state
- Profile switching functionality
- Permission checking
- Role-based access control
- Profile management operations

## Usage Examples

### Checking Permissions
```jsx
import { useMultiUser } from '../context/MultiUserContext';

const MyComponent = () => {
  const { hasPermission, canManageQuotes, isAdmin } = useMultiUser();

  if (!hasPermission('quotes')) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {canManageQuotes() && <QuoteManagement />}
      {isAdmin() && <UserManagement />}
    </div>
  );
};
```

### Profile Switching
```jsx
const { switchProfile, currentProfile } = useMultiUser();

const handleSwitch = async (profileId) => {
  try {
    await switchProfile(profileId);
    // Profile switched successfully
  } catch (error) {
    console.error('Failed to switch profile:', error);
  }
};
```

### Adding a New Profile
```jsx
const { addProfile } = useMultiUser();

const handleAddProfile = async (profileData) => {
  try {
    const newProfile = await addProfile(profileData);
    console.log('Profile added:', newProfile);
  } catch (error) {
    console.error('Failed to add profile:', error);
  }
};
```

## File Structure

```
src/
├── components/ui/
│   ├── MultiUserProfile.jsx      # Main profile management component
│   ├── ProfileSwitcher.jsx       # Quick profile switching dropdown
│   └── UserProfile.jsx           # Updated with profile switcher
├── context/
│   └── MultiUserContext.jsx      # Multi-user state management
├── services/
│   └── multiUserService.js       # API service for profile operations
└── pages/
    └── multi-user-profiles/
        └── index.jsx             # Profile management page
```

## Routes

- `/multi-user-profiles`: Main profile management page
- Accessible via sidebar under "Administration" section

## Premium Features

### Subscription Tiers

**Free Account:**
- 1 profile only
- Basic features
- No multi-user functionality

**Premium Account:**
- Up to 10 profiles
- Multi-user management
- Advanced permissions
- User invitations
- Priority support

**Enterprise Account:**
- Unlimited profiles
- Advanced analytics
- Custom roles
- API access
- Dedicated support

## Security Features

- **Role-based Access Control**: Each profile has specific permissions
- **Profile Isolation**: Users can only access features they have permission for
- **Session Management**: Profile switching maintains security context
- **Audit Trail**: Track profile changes and access
- **Invitation System**: Secure user onboarding process

## User Experience

### Profile Selection
- Netflix-style profile grid
- Visual role indicators
- Quick switching without logout
- Profile avatars with initials

### Management Interface
- Intuitive profile creation
- Permission assignment
- Role-based UI adaptation
- Real-time updates

### Mobile Responsive
- Adaptive layout for mobile devices
- Touch-friendly interface
- Collapsible sidebar integration

## Future Enhancements

1. **Profile Avatars**: Custom avatar upload
2. **Activity Tracking**: Monitor profile usage
3. **Bulk Operations**: Manage multiple profiles at once
4. **Advanced Permissions**: More granular permission system
5. **Profile Templates**: Pre-configured role templates
6. **Integration**: Connect with external identity providers
7. **Analytics**: Profile usage analytics
8. **Notifications**: Profile-specific notifications

## Configuration

### Environment Variables
```env
REACT_APP_MAX_PROFILES=10
REACT_APP_INVITATION_EXPIRY_DAYS=7
REACT_APP_ENABLE_MULTI_USER=true
```

### Local Storage Keys
- `multi-user-profiles-{companyId}`: Company profiles
- `current-profile-id`: Current active profile
- `subscription-{companyId}`: Subscription status
- `invitations-{companyId}`: Pending invitations

## Testing

### Unit Tests
- Profile creation and management
- Permission checking
- Role validation
- Context state management

### Integration Tests
- Profile switching flow
- Permission enforcement
- Multi-user collaboration
- Invitation system

### E2E Tests
- Complete user journey
- Profile management workflow
- Permission-based access control
- Mobile responsiveness

## Troubleshooting

### Common Issues

1. **Profile not switching**: Check localStorage permissions
2. **Permissions not updating**: Verify context refresh
3. **Invitation not working**: Check email configuration
4. **Premium features locked**: Verify subscription status

### Debug Mode
```jsx
// Enable debug logging
localStorage.setItem('debug-multi-user', 'true');
```

## Support

For technical support or feature requests related to the Multi-User Profile System, please contact the development team or refer to the internal documentation. 