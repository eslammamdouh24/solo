# Admin Role System Guide

## 🔐 Overview

This app now has a complete admin role system that allows you to:

- View all users and their stats
- Promote users to admin
- Demote admins back to regular users
- Delete user accounts
- View app-wide statistics
- Manage the entire app

## 📋 Setup Instructions

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard → **SQL Editor**
2. Open the file: `/database/add_admin_role.sql`
3. Copy and paste the entire SQL script
4. **Important:** At the bottom of the script, find this section:

```sql
-- Step 8: Manually set first admin (REPLACE 'your-email@example.com' with your actual email)
-- UPDATE game_states
-- SET role = 'admin'
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1
-- );
```

5. **Uncomment** these lines and replace `'your-email@example.com'` with your actual email address
6. Run the entire script

Example:

```sql
UPDATE game_states
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'myemail@example.com' LIMIT 1
);
```

### Step 2: Sign In

1. Restart your app
2. Sign in with the email you promoted to admin
3. Go to **Profile** screen
4. You should now see a gold "ADMIN DASHBOARD" button

## 🎯 Features

### Admin Dashboard

Access: **Profile → ADMIN DASHBOARD** button

#### App Statistics

- **Total Users**: Number of registered users
- **Total Workouts**: All workouts logged across the app
- **Total XP**: Sum of all XP earned by all users
- **Avg Level**: Average level of all users

#### User Management

- **View All Users**: See complete list with username, email, level, XP, workout count
- **Promote to Admin**: Grant admin privileges to any user
- **Demote Admin**: Remove admin privileges (cannot demote yourself)
- **Delete User**: Permanently delete a user account
- **Admin Badge**: Users with admin role display a gold "ADMIN" badge

### Security Features

✅ **Row Level Security (RLS)**

- Admins can view all data
- Regular users can only see their own data

✅ **SQL Functions**

- `is_admin()`: Check if current user is admin
- `promote_to_admin(user_id)`: Promote a user (admin only)
- `demote_to_user(user_id)`: Demote an admin (admin only)

✅ **Self-Protection**

- Admins cannot demote themselves
- Prevents accidental loss of admin access

## 🔧 Database Schema

### New Column: `role`

```sql
ALTER TABLE game_states
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
```

**Values:**

- `'user'` (default): Regular user
- `'admin'`: Administrator with full access

## 🎨 UI Components

### Profile Screen

- Gold "ADMIN DASHBOARD" button (visible only to admins)
- Shield crown icon

### Admin Dashboard Screen

- Statistics cards with icons
- User cards with:
  - Username and email
  - Level, XP, and workout count
  - Admin badge (if applicable)
  - Action buttons (promote/demote, delete)
- Pull-to-refresh support
- Responsive layout

## 🌐 Translations

Admin features support both **English** and **Arabic** (RTL):

- Dashboard labels
- Confirmation dialogs
- Success/error messages
- Button text

## 📱 How to Use

### As an Admin:

1. **Access Dashboard**
   - Go to Profile
   - Tap "ADMIN DASHBOARD" button

2. **Promote a User**
   - Find the user in the list
   - Tap "Make Admin" button
   - Confirm the action

3. **Demote an Admin**
   - Find the admin in the list
   - Tap "Remove Admin" button
   - Confirm the action

4. **Delete a User**
   - Find the user in the list
   - Tap "Delete" button
   - Confirm the deletion (cannot be undone!)

5. **View Stats**
   - Dashboard shows real-time statistics
   - Pull down to refresh

### As a Regular User:

- Admin features are completely hidden
- Attempting to access `/admin` route shows "Access Denied"
- No visual indication of admin features

## 🔒 Best Practices

1. **Create at least 2 admins** - In case one loses access
2. **Be careful with deletions** - User deletions are permanent
3. **Regularly review admins** - Remove admin privileges when no longer needed
4. **Protect admin accounts** - Use strong passwords
5. **Monitor admin actions** - Keep track of who has admin access

## 🐛 Troubleshooting

### "Access Denied" when trying to access admin

- Make sure you ran the SQL migration
- Verify your email in the UPDATE statement matches your account
- Check the `role` column in `game_states` table:
  ```sql
  SELECT user_id, username, email, role FROM game_states;
  ```

### Admin button not showing

- Sign out and sign back in
- Check that `isAdmin` is true in AuthContext
- Verify the role in database is `'admin'`

### Cannot promote/demote users

- Make sure you're signed in as an admin
- Check Supabase logs for errors
- Verify RLS policies are set correctly

## 🚀 Future Enhancements

Possible additions:

- [ ] Audit log of admin actions
- [ ] Ban/suspend users temporarily
- [ ] View detailed user workout history
- [ ] Export user data
- [ ] Send notifications to users
- [ ] Custom role permissions
- [ ] Multiple admin levels (super admin, moderator, etc.)

## 📞 Support

If you encounter issues:

1. Check Supabase logs
2. Verify SQL migration ran successfully
3. Check browser console for errors
4. Ensure you're using the latest version of the app

---

**Security Note**: Keep your admin credentials secure. Admin accounts have full access to manage all users and data in the app.
