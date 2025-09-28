# Satellites Inventory Management System Setup

## 🚀 Quick Setup Guide

### 1. **Set up your Supabase Database**

1. **Go to your Supabase project dashboard**
   - Visit [Supabase](https://supabase.com) and open your project
   - Navigate to the **SQL Editor**

2. **Run the database setup script**
   - Copy the contents of `supabase/setup-database.sql`
   - Paste it into the SQL Editor and run it
   - This will create all tables, policies, and sample data

### 2. **Make yourself an admin**

1. **Sign up for an account first**
   - Go to your app at `http://localhost:3001`
   - Click "Sign up" and create an account

2. **Make your account admin**
   - Go back to Supabase SQL Editor
   - Open `supabase/make-user-admin.sql`
   - Replace `'your-email@example.com'` with your actual email
   - Run the script

### 3. **Verify everything works**

1. **Check the database**
   ```sql
   -- Run this in Supabase SQL Editor to see your tables
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';

   -- Check your user role
   SELECT name, email, role FROM users;

   -- Check inventory data
   SELECT part_id, description, quantity FROM inventory LIMIT 5;
   ```

2. **Test the app**
   - Log in with your account
   - You should see the admin navigation with "Manage Users"
   - Check that inventory data loads from the database
   - Try searching and filtering

## 📊 **What's Included**

### **Database Tables**
- **users** - User profiles with admin/member roles
- **inventory** - Parts catalog with location tracking
- **transactions** - Checkout/return history

### **Sample Data**
- 10 inventory items including resistors, microcontrollers, and sensitive parts
- Role-based access (admins see sensitive items, members don't)
- Proper security policies (RLS enabled)

### **Features**
- ✅ Authentication with automatic user profile creation
- ✅ Role-based permissions (admin/member)
- ✅ Real-time inventory management
- ✅ User management for admins
- ✅ Search and filtering
- ✅ Responsive compact UI
- ✅ Low stock alerts

## 🔧 **Troubleshooting**

### **No data showing up?**
1. Check that you ran the `setup-database.sql` script
2. Verify your `.env` file has the correct Supabase credentials
3. Check browser console for any errors

### **Can't access admin features?**
1. Make sure you ran the `make-user-admin.sql` script with your email
2. Log out and log back in to refresh your role
3. Check your role in Supabase: `SELECT role FROM users WHERE email = 'your-email@example.com';`

### **Authentication not working?**
1. Verify your Supabase URL and anon key in `.env`
2. Check that the auth trigger is working: `SELECT * FROM users;`
3. Try signing up with a new account

## 📁 **File Structure**

```
├── supabase/
│   ├── setup-database.sql      # Complete database setup
│   ├── make-user-admin.sql     # Make users admin
│   └── migrations/             # Schema migrations
├── lib/
│   ├── hooks/                  # Data fetching hooks
│   ├── supabase/              # Supabase configuration
│   └── auth/                  # Authentication context
├── app/
│   ├── dashboard/             # Main app pages
│   ├── auth/                  # Login/signup pages
│   └── globals.css            # Compact styling
└── components/                # Reusable UI components
```

## 🎯 **Next Steps**

After setup, you can:
1. **Add more inventory items** through the admin interface
2. **Invite team members** and manage their roles
3. **Customize the color scheme** in `app/globals.css`
4. **Add QR code scanning** functionality
5. **Implement transaction logging** for checkouts/returns

## 💡 **Admin Commands**

Useful SQL commands for admins:

```sql
-- Make a user admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Make a user member
UPDATE users SET role = 'member' WHERE email = 'user@example.com';

-- Add new inventory item
INSERT INTO inventory (part_id, description, quantity, min_quantity, bin_id)
VALUES ('YOUR-PART-001', 'Your Part Description', 100, 10, 'A1');

-- Check low stock items
SELECT part_id, description, quantity, min_quantity
FROM inventory
WHERE quantity <= min_quantity;
```

Happy inventory managing! 🎉