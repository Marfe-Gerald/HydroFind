# HydroFind

Project Description

HydroFind is a React Native mobile application designed to connect water refilling stations with their customers through real-time location tracking and route optimization. The application addresses a common problem faced by water refilling businesses: inefficient delivery coordination caused by manually estimating customer locations and delivery routes, which often leads to delayed deliveries, wasted fuel, and poor customer experience.

The application allows customers to place water refill orders and share their location, while allowing the business to view incoming orders, see each customer's location on a map, and manage delivery records. Business owners or riders can track order status from pending to delivered, ensuring smoother coordination between the station and its customers.

Team Members


Name                                Role
Marfe, Gerald M.                    Developer/Backend
Juson, Jann Francis M.              Developer/Frontend



Target Users

Customers (residents ordering water refills)
Water refilling station owners/staff
Delivery riders

Objectives
To develop a mobile application using React Native for water refill ordering and delivery management.
To implement location tracking that captures and displays the customer's address for delivery coordination.
To implement CRUD operations for managing orders, customers, and delivery records using SQLite.
To design a route/map feature that shows the path from the business to the customer's location.
To provide a user-friendly interface for placing orders and tracking delivery status.

Major Features

Add a new water refill order
View all orders
Edit/update order details or status
Delete/cancel an order
Search for orders by customer name or status
View customer location on a map
View shortest route from business to customer
View order/delivery history

Proposed Screens


Screens
Purpose
Home
Displays dashboard with quick order access
Order Form
Allows customer to place a new water refill order
Order List
Displays all orders (pending, on the way, delivered)
Order Details
Displays selected order's full information
Map View
Displays customer location and route from the business
Edit Order
Updates order/delivery status
History
Displays past completed orders





Proposed Transaction

Transaction: Placing and Managing a Water Refill Order

The customer enters order details — name, contact number, address/location (auto-captured via GPS), number of water containers/gallons needed, and preferred delivery time. Once submitted, this information is stored in the database as a new order record with a "Pending" status. The business/rider can then view this order, see the customer's location plotted on a map along with the suggested route, and update the order status as it progresses (Pending → On the Way → Delivered). All order information, including status changes, is saved and can be viewed later in the order history.

Proposed Database 

SQL

CRUD Plan

Operation
 Proposed Function
CREATE
 Add a new water refill order
READ
 View all orders / view order details
UPDATE
 Edit order details or update delivery status
DELETE
 Cancel/remove an order



Technology Stack
Frontend: React Native
Development: Expo
Language: JavaScript
Navigation: React Navigation
Database: SQL
Maps/Location: React Native Maps, Expo Location
Development Tools: VS Code, GitHub, Android Emulator / Physical Android Device

Proposed App Architecture / Flow
- - - - - > PLACE ORDER SCREEN - - - - > ORDER LIST SCREEN                                      
|                                                             - - - - - - >  MAP VIEW SCREEN
|                                                             |
HOME SCREEN - - - - >  ORDER LIST SCREEN  - - - - - > ORDER DETAILS SCREEN
|                                                             |
|                                                             - - - - - - > EDIT ORDER STATUS
- - - - - >  HISTORY SCREEN - - - - > VIEW COMPLETED ORDERS 


UI/UX Concept
Primary Colors: Shades of blue and white (representing water/cleanliness), with a light gray accent for backgrounds
App Logo Concept: A simple water droplet icon combined with a location pin
Typography: Clean, sans-serif font (e.g., Roboto or Poppins) for readability
General Layout: Card-based layout for orders, bottom tab navigation for main sections (Home, Orders, Map, History)
Navigation Style: Bottom tab navigation combined with stack navigation for screen transitions
Expected Output
At the end of the project, the team expects to produce a functional React Native mobile application that allows customers to place water refill orders and allows the business to manage and track deliveries. The application will use SQLite to store order data and will support create, read, update, and delete operations, along with a map feature displaying customer location and delivery route.

Proposed Project Scope
Included:
Order placement and management
Customer location capture and map display
Route/path display from business to customer
CRUD operations
SQLite database
Order status tracking
Multi-screen navigation
Not Included:
Real online payment gateway integration (in-app purchases will be simulated for demo purposes)
Real-time push notifications
User authentication/login system
Web-based administration system




