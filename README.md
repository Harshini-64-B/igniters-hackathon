# igniters-hackathon
# TinkerLab Reservation & Management System

## 🛠️ Project Overview

This project is a web-based TinkerLab Reservation and Inventory Management System developed during a 24-hour hackathon conducted by IIITDM Kancheepuram. The system allows students to reserve lab equipment, while authorizers manage approvals, inventory, and reporting.

## 👤 Roles and Features

### 👨‍🎓 Students
- Register and login
- View available equipment
- Reserve equipment
- View reservation status

### ✅ Authorizers (Tech Sec, Faculty, PhD Scholar, Club Lead)
- Secure login with role-based access
- View and approve/reject equipment reservation requests
- Manage and update inventory
- View reports on equipment usage

## 📁 Project Structure

TinkerLab/
├── equipment.html # Student-facing equipment listing
├── index.html # Landing page
├── login.html # Common login page for all users
├── register.html # Student registration form
├── reservation.html # Student equipment reservation form
├── server.js # Node.js backend server with MySQL integration
├── package.json # Node.js dependencies
└── node_modules/ # Node.js packages (auto-installed) (uploaded it as a zip file)


## ⚙️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JS
- **Backend:** Node.js (Express)
- **Database:** MySQL
- **Session Management:** `express-session`
- **Security:** Password hashing with `bcrypt`

## 🔐 Authentication & Authorization

- Registration supports role selection (`student`, `authorizer`)
- Session-based login ensures only authorized access to pages
- Role-specific dashboards:
  - Students see equipment and reservation forms
  - Authorizers see approval and inventory management pages

## 🛠️ Setup Instructions

### 1. Clone or Extract Project
git clone <repository-url>  # or extract the zip
cd TinkerLab

2. Install Dependencies
npm install

3. Configure MySQL
Create a database named TinkerLab and set up the following tables:

users — stores user credentials and roles

equipment — stores inventory data

reservations — stores student reservations

Update MySQL credentials in server.js:
const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'TinkerLab'
});

4. Start Server
node server.js

5. Access App
Visit: http://localhost:3000

 Future Enhancements:
Dashboard UI for authorizers
Equipment return tracking
Fine calculation for overdue items
Email notifications

 Developed By:
B.Harshini, Solo participant @ IIITDM Kancheepuram 24-Hour Hackathon (2025)

