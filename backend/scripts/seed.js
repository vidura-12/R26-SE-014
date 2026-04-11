require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Farmer = require('../src/models/Farmer');
const PeelerGroup = require('../src/models/PeelerGroup');
const HarvestRequest = require('../src/models/HarvestRequest');
const Schedule = require('../src/models/Schedule');
const Notification = require('../src/models/Notification');

const { USER_ROLES, PROCESSING_CATEGORIES, HARVEST_STATUSES } = require('../src/constants/enums');

const PW = bcrypt.hashSync('Welcome@123', 10);

const daysOut = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

function nextWeekAvailability() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return { date: d, available: d.getDay() !== 0, startTime: '07:30', endTime: '16:30' };
  });
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ── Sri Lankan districts (cinnamon belt) ──────────────────────────────────
const LOCATIONS = [
  { district: 'Matara',       lat: 6.0535, lng: 80.2210, address: 'Akuressa, Matara' },
  { district: 'Matara',       lat: 6.3522, lng: 80.3817, address: 'Deniyaya, Matara' },
  { district: 'Matara',       lat: 6.1245, lng: 80.5434, address: 'Weligama, Matara' },
  { district: 'Matara',       lat: 5.9549, lng: 80.5550, address: 'Matara Town' },
  { district: 'Galle',        lat: 6.0535, lng: 80.2210, address: 'Baddegama, Galle' },
  { district: 'Galle',        lat: 6.1000, lng: 80.1700, address: 'Hiniduma, Galle' },
  { district: 'Galle',        lat: 6.0367, lng: 80.2170, address: 'Neluwa, Galle' },
  { district: 'Galle',        lat: 6.0480, lng: 80.2190, address: 'Thawalama, Galle' },
  { district: 'Kalutara',     lat: 6.5854, lng: 80.0000, address: 'Agalawatta, Kalutara' },
  { district: 'Kalutara',     lat: 6.6200, lng: 80.0500, address: 'Palindanuwara, Kalutara' },
  { district: 'Ratnapura',    lat: 6.6828, lng: 80.3992, address: 'Eheliyagoda, Ratnapura' },
  { district: 'Ratnapura',    lat: 6.7053, lng: 80.3842, address: 'Awissawella, Ratnapura' },
  { district: 'Hambantota',   lat: 6.1241, lng: 81.1185, address: 'Tangalle, Hambantota' },
  { district: 'Hambantota',   lat: 6.3526, lng: 80.9918, address: 'Ambalantota, Hambantota' },
  { district: 'Colombo',      lat: 6.9271, lng: 79.8612, address: 'Homagama, Colombo' },
];

const FARMER_NAMES = [
  'Sunil Perera', 'Kamal Jayasinghe', 'Nimal Fernando', 'Pradeep Dissanayake',
  'Asela Bandara', 'Chaminda Rathnayake', 'Ruwan Kumara', 'Thilak Wijesinghe',
  'Sanath Gunawardena', 'Mahesh Siriwardena', 'Buddhika Rajapaksha', 'Lasantha Mendis',
  'Thusitha Wickramasinghe', 'Manjula Senanayake', 'Roshan Pathirana', 'Dinesh Alwis',
  'Nuwan Herath', 'Sampath Liyanage', 'Prasanna Amarasinghe', 'Kalani Weerasinghe',
];

const PEELER_NAMES = [
  'Asanka Silva', 'Ranjith Dissanayake', 'Thilak Bandara', 'Hemantha Jayawardena',
  'Saman Priyantha', 'Ajith Kumara', 'Priya Rathnasiri', 'Niluka Madushan',
  'Chamara Wickrama', 'Dilan Perera', 'Kasun Niroshan', 'Supun Madusanka',
  'Harsha Lokuge', 'Amila Gunasekara', 'Lahiru Jayasena', 'Shehan Rodrigo',
  'Upul Thilakarathna', 'Nalin Fonseka', 'Iresh Samaraweera', 'Janaka Munasinghe',
];

const PLANTATION_NAMES = [
  'Plot A', 'Plot B', 'Plot C', 'Upper Block', 'Lower Block',
  'Highland Farm', 'Valley Estate', 'Riverside Plot', 'Forest Edge',
  'North Quarter', 'South Quarter', 'Eastern Slope', 'Western Rise',
  'Main Block', 'Reserve Block',
];

const NICS = [
  '892345678V', '781234567V', '901122334V', '850987654V', '760543219V',
  '911234567V', '830456789V', '950234567V', '870654321V', '920345678V',
  '801122334V', '750987654V', '960543219V', '841234567V', '730456789V',
  '970234567V', '880654321V', '930345678V', '810122334V', '760987654V',
];

async function confirm(question) {
  const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => readline.question(question, (ans) => { readline.close(); resolve(ans.trim().toLowerCase()); }));
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  console.log('\n⚠️  This will DELETE all existing data in the database.');
  const ans = await confirm('Are you sure you want to continue? (y/N): ');
  if (ans !== 'y' && ans !== 'yes') {
    console.log('Seed cancelled.');
    await mongoose.disconnect();
    process.exit(0);
  }

  await Promise.all([
    User.deleteMany({}),
    Farmer.deleteMany({}),
    PeelerGroup.deleteMany({}),
    HarvestRequest.deleteMany({}),
    Schedule.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ── Fixed demo accounts ───────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Admin User', email: 'admin@cinnamonsync.lk',
    password: 'Welcome@123', role: USER_ROLES.ADMIN, phone: '+94 11 234 5678',
  });

  const fixedFarmerUser = await User.create({
    name: 'Farmer User', email: 'farmer@cinnamonsync.lk',
    password: 'Welcome@123', role: USER_ROLES.FARMER, phone: '+94 77 000 0001',
  });

  const fixedPeelerUser = await User.create({
    name: 'Peeler User', email: 'peeler@cinnamonsync.lk',
    password: 'Welcome@123', role: USER_ROLES.PEELER, phone: '+94 77 000 0002',
  });

  // ── 19 extra farmer users ─────────────────────────────────────────────────
  const farmerUsers = await User.insertMany(
    FARMER_NAMES.map((name, i) => ({
      name,
      email: `farmer${i + 1}@cinnamonsync.lk`,
      password: PW,
      role: USER_ROLES.FARMER,
      phone: `+94 77 ${String(100000 + i).slice(1)}`,
    }))
  );

  // ── 19 extra peeler users ─────────────────────────────────────────────────
  const peelerUsers = await User.insertMany(
    PEELER_NAMES.map((name, i) => ({
      name,
      email: `peeler${i + 1}@cinnamonsync.lk`,
      password: PW,
      role: USER_ROLES.PEELER,
      phone: `+94 71 ${String(200000 + i).slice(1)}`,
    }))
  );

  console.log(`Created ${1 + 1 + 1 + farmerUsers.length + peelerUsers.length} users`);

  // ── Farmer profiles (fixed + 19 extra = 20) ───────────────────────────────
  const fixedFarmer = await Farmer.create({
    user: fixedFarmerUser._id,
    fullName: 'Farmer User',
    nic: '999000001V',
    primaryLocation: pick(LOCATIONS),
    notes: 'Demo farmer account.',
  });

  const extraFarmers = await Farmer.insertMany(
    farmerUsers.map((u, i) => ({
      user: u._id,
      fullName: u.name,
      nic: NICS[i],
      primaryLocation: pick(LOCATIONS),
      notes: '',
    }))
  );

  const allFarmers = [fixedFarmer, ...extraFarmers];
  console.log(`Created ${allFarmers.length} farmers`);

  // ── Peeler groups (fixed + 19 extra = 20) ─────────────────────────────────
  const fixedPeeler = await PeelerGroup.create({
    user: fixedPeelerUser._id,
    groupName: 'Peeler User Kalliya',
    leaderName: 'Peeler User',
    currentLocation: pick(LOCATIONS),
    groupSize: rand(5, 10),
    peelingCapacityTreesPerHour: rand(30, 60),
    maxHoursPerDay: rand(7, 10),
    skillLevel: rand(3, 5),
    rating: rand(3, 5),
    availability: nextWeekAvailability(),
  });

  const extraPeelers = await PeelerGroup.insertMany(
    peelerUsers.map((u, i) => {
      const loc = pick(LOCATIONS);
      return {
        user: u._id,
        groupName: `${PEELER_NAMES[i].split(' ')[0]} Kalliya`,
        leaderName: PEELER_NAMES[i],
        currentLocation: loc,
        groupSize: rand(4, 12),
        peelingCapacityTreesPerHour: rand(25, 65),
        maxHoursPerDay: rand(7, 10),
        skillLevel: rand(1, 5),
        rating: rand(2, 5),
        availability: nextWeekAvailability(),
      };
    })
  );

  console.log(`Created ${1 + extraPeelers.length} peeler groups`);

  // ── 30 Harvest Requests ───────────────────────────────────────────────────
  const categories = Object.values(PROCESSING_CATEGORIES);
  const statuses = Object.values(HARVEST_STATUSES);

  const harvestDocs = Array.from({ length: 30 }, (_, i) => {
    const farmer = pick(allFarmers);
    const loc = pick(LOCATIONS);
    const readyOffset = rand(-10, 20);
    const deadlineOffset = readyOffset + rand(5, 15);
    const status = statuses[i % statuses.length];
    const trees = rand(80, 600);
    return {
      farmer: farmer._id,
      plantationName: `${loc.district} ${pick(PLANTATION_NAMES)} ${i + 1}`,
      location: { ...loc, lat: loc.lat + (Math.random() - 0.5) * 0.05, lng: loc.lng + (Math.random() - 0.5) * 0.05 },
      treeCount: trees,
      harvestReadyDate: daysOut(readyOffset),
      deadlineDate: daysOut(deadlineOffset),
      urgencyLevel: rand(1, 5),
      processingCategory: categories[i % categories.length],
      estimatedYieldKg: Math.round(trees * rand(12, 18) / 10),
      status,
      notes: i % 4 === 0 ? 'Please prioritise — premium grade.' : '',
    };
  });

  const harvests = await HarvestRequest.insertMany(harvestDocs);
  console.log(`Created 30 harvest requests`);

  // ── Demo notifications ────────────────────────────────────────────────────
  await Notification.insertMany([
    {
      recipient: fixedFarmerUser._id,
      title: 'Harvest Request Submitted',
      message: 'Your harvest request has been received and is pending review.',
      type: 'HARVEST_CREATED',
      read: false,
    },
    {
      recipient: fixedFarmerUser._id,
      title: 'Schedule Assigned',
      message: 'A peeler group has been assigned to your harvest. Check the schedule for details.',
      type: 'SCHEDULE_ASSIGNED',
      read: false,
    },
    {
      recipient: fixedPeelerUser._id,
      title: 'New Route Assigned',
      message: 'You have been assigned a new route for this week. Please review your schedule.',
      type: 'SCHEDULE_ASSIGNED',
      read: false,
    },
    {
      recipient: fixedFarmerUser._id,
      title: 'Harvest In Progress',
      message: 'Peelers have started work on your plantation.',
      type: 'HARVEST_STATUS',
      read: true,
      meta: { harvestId: harvests[0]._id },
    },
  ]);
  console.log('Created 4 demo notifications');

  console.log('\n✓ Seed complete!\n');
  console.log('Demo login credentials (password: Welcome@123):');
  console.log('  Admin  → admin@cinnamonsync.lk');
  console.log('  Farmer → farmer@cinnamonsync.lk');
  console.log('  Peeler → peeler@cinnamonsync.lk');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
