/**
 * MessMate Seed Script
 * Run: node src/seed.js
 * Seeds sample users, meals, optins, attendance, inventory, and feedback
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Meal = require('./models/Meal');
const Optin = require('./models/Optin');
const Attendance = require('./models/Attendance');
const Inventory = require('./models/Inventory');
const Bill = require('./models/Bill');
const Feedback = require('./models/Feedback');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const MENU = {
  breakfast: [
    { name: 'Poha', isVeg: true },
    { name: 'Boiled Eggs', isVeg: false },
    { name: 'Bread & Butter', isVeg: true },
    { name: 'Chai', isVeg: true },
  ],
  lunch: [
    { name: 'Dal Tadka', isVeg: true },
    { name: 'Jeera Rice', isVeg: true },
    { name: 'Roti', isVeg: true },
    { name: 'Mixed Veg', isVeg: true },
    { name: 'Salad', isVeg: true },
  ],
  dinner: [
    { name: 'Paneer Butter Masala', isVeg: true },
    { name: 'Naan', isVeg: true },
    { name: 'Khichdi', isVeg: true },
    { name: 'Raita', isVeg: true },
  ],
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Meal.deleteMany({}),
    Optin.deleteMany({}),
    Attendance.deleteMany({}),
    Inventory.deleteMany({}),
    Bill.deleteMany({}),
    Feedback.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // --- Users ---
  const adminUser = await User.create({
    name: 'Admin Ravi',
    email: 'admin@messmate.app',
    password: 'Admin@123',
    role: 'admin',
    department: 'Administration',
  });

  const kitchenUser = await User.create({
    name: 'Kitchen Staff Priya',
    email: 'kitchen@messmate.app',
    password: 'Kitchen@123',
    role: 'kitchen',
    department: 'Kitchen',
  });

  const students = [];
  const studentData = [
    { name: 'Arjun Sharma', email: 'arjun@student.edu', room: 'A-101', dept: 'CSE', rfid: 'RFID001' },
    { name: 'Priya Nair', email: 'priya@student.edu', room: 'B-202', dept: 'ECE', rfid: 'RFID002' },
    { name: 'Rohan Mehta', email: 'rohan@student.edu', room: 'C-303', dept: 'ME', rfid: 'RFID003' },
    { name: 'Sneha Patel', email: 'sneha@student.edu', room: 'A-104', dept: 'CSE', rfid: 'RFID004' },
    { name: 'Karan Singh', email: 'karan@student.edu', room: 'D-401', dept: 'EE', rfid: 'RFID005' },
    { name: 'Ananya Roy', email: 'ananya@student.edu', room: 'B-205', dept: 'Civil', rfid: 'RFID006' },
    { name: 'Vikram Joshi', email: 'vikram@student.edu', room: 'C-310', dept: 'IT', rfid: 'RFID007' },
    { name: 'Meera Reddy', email: 'meera@student.edu', room: 'A-110', dept: 'BIO', rfid: 'RFID008' },
    { name: 'Aditya Kumar', email: 'aditya@student.edu', room: 'D-415', dept: 'CSE', rfid: 'RFID009' },
    { name: 'Deepika Nanda', email: 'deepika@student.edu', room: 'B-210', dept: 'ECE', rfid: 'RFID010' },
  ];

  for (const s of studentData) {
    const u = await User.create({
      name: s.name,
      email: s.email,
      password: 'Student@123',
      role: 'student',
      department: s.dept,
      roomNumber: s.room,
      rfidCardId: s.rfid,
      messSubscription: { isSubscribed: true, plan: 'full', startDate: new Date() },
    });
    students.push(u);
  }
  console.log(`👤 Created ${students.length} students + 2 staff`);

  // --- Inventory ---
  const inventoryItems = await Inventory.insertMany([
    { itemName: 'Rice', unit: 'kg', quantityInStock: 200, reorderThreshold: 50, consumptionPerStudent: { breakfast: 0, lunch: 0.15, dinner: 0.1 }, costPerUnit: 40 },
    { itemName: 'Dal (Toor)', unit: 'kg', quantityInStock: 80, reorderThreshold: 20, consumptionPerStudent: { breakfast: 0, lunch: 0.08, dinner: 0.06 }, costPerUnit: 90 },
    { itemName: 'Wheat Flour', unit: 'kg', quantityInStock: 120, reorderThreshold: 30, consumptionPerStudent: { breakfast: 0.05, lunch: 0.12, dinner: 0.1 }, costPerUnit: 35 },
    { itemName: 'Milk', unit: 'litre', quantityInStock: 100, reorderThreshold: 20, consumptionPerStudent: { breakfast: 0.25, lunch: 0, dinner: 0 }, costPerUnit: 55 },
    { itemName: 'Vegetables (Mixed)', unit: 'kg', quantityInStock: 60, reorderThreshold: 15, consumptionPerStudent: { breakfast: 0.05, lunch: 0.1, dinner: 0.1 }, costPerUnit: 30 },
    { itemName: 'Paneer', unit: 'kg', quantityInStock: 15, reorderThreshold: 5, consumptionPerStudent: { breakfast: 0, lunch: 0, dinner: 0.08 }, costPerUnit: 280 },
    { itemName: 'Oil (Sunflower)', unit: 'litre', quantityInStock: 40, reorderThreshold: 10, consumptionPerStudent: { breakfast: 0.01, lunch: 0.02, dinner: 0.015 }, costPerUnit: 120 },
    { itemName: 'Sugar', unit: 'kg', quantityInStock: 30, reorderThreshold: 8, consumptionPerStudent: { breakfast: 0.02, lunch: 0, dinner: 0 }, costPerUnit: 45 },
    { itemName: 'Tea (CTC)', unit: 'kg', quantityInStock: 8, reorderThreshold: 2, consumptionPerStudent: { breakfast: 0.005, lunch: 0, dinner: 0 }, costPerUnit: 350 },
    { itemName: 'Eggs', unit: 'dozen', quantityInStock: 20, reorderThreshold: 5, consumptionPerStudent: { breakfast: 0.17, lunch: 0, dinner: 0 }, costPerUnit: 70 },
  ]);
  console.log(`📦 Created ${inventoryItems.length} inventory items`);

  // --- Meals (last 30 days + next 7 days) ---
  const meals = [];
  const now = new Date();
  for (let dayOffset = -29; dayOffset <= 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const mealType of MEAL_TYPES) {
      const cutoff = new Date(date);
      if (mealType === 'breakfast') cutoff.setHours(7, 0, 0, 0);
      else if (mealType === 'lunch') cutoff.setHours(10, 30, 0, 0);
      else cutoff.setHours(17, 0, 0, 0);

      const isSpecial = dayOffset === 3; // Day 3 ahead is flagged as festival
      try {
        const m = await Meal.create({
          date,
          mealType,
          menuItems: MENU[mealType],
          cutoffTime: cutoff,
          pricePerHead: mealType === 'lunch' ? 60 : 40,
          specialDay: isSpecial ? { isSpecial: true, label: 'Founders Day Celebration' } : { isSpecial: false },
        });
        meals.push(m);
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`🍽️  Created ${meals.length} meals`);

  // --- Optins & Attendance (historical, last 29 days) ---
  const pastMeals = meals.filter((m) => m.date < now);
  let optinCount = 0;
  let attendanceCount = 0;

  for (const meal of pastMeals) {
    // ~70-90% of students opt in per meal
    const participatingStudents = students.filter(() => Math.random() > 0.15);

    for (const student of participatingStudents) {
      const optin = await Optin.create({
        student: student._id,
        meal: meal._id,
        status: 'opted-in',
        qrToken: `SEED_TOKEN_${student._id}_${meal._id}`,
        qrTokenUsed: true,
      });
      optinCount++;

      // ~85% actually attend
      if (Math.random() > 0.15) {
        await Attendance.create({
          student: student._id,
          meal: meal._id,
          optin: optin._id,
          scanMethod: Math.random() > 0.5 ? 'qr' : 'rfid',
          tokenOrCardId: Math.random() > 0.5 ? optin.qrToken : student.rfidCardId,
          scannedBy: kitchenUser._id,
          status: 'success',
          scannedAt: new Date(meal.date.getTime() + (meal.mealType === 'breakfast' ? 8 : meal.mealType === 'lunch' ? 13 : 20) * 3600000),
        });
        attendanceCount++;
      }
    }

    // Update actual headcount
    const actual = await Attendance.countDocuments({ meal: meal._id, status: 'success' });
    const forecasted = Math.round(actual * (0.9 + Math.random() * 0.2)); // simulate forecast
    await Meal.findByIdAndUpdate(meal._id, { actualHeadcount: actual, forecastedHeadcount: forecasted });
  }
  console.log(`✅ Created ${optinCount} optins, ${attendanceCount} attendance records`);

  // --- Feedback (for past meals) ---
  const DISHES = Object.values(MENU).flat().map((d) => d.name);
  let feedbackCount = 0;
  for (const meal of pastMeals.slice(-10)) {
    // last 10 days get feedback
    for (const student of students.slice(0, 6)) {
      try {
        await Feedback.create({
          student: student._id,
          meal: meal._id,
          dishRatings: MENU[meal.mealType].map((d) => ({
            dishName: d.name,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
          })),
          overallRating: Math.floor(Math.random() * 2) + 4, // 4-5
          comment: Math.random() > 0.5 ? 'Good meal today!' : '',
        });
        feedbackCount++;
      } catch (e) {
        // skip duplicates
      }
    }
  }
  console.log(`⭐ Created ${feedbackCount} feedback records`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@messmate.app / Admin@123');
  console.log('  Kitchen: kitchen@messmate.app / Kitchen@123');
  console.log('  Student: arjun@student.edu / Student@123 (and others)');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
