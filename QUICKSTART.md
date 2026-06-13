
# Quick Start Guide - Luckwin Stores System

## ⚡ Quick Setup (5 minutes)

### Step 1: Start MongoDB

**Windows (if installed locally):**
```bash
mongod
```

**Or use MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Create cluster
- Copy connection string
- Update MONGODB_URI in backend/.env

### Step 2: Start Backend

```bash
cd backend
npm install
npm run dev
```

✓ Backend runs at: http://localhost:5000

### Step 3: Start Frontend

**In a new terminal:**
```bash
cd frontend
npm install
npm start
```

✓ Frontend opens at: http://localhost:3000

---

## 🎯 First Steps After Launch

### 1. Add Equipment Items
Navigate to **Inventory** → Click **"Add Item"**
- Name: "Scaffolding Boards"
- Daily Rate: 50
- Total Quantity: 100
- Category: "Scaffolding"

### 2. Register a Customer
Navigate to **Customers** → Click **"Add Customer"**
- Name: "John Construction Co"
- Phone: "+1234567890"
- NIC: "NIC123456"

### 3. Create Your First Rental
Navigate to **Rentals** → Click **"New Rental"**
- Select customer
- Add items (scaffolding boards, quantity 10)
- Set return date (5 days from today)
- Set advance payment ($200)
- Click **"Create Rental"**

### 4. View Receipt
After rental created, share the generated token link with customer:
- Example: `http://localhost:3000/receipt/{agreement-token}`

---

## 📱 Key Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | / | Overview of active rentals, overdue items |
| Inventory | /inventory | Manage equipment items |
| Customers | /customers | Register and manage customers |
| Rentals | /rentals | Create and manage rentals |
| Receipt | /receipt/:token | Public digital receipt (shareable) |

---

## 🔧 Common Commands

### Backend
```bash
cd backend

# Install dependencies
npm install

# Start dev server (with auto-reload)
npm run dev

# Start production server
npm start
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running
- Check MONGODB_URI in backend/.env
- Try: `mongod` in terminal

### "Port 3000 already in use"
- Kill process: `lsof -ti:3000 | xargs kill -9`
- Or change port in frontend package.json

### "API calls return 404"
- Ensure backend is running on port 5000
- Check network tab in browser DevTools
- Verify API_BASE_URL in frontend/src/services/api.js

### "Tailwind styles not showing"
- Restart frontend dev server
- Clear browser cache
- Run `npm install` again

---

## 📊 Testing the System

### Create Test Data
```bash
# Add 3-4 items with different daily rates
# Register 2-3 customers
# Create 2-3 rentals with different statuses
```

### Check Dashboard
- See active rental count
- Check overdue items
- Monitor low stock alerts

### Test Return Process
- Click "Process Return" on an active rental
- Verify cost recalculation
- Check item availability restored

---

## 🚀 Next Steps

1. **Customize** - Update logo and colors in Navbar.js
2. **Add Users** - Implement authentication (optional)
3. **Integrate Notifications** - Update notificationService.js with WhatsApp/Email
4. **Deploy** - Deploy backend to Heroku/AWS, frontend to Vercel/Netlify
5. **Backup** - Set up MongoDB backups

---

## 📞 API Testing Quick Links

**Get all items:**
```
http://localhost:5000/api/items
```

**Get all customers:**
```
http://localhost:5000/api/customers
```

**Get all rentals:**
```
http://localhost:5000/api/rentals
```

**Health check:**
```
http://localhost:5000/api/health
```

---

## ✅ Checklist

- [ ] MongoDB running
- [ ] Backend started (npm run dev)
- [ ] Frontend started (npm start)
- [ ] Can access http://localhost:3000
- [ ] Added first item
- [ ] Registered first customer
- [ ] Created first rental
- [ ] Generated receipt link works

---

**You're all set! 🎉**

Start with the Dashboard to see your rentals in action.
