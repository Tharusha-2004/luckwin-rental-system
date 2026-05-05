# Luckwin Stores - Equipment Rental & Inventory Management System

## Overview

A complete **Web-Based Equipment Rental and Inventory Management System** for construction equipment rental shops. Built with modern technologies including **Node.js + Express** backend, **React** frontend, and **MongoDB** database.

## Features

### ✨ Core Features

- **Equipment Inventory Management**: Track items by bulk quantity with dynamic availability
- **Customer Management**: Register and manage customer profiles with NIC verification
- **Rental System**: Create rentals with automatic cost calculation
- **Return Processing**: Handle equipment returns with recalculated costs based on actual days rented
- **Admin Dashboard**: Real-time overview of active rentals, overdue items, and low-stock alerts
- **Digital Receipts**: Professional receipt generation with unique agreement tokens
- **Notifications**: MVP notification service (console) with hooks for WhatsApp/SMS/Email integration

### 💼 Business Logic

- **Pricing Model**: Daily rate-based pricing (not per-item with serial numbers)
- **Advance Payments**: Collected at rental creation and deducted from final bill
- **Overdue Handling**: No special penalty; normal daily rates apply to extra days
- **Cost Calculation**: `Quantity × Daily Rate × Duration in Days`

## Technology Stack

### Backend
- **Node.js** v16+
- **Express.js** v4.x
- **MongoDB** (Local or Atlas)
- **Mongoose** v7.x (ODM)
- **CORS** for cross-origin requests
- **dotenv** for environment variables
- **UUID** for unique token generation

### Frontend
- **React** v18.x
- **React Router DOM** v6.x
- **Axios** for API calls
- **Tailwind CSS** v3.x for styling
- **Lucide Icons** for UI icons
- **date-fns** for date manipulation

### Development Tools
- **Nodemon** (backend hot reload)
- **React Scripts** v5.x

## Project Structure

```
luckwin/
├── backend/
│   ├── models/
│   │   ├── Item.js           # Equipment item schema
│   │   ├── Customer.js       # Customer schema
│   │   └── Rental.js         # Transaction/rental schema
│   ├── controllers/
│   │   ├── itemController.js
│   │   ├── customerController.js
│   │   └── rentalController.js
│   ├── routes/
│   │   ├── itemRoutes.js
│   │   ├── customerRoutes.js
│   │   ├── rentalRoutes.js
│   │   └── receiptRoutes.js
│   ├── services/
│   │   └── notificationService.js   # Modular notification system
│   ├── middleware/
│   ├── utils/
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── LoadingSpinner.js
    │   │   ├── ErrorAlert.js
    │   │   └── SuccessAlert.js
    │   ├── pages/
    │   │   ├── Dashboard.js       # Overview & analytics
    │   │   ├── InventoryPage.js   # Add/Edit/View items
    │   │   ├── CustomersPage.js   # Customer registration & history
    │   │   ├── RentalsPage.js     # POS-style rental creation
    │   │   └── ReceiptPage.js     # Public receipt/invoice
    │   ├── services/
    │   │   └── api.js             # API client with all endpoints
    │   ├── utils/
    │   │   └── helpers.js         # Formatting & utility functions
    │   ├── App.js                 # Main router
    │   ├── index.js               # React entry point
    │   └── index.css              # Tailwind styles
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## Installation & Setup

### Prerequisites
- Node.js v16+
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

4. **Configure `.env`**
   ```env
   MONGODB_URI=mongodb://localhost:27017/luckwin_rental
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start MongoDB** (if local)
   ```bash
   # On Windows (if MongoDB installed)
   mongod
   
   # Or use MongoDB Atlas connection string
   ```

6. **Start backend server**
   ```bash
   npm run dev
   ```
   Server runs at: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Application opens at: `http://localhost:3000`

## API Endpoints

### Items Management
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get single item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item (only if not in active rentals)
- `GET /api/items/low-stock` - Get items with low inventory

### Customers Management
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Register new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/search?query=` - Search customers
- `GET /api/customers/:id/history` - Get customer rental history

### Rentals Management
- `POST /api/rentals` - Create new rental
  - **Payload**:
    ```json
    {
      "customerId": "customer_id",
      "rentedItems": [
        {"itemId": "item_id", "quantity": 5}
      ],
      "expectedReturnDate": "2024-12-31",
      "advancePayment": 500
    }
    ```
  - **Response**: Returns rental with unique `agreementToken`
  
- `GET /api/rentals` - Get all rentals (optional filters: status, customerId)
- `GET /api/rentals/:id` - Get rental details
- `POST /api/rentals/:id/return` - Process return and recalculate costs
- `GET /api/rentals/active` - Get active rentals only
- `GET /api/rentals/overdue` - Get overdue rentals

### Receipts (Public)
- `GET /api/receipt/:token` - Get receipt by agreement token (PUBLIC)
  - Returns complete rental details with formatted costs

## Database Schemas

### Item Schema
```javascript
{
  name: String (required, unique),
  description: String,
  dailyRate: Number (required),
  totalQuantity: Number (required),
  availableQuantity: Number (auto-calculated),
  category: String (Scaffolding/Tools/Machinery/Safety/Other),
  unit: String,
  imageUrl: String,
  timestamps: true
}
```

### Customer Schema
```javascript
{
  name: String (required),
  phone: String (required, unique),
  nic: String (required, unique),
  nicImageUrl: String,
  email: String,
  address: String,
  city: String,
  companyName: String,
  notes: String,
  timestamps: true
}
```

### Rental Schema
```javascript
{
  customerId: ObjectId (ref: Customer),
  rentedItems: [
    {
      itemId: ObjectId (ref: Item),
      quantity: Number,
      dailyRate: Number
    }
  ],
  rentDate: Date (default: now),
  expectedReturnDate: Date (required),
  actualReturnDate: Date,
  advancePayment: Number,
  totalCost: Number,
  finalAmount: Number (calculated: totalCost - advancePayment),
  status: String (Active/Returned/Overdue),
  agreementToken: String (unique),
  notes: String,
  timestamps: true
}
```

## Notification Service (MVP)

The `notificationService.js` provides modular notification functions:

### Current Implementation
- Console logging (mock messages)

### Ready for Integration
- **WhatsApp Cloud API**: Leave comments indicate where API keys inject
- **Nodemailer**: Email support structure ready
- **SMS Gateway**: Twilio/AWS SNS hooks included
- **Firebase Cloud Messaging**: App notification hooks

### Usage Example
```javascript
const notificationService = require('./services/notificationService');

// Send digital receipt
await notificationService.sendDigitalReceipt(
  '+1234567890', 
  'unique-agreement-token'
);

// Send SMS reminder
await notificationService.sendSMS(phone, 'Your rental is due tomorrow');

// Send Email
await notificationService.sendEmail(
  email, 
  'Rental Receipt', 
  '<html>...</html>'
);
```

## Frontend Features

### Dashboard
- **Overview Cards**: Active rentals, overdue items, low stock
- **Active Rentals Table**: List of current rentals with key info
- **Overdue Alert**: Highlighted section with overdue rental contacts
- **Low Stock Alert**: Inventory items below 10% threshold
- Auto-refresh every 30 seconds

### Inventory Management
- Add/Edit/Delete equipment items
- Search functionality
- Stock level indicators
- Bulk quantity support

### Customer Registration
- Register new customers with NIC verification
- View customer rental history
- Search and filter customers
- Edit/Delete customer profiles

### Rental Creation (POS Style)
- Select customer from dropdown
- Add multiple items with quantities
- Real-time cost calculation based on duration
- Advance payment input
- Automatic receipt generation with unique token

### Digital Receipt
- Professional invoice layout with logo
- Customer details section
- Itemized list of rented equipment
- Financial summary (subtotal, advance, due amount)
- Terms & conditions
- Print and PDF download support (PDF in roadmap)
- Responsive design for mobile

## Workflow Example

### Creating a Rental

1. **Go to Rentals Page** → Click "New Rental"
2. **Select Customer** → Choose from registered customers
3. **Add Items** → Select equipment and quantities
4. **Set Return Date** → Pick expected return date
5. **Input Advance Payment** → Optional payment upfront
6. **Submit** → System generates unique token and sends notification
7. **Receipt** → Customer receives link to `/receipt/{token}`

### Processing Return

1. **Find Rental** on Rentals page
2. **Click "Process Return"**
3. **System calculates**:
   - Days actually kept
   - Recalculated total cost
   - Final amount due (or overpaid)
4. **Equipment quantities restored** to inventory
5. **Status changed** to "Returned"

## Future Enhancements

- [ ] PDF receipt download
- [ ] WhatsApp API integration for receipt delivery
- [ ] SMS notifications for overdue rentals
- [ ] Email receipt delivery
- [ ] Firebase Cloud Messaging for push notifications
- [ ] Advanced analytics and reporting
- [ ] Late payment penalties (optional configurable fee)
- [ ] Damage assessment and deduction system
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Multi-user roles (admin, staff, manager)
- [ ] Backup and disaster recovery system
- [ ] Mobile app (React Native)

## API Testing

### Using cURL

```bash
# Get all items
curl http://localhost:5000/api/items

# Create new customer
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890",
    "nic": "NIC123456"
  }'

# Create new rental
curl -X POST http://localhost:5000/api/rentals \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer_id",
    "rentedItems": [{"itemId": "item_id", "quantity": 5}],
    "expectedReturnDate": "2024-12-31",
    "advancePayment": 500
  }'

# Get receipt
curl http://localhost:5000/api/receipt/agreement-token-here
```

### Using Postman
1. Import the API endpoints
2. Set base URL: `http://localhost:5000/api`
3. Test each endpoint with sample data

## Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity for MongoDB Atlas

**Port Already in Use**
- Change `PORT` in `.env`
- Or kill process on port 5000

**CORS Errors**
- Frontend and backend must run on different ports
- Backend CORS is configured to allow all origins in dev

### Frontend Issues

**API calls failing**
- Ensure backend is running on `http://localhost:5000`
- Check network tab in browser DevTools
- Verify proxy setting in `package.json` matches backend port

**Tailwind styles not applying**
- Run `npm install` to ensure all dependencies installed
- Restart dev server
- Clear browser cache

## Development Notes

- Backend uses **transaction support** for atomic rental creation and returns
- **Available quantity** is managed at the database level during rentals
- **Agreement tokens** are unique and can be shared for receipt access
- **Status updates** happen automatically (e.g., overdue marking)
- **Cost recalculation** on return ensures accurate billing based on actual days

## License

MIT License - Feel free to use this project for your business

## Support

For issues or questions, please create an issue on the repository.

---

**Built with ❤️ for Luckwin Stores**
