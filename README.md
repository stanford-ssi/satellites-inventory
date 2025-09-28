# Inventory Management System MVP

A modern inventory management system built with Next.js 14, Supabase, and shadcn/ui components.

## 🚀 Features

### ✅ Milestone 1 - Core Inventory (Completed)
- **Authentication**: Secure login/register with Supabase Auth
- **Role-based Access**: Admin (full access) vs Member (view only)
- **Inventory Table**: Search, filter, and view all parts
- **CRUD Operations**: Add, edit, and delete parts (Admin only)
- **Low Stock Indicators**: Visual badges for stock status
- **Responsive Design**: Mobile-friendly interface

### 🔄 Future Milestones
- **QR System**: Auto-generate QR codes and scanner functionality
- **Dashboard**: Recent activity, alerts, and quick stats
- **Transaction Logging**: Checkout/return tracking

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database + Authentication)
- **Deployment**: Vercel
- **Styling**: Clean white background, black text, customizable primary colors

## 📦 Database Schema

### Tables

#### `users`
- `id` (UUID, FK to auth.users)
- `email` (TEXT, UNIQUE)
- `role` (TEXT: 'admin' | 'member')
- `name` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

#### `inventory`
- `id` (UUID, PRIMARY KEY)
- `part_id` (TEXT, UNIQUE)
- `description` (TEXT)
- `bin_id` (TEXT)
- `location_within_bin` (TEXT)
- `quantity` (INTEGER)
- `part_link` (TEXT, NULLABLE)
- `qr_code` (TEXT, NULLABLE)
- `created_at`, `updated_at` (TIMESTAMP)

#### `transactions`
- `id` (UUID, PRIMARY KEY)
- `part_id` (TEXT, FK to inventory)
- `user_id` (UUID, FK to users)
- `type` ('checkout' | 'return')
- `quantity` (INTEGER)
- `timestamp` (TIMESTAMP)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd satellites-inventory
npm install
```

### 2. Supabase Setup

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for setup to complete

2. **Get your credentials**:
   - Go to Settings → API
   - Copy `Project URL` and `anon public key`

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Run the database schema**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy and run the contents of `supabase/schema.sql`
   - This will create all tables, triggers, and RLS policies

### 3. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Create Your First Admin User

1. Register a new account through the app
2. In Supabase Dashboard → Table Editor → users
3. Change the `role` field from 'member' to 'admin' for your user

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy

3. **Alternative: Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

## 🎨 Customization

### Theme Colors

The app uses CSS custom properties for easy theming. Edit `src/app/globals.css`:

```css
:root {
  --primary: /* Your brand color */
  --background: white;
  --foreground: black;
}
```

### Adding New Components

Use shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## 📱 Usage

### For Members
- View inventory with search and filtering
- See stock levels and part details
- Access part links

### For Admins
- All member features
- Add new parts to inventory
- Edit existing parts
- Delete parts
- Manage stock levels

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: Admin vs Member access
- **Secure Authentication**: Supabase Auth with email verification
- **Protected Routes**: Middleware-based route protection

## 📊 Stock Status Indicators

- 🔴 **Out of Stock**: Quantity = 0
- 🟡 **Low Stock**: Quantity ≤ 10
- 🟢 **In Stock**: Quantity > 10

## 🧪 Development

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/            # Authentication
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   └── inventory/        # Inventory-specific components
├── lib/
│   └── supabase/         # Supabase configuration
├── types/
│   └── database.ts       # TypeScript types
└── middleware.ts         # Route protection
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

1. **Supabase connection errors**:
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are set up

2. **Authentication issues**:
   - Confirm email verification
   - Check user role in database
   - Verify middleware configuration

3. **Build failures**:
   - Run `npm run lint` to check for errors
   - Ensure all environment variables are set

### Getting Help

- Check the [Supabase docs](https://supabase.com/docs)
- Review [Next.js documentation](https://nextjs.org/docs)
- Check [shadcn/ui docs](https://ui.shadcn.com)

---

**Built with ❤️ using Next.js, Supabase, and shadcn/ui**