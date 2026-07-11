# 🚀 ResolveX – Smart Complaint Management System

ResolveX is a modern **Complaint Management System** designed to help organizations efficiently manage customer complaints from submission to resolution.

It provides a complete workflow for customers and administrators with **real-time complaint tracking**, **role-based dashboards**, **analytics**, and **automatic SMS & WhatsApp notifications** powered by **Twilio**.

---

# 📌 Project Overview

ResolveX digitizes the complete complaint management process by allowing customers to register complaints online while enabling administrators to manage, assign, track, and resolve complaints through a centralized dashboard.

The system provides **real-time notifications** throughout the complaint lifecycle to ensure transparency and faster communication.

---

# ✨ Features

- 🔐 Secure Authentication using Supabase Auth
- 👤 Role-Based Access (Admin & Customer)
- 📝 Online Complaint Registration
- 📂 Complaint Tracking & History
- 📊 Admin Dashboard
- 📈 Analytics Dashboard
- 🔍 Search & Advanced Filters
- 📱 Automatic SMS Notifications (Twilio)
- 💬 Automatic WhatsApp Notifications (Twilio)
- 🖼️ Image Upload Support
- 📄 Export Reports (Excel/PDF)
- 📜 Notification Logs
- 🌙 Dark / Light Theme
- 📱 Responsive Design

---

# 🧩 Modules

## 👤 Customer Module

Customers can:

- Register Account
- Login
- Raise Complaints
- Upload Supporting Images
- Track Complaint Status
- View Complaint History
- View Admin Replies
- Update Profile
- Receive SMS Notifications
- Receive WhatsApp Notifications

---

### Complaint Form

The complaint form includes:

- Complaint Number *(Auto Generated)*
- Customer Name
- Mobile Number
- Email Address
- Complaint Category
- Complaint Title
- Complaint Description
- Priority
- Image Upload *(Optional)*
- Submit Complaint

---

## 🔐 Admin Module

Administrators can:

- Secure Login
- Dashboard Overview
- View All Complaints
- Search Complaints
- Filter by Category
- Filter by Priority
- Filter by Status
- Filter by Date
- Assign Complaints
- Update Complaint Status
- Add Resolution
- Reply to Customers
- Monitor Notification Logs
- Export Reports
- View Analytics

---

# 🔄 Complaint Workflow

## Step 1 – Customer Creates Complaint

The customer submits the complaint form.

ResolveX automatically:

- Generates a unique Complaint Number
- Stores complaint in Supabase
- Sets status to **Pending**
- Creates complaint history
- Logs notification events

---

## Step 2 – Automatic Notifications

### 📩 Admin Receives

### SMS

```
New Complaint Received

Complaint No: RX-2026-0001

Customer: Rahul

Category: Water Supply

Priority: High

Please review the complaint.
```

### WhatsApp

```
🚨 New Complaint Received

Complaint No: RX-2026-0001

Customer: Rahul

Category: Water Supply

Priority: High

Please review it in the ResolveX Admin Dashboard.
```

---

### 👤 Customer Receives

### SMS

```
Your complaint has been registered successfully.

Complaint No:

RX-2026-0001

Current Status:

Pending

Thank you for choosing ResolveX.
```

### WhatsApp

```
Hello Rahul 👋

Your complaint has been successfully registered.

Complaint Number:

RX-2026-0001

Current Status:

Pending

We will notify you about further updates.

Thank you.
```

---

## Step 3 – Admin Reviews Complaint

The administrator can:

- View Complaint Details
- Review Uploaded Images
- Add Internal Remarks
- Reply to Customer
- Assign Complaint
- Change Status to **Assigned**
- Update to **In Progress**

Example:

| Complaint No | Customer | Category | Status | Action |
|--------------|----------|----------|--------|--------|
| RX-2026-0001 | Rahul | Water Supply | Pending | View |

---

## Step 4 – Complaint Resolution

After resolving the complaint, the administrator enters the resolution.

Example:

```
The damaged water pipeline has been repaired successfully.

Water supply has been restored.
```

The administrator then clicks:

✅ Resolve Complaint

Complaint Status:

**Resolved**

---

## Step 5 – Final Notifications

### SMS

```
Complaint No:

RX-2026-0001

Dear Rahul,

Your complaint has been resolved successfully.

Resolution:

The damaged water pipeline has been repaired.

Thank you.

ResolveX Support
```

---

### WhatsApp

```
Hello Rahul 👋

Your complaint

(RX-2026-0001)

has been resolved successfully.

Resolution:

The damaged water pipeline has been repaired.

Thank you for using ResolveX.
```

---

# 📊 Complaint Status Flow

```text
Customer Creates Complaint
          │
          ▼
       Pending
          │
          ▼
      Assigned
          │
          ▼
    In Progress
          │
          ▼
      Resolved
          │
          ▼
        Closed
          │
     ┌────┴────┐
     ▼         ▼
   SMS      WhatsApp
```

---

# 👤 Customer Dashboard

Customers can access:

- Dashboard Overview
- Raise Complaint
- Complaint History
- Track Complaint
- Complaint Details
- Admin Responses
- Notification History
- Profile Management

---

# 🛠️ Admin Dashboard

## Dashboard Statistics

- Total Complaints
- Today's Complaints
- Pending Complaints
- Assigned Complaints
- In Progress Complaints
- Resolved Complaints
- Closed Complaints

---

## 📈 Analytics

- Complaints by Category
- Complaint Trends
- Status Distribution
- Priority Distribution
- Daily Reports
- Monthly Reports

---

## Complaint Management

- View Complaints
- Search Complaints
- Filter Complaints
- Assign Complaints
- Update Status
- Add Resolution
- Reply to Customer
- Export Reports
- View Notification Logs

---

# 📱 Notification System

ResolveX automatically sends notifications during the complaint lifecycle.

## Customer Notifications

- Complaint Registered
- Complaint Assigned
- Complaint In Progress
- Complaint Resolved
- Complaint Closed

## Admin Notifications

- New Complaint Received
- High Priority Complaint Alerts

---

# 🗄️ Database Design

## Profiles

| Field | Description |
|--------|-------------|
| User ID | Primary Key |
| Full Name | Customer/Admin Name |
| Email | User Email |
| Phone Number | Contact Number |
| Role | Customer/Admin |
| Status | Active/Suspended |

---

## Complaints

| Field | Description |
|--------|-------------|
| Complaint ID | Primary Key |
| Complaint Number | Auto Generated |
| User ID | Foreign Key |
| Category | Complaint Category |
| Title | Complaint Title |
| Description | Complaint Details |
| Priority | Low/Medium/High |
| Image | Optional |
| Status | Pending/Assigned/In Progress/Resolved/Closed |
| Created At | Timestamp |
| Updated At | Timestamp |

---

## Complaint Replies

| Field | Description |
|--------|-------------|
| Reply ID | Primary Key |
| Complaint ID | Foreign Key |
| Admin ID | Foreign Key |
| Reply | Admin Response |
| Created At | Timestamp |

---

## Notifications

| Field | Description |
|--------|-------------|
| Notification ID | Primary Key |
| Complaint ID | Foreign Key |
| Recipient | Customer/Admin |
| Channel | SMS / WhatsApp |
| Message | Notification Message |
| Delivery Status | Sent / Failed |
| Provider Response | Twilio Response |
| Created At | Timestamp |

---

# 🛠️ Technology Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- Framer Motion
- React Router

---

## Backend

- Node.js
- Express.js

---

## Database

- Supabase
- PostgreSQL

---

## Authentication

- Supabase Auth

---

## Notifications

- Twilio SMS
- Twilio WhatsApp

---

## Reports

- Excel Export
- PDF Export

---

# 🔒 Key Features

- Secure Authentication
- Role-Based Authorization
- Complaint Tracking
- Automatic Complaint Number Generation
- Complaint Status History
- Image Upload
- SMS Notifications
- WhatsApp Notifications
- Dashboard Analytics
- Notification Logs
- Search & Filters
- Export Reports
- Responsive UI

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/your-username/resolvex.git
```

## Install Frontend

```bash
npm install
```

## Install Backend

```bash
cd server
npm install
```

## Configure Environment Variables

Create:

Frontend

```
.env.local
```

Backend

```
server/.env
```

Add your:

- Supabase Credentials
- Twilio Credentials

---

## Run Backend

```bash
cd server
npm run dev
```

---

## Run Frontend

```bash
npm run dev
```

---

# 📌 Future Enhancements

- Email Notifications
- Push Notifications
- OTP Authentication
- AI Complaint Categorization
- AI Priority Prediction
- Mobile Application
- GIS Location Support
- Multi-language Support
- Live Chat Support

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the Repository

2. Create a Feature Branch

3. Commit Your Changes

4. Push to GitHub

5. Open a Pull Request

---

# 📄 License

This project is licensed for educational and demonstration purposes.

---

# 👨‍💻 Developed By

**ResolveX – Smart Complaint Management System**

Built with ❤️ using **React, Node.js, Supabase, and Twilio**.
