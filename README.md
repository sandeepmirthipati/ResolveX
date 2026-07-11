Smart Complaint Management System with SMS & WhatsApp Notifications
Project Overview
The Smart Complaint Management System is a web-based application that allows customers to raise complaints online and enables administrators to manage, track, and resolve those complaints efficiently. The system provides real-time SMS and WhatsApp notifications at every important stage of the complaint lifecycle, ensuring clear communication between users and administrators.

Modules
1. User Module (Customer Portal)
The customer can:
Register/Login (optional)
Raise a new complaint
View complaint history
Track complaint status
View admin responses
Update profile
Complaint Form
The complaint form contains:
Complaint ID (Auto Generated)
Name
Mobile Number
Complaint Category
Complaint Title
Complaint Description
Upload Image (Optional)
Submit Button
2. Admin Module
The administrator can:
Secure Login
View all complaints
Search complaints
Filter by status, category, or date
View complaint details
Reply to complaints
Change complaint status
Mark complaints as Completed
View notification history
Monitor dashboard analytics
Complaint Workflow
Step 1 – User Raises Complaint
The user fills out the complaint form and clicks Submit.
The system automatically:
Generates a unique Complaint ID
Saves the complaint in the database
Sets the complaint status to Pending
Step 2 – Automatic Notifications
Immediately after submission:
Admin Receives
SMS
New Complaint Received

Complaint ID: CMP1001
Customer: Rahul
Category: Water Supply
WhatsApp
New complaint has been registered.

Complaint ID: CMP1001

Please review it from the Admin Dashboard.

User Receives
SMS
Your complaint has been successfully registered.

Complaint ID: CMP1001

We will update you once it is reviewed.
WhatsApp
Hello Rahul 👋

Your complaint has been received successfully.

Complaint ID: CMP1001

Current Status:
Pending

Thank you.

Step 3 – Admin Reviews Complaint
The Admin Dashboard displays all complaints.
Example:
Complaint ID
Customer
Category
Status
Action
CMP1001
Rahul
Water Supply
Pending
View

The admin opens the complaint and can:
Read complete details
View uploaded images
Contact customer if needed
Add remarks
Change status to In Progress

Step 4 – Complaint Resolution
After resolving the issue, the admin enters a resolution message.
Example:
Resolution:

Water pipeline repaired successfully.

Water supply restored.
The admin then clicks:
Mark as Completed
The complaint status changes to Completed.

Step 5 – Final Notifications
Once the complaint is completed, the system automatically sends:
SMS
Complaint ID: CMP1001

Dear Rahul,

Your complaint has been resolved successfully.

Resolution:
Water pipeline repaired successfully.

Thank you.

WhatsApp
Hello Rahul 👋

Your complaint (CMP1001) has been resolved.

Resolution:
Water pipeline repaired successfully.

Thank you for using our Complaint Management System.

Complaint Status Flow
User Raises Complaint
        │
        ▼
Pending
        │
        ▼
Admin Reviews
        │
        ▼
In Progress
        │
        ▼
Completed
        │
        ├── SMS to User
        └── WhatsApp to User

User Dashboard
The customer dashboard includes:
Welcome Screen
Raise Complaint
Complaint History
Track Complaint
Profile
Current Complaint Status
Admin Resolution
Notification History

Admin Dashboard
The administrator dashboard displays:
Statistics Cards
Total Complaints
Today's Complaints
Pending Complaints
In Progress Complaints
Completed Complaints
Analytics
Complaints by Category
Daily Complaint Trends
Monthly Complaint Trends
Status Distribution (Pie Chart)
Complaint Management
View Complaint
Search Complaint
Filter by Date
Filter by Category
Filter by Status
Reply to Complaint
Update Status
Mark as Completed
Export Reports (Excel/PDF)

Database Design
Users
User ID
Name
Mobile Number
Email (Optional)
Role (User/Admin)

Complaints
Complaint ID
User ID
Category
Complaint Title
Description
Image (Optional)
Status
Admin Reply
Resolution Message
Created Date
Updated Date

Notifications
Notification ID
Complaint ID
Recipient
Notification Type (SMS/WhatsApp)
Message
Delivery Status
Sent Time

