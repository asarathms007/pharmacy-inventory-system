/**
 * Pharmacy Inventory System — Database Seed Script
 * 
 * Populates the database with realistic pharmacy data:
 *   - 1 Admin + 1 Pharmacist user
 *   - 12 real pharmaceutical suppliers
 *   - 60+ real medicines across categories
 *   - 20 customers
 *   - ~150 purchases (spread over 6 months)
 *   - ~200 invoices/sales (spread over 6 months)
 *   - Batches with realistic expiry dates
 *   - Audit log entries
 * 
 * Usage:  node seed.js
 *         node seed.js --clear   (clear all data without re-seeding)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Medicine = require('./models/Medicine');
const Batch = require('./models/Batch');
const Purchase = require('./models/Purchase');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const Sale = require('./models/Sale');
const AuditLog = require('./models/AuditLog');

// ─── Helpers ────────────────────────────────────────────────────────────────
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };
const daysFromNow = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };
const monthsAgo = (m) => { const dt = new Date(); dt.setMonth(dt.getMonth() - m); return dt; };

// ─── Real-world Data ────────────────────────────────────────────────────────

const suppliersData = [
  { name: 'Sun Pharmaceutical Industries', contactPerson: 'Rajesh Mehta', email: 'orders@sunpharma.com', phone: '+91-22-4324-4324', address: 'Sun House, Plot No. 201B/1, Western Express Highway', city: 'Mumbai', notes: 'Largest Indian pharma company' },
  { name: 'Cipla Ltd.', contactPerson: 'Priya Sharma', email: 'supply@cipla.com', phone: '+91-22-2482-6000', address: 'Cipla House, Peninsula Business Park', city: 'Mumbai', notes: 'Specialty in respiratory medicines' },
  { name: 'Dr. Reddy\'s Laboratories', contactPerson: 'Venkat Rao', email: 'wholesale@drreddys.com', phone: '+91-40-4900-2900', address: '8-2-337, Road No. 3, Banjara Hills', city: 'Hyderabad', notes: 'Strong generics portfolio' },
  { name: 'Lupin Limited', contactPerson: 'Amit Desai', email: 'orders@lupin.com', phone: '+91-22-6640-2323', address: '3rd Floor, Kalpataru Inspire', city: 'Mumbai', notes: 'Focus on cardiovascular & diabetology' },
  { name: 'Aurobindo Pharma Ltd.', contactPerson: 'Srinivas Reddy', email: 'supply@aurobindo.com', phone: '+91-40-6672-5000', address: 'Plot No. 2, Maitrivihar, Ameerpet', city: 'Hyderabad', notes: 'Major API manufacturer' },
  { name: 'Zydus Lifesciences', contactPerson: 'Ketan Patel', email: 'orders@zydus.com', phone: '+91-79-2686-8100', address: 'Zydus Corporate Park, Scheme No. 63', city: 'Ahmedabad', notes: 'Diversified healthcare company' },
  { name: 'Torrent Pharmaceuticals', contactPerson: 'Dhruv Shah', email: 'sales@torrentpharma.com', phone: '+91-79-2644-5717', address: 'Off Ashram Road, Ahmedabad', city: 'Ahmedabad', notes: 'Strong CNS & cardio portfolio' },
  { name: 'Glenmark Pharmaceuticals', contactPerson: 'Neha Kulkarni', email: 'orders@glenmark.com', phone: '+91-22-4018-9999', address: 'Glenmark House, B.D. Sawant Marg, Chakala', city: 'Mumbai', notes: 'Dermatology specialist' },
  { name: 'Alkem Laboratories', contactPerson: 'Suresh Kumar', email: 'supply@alkem.com', phone: '+91-22-3982-5000', address: 'Alkem House, Devashish, Senapati Bapat Marg', city: 'Mumbai', notes: 'Anti-infective leader' },
  { name: 'Mankind Pharma', contactPerson: 'Ramesh Juneja', email: 'orders@mankindpharma.com', phone: '+91-11-4156-5656', address: '208, Okhla Industrial Estate, Phase III', city: 'New Delhi', notes: 'Mass market pharma' },
  { name: 'Abbott India Ltd.', contactPerson: 'Sanjay Gupta', email: 'supply@abbott.in', phone: '+91-22-6797-8888', address: '3-4 Corporate Park, Sion-Trombay Road', city: 'Mumbai', notes: 'Nutritional & pharma products' },
  { name: 'GlaxoSmithKline Pharma', contactPerson: 'Anita Verma', email: 'orders@gsk.in', phone: '+91-22-2495-9595', address: 'Dr. Annie Besant Road, Worli', city: 'Mumbai', notes: 'Vaccines & respiratory' },
];

const medicinesData = [
  // Analgesics & Antipyretics
  { name: 'Paracetamol 500mg', genericName: 'Paracetamol', category: 'Analgesics', manufacturer: 'Cipla', price: 2.50, reorderLevel: 100, unit: 'strip', description: 'Fever and mild pain relief' },
  { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Analgesics', manufacturer: 'Sun Pharma', price: 4.20, reorderLevel: 80, unit: 'strip', description: 'NSAID for pain and inflammation' },
  { name: 'Diclofenac Sodium 50mg', genericName: 'Diclofenac', category: 'Analgesics', manufacturer: 'Lupin', price: 5.00, reorderLevel: 60, unit: 'strip', description: 'Anti-inflammatory pain relief' },
  { name: 'Aspirin 75mg', genericName: 'Aspirin', category: 'Analgesics', manufacturer: 'Mankind', price: 3.00, reorderLevel: 50, unit: 'strip', description: 'Blood thinner and mild analgesic' },
  { name: 'Tramadol 50mg', genericName: 'Tramadol', category: 'Analgesics', manufacturer: 'Alkem', price: 8.50, reorderLevel: 30, unit: 'strip', description: 'Moderate-severe pain relief' },

  // Antibiotics
  { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotics', manufacturer: 'Cipla', price: 8.00, reorderLevel: 80, unit: 'strip', description: 'Broad-spectrum penicillin antibiotic' },
  { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotics', manufacturer: 'Alkem', price: 12.00, reorderLevel: 60, unit: 'strip', description: 'Macrolide antibiotic for infections' },
  { name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin', category: 'Antibiotics', manufacturer: 'Dr. Reddy\'s', price: 6.50, reorderLevel: 50, unit: 'strip', description: 'Fluoroquinolone antibiotic' },
  { name: 'Cephalexin 500mg', genericName: 'Cephalexin', category: 'Antibiotics', manufacturer: 'Lupin', price: 10.00, reorderLevel: 40, unit: 'strip', description: 'First-generation cephalosporin' },
  { name: 'Metronidazole 400mg', genericName: 'Metronidazole', category: 'Antibiotics', manufacturer: 'Abbott India', price: 5.50, reorderLevel: 60, unit: 'strip', description: 'Antibiotic and antiprotozoal' },
  { name: 'Doxycycline 100mg', genericName: 'Doxycycline', category: 'Antibiotics', manufacturer: 'Mankind', price: 7.00, reorderLevel: 40, unit: 'strip', description: 'Tetracycline antibiotic' },
  { name: 'Levofloxacin 500mg', genericName: 'Levofloxacin', category: 'Antibiotics', manufacturer: 'Glenmark', price: 11.00, reorderLevel: 50, unit: 'strip', description: 'Fluoroquinolone for respiratory infections' },

  // Cardiovascular
  { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiovascular', manufacturer: 'Torrent', price: 3.80, reorderLevel: 80, unit: 'strip', description: 'Calcium channel blocker for hypertension' },
  { name: 'Atenolol 50mg', genericName: 'Atenolol', category: 'Cardiovascular', manufacturer: 'Zydus', price: 2.90, reorderLevel: 70, unit: 'strip', description: 'Beta-blocker for blood pressure' },
  { name: 'Losartan 50mg', genericName: 'Losartan', category: 'Cardiovascular', manufacturer: 'Lupin', price: 5.50, reorderLevel: 60, unit: 'strip', description: 'ARB for hypertension' },
  { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'Cardiovascular', manufacturer: 'Sun Pharma', price: 6.00, reorderLevel: 80, unit: 'strip', description: 'Statin for cholesterol management' },
  { name: 'Telmisartan 40mg', genericName: 'Telmisartan', category: 'Cardiovascular', manufacturer: 'Glenmark', price: 4.80, reorderLevel: 60, unit: 'strip', description: 'Angiotensin receptor blocker' },
  { name: 'Clopidogrel 75mg', genericName: 'Clopidogrel', category: 'Cardiovascular', manufacturer: 'Torrent', price: 7.50, reorderLevel: 50, unit: 'strip', description: 'Antiplatelet medication' },

  // Diabetology
  { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Diabetology', manufacturer: 'Sun Pharma', price: 2.50, reorderLevel: 100, unit: 'strip', description: 'First-line diabetes medication' },
  { name: 'Glimepiride 1mg', genericName: 'Glimepiride', category: 'Diabetology', manufacturer: 'Lupin', price: 4.00, reorderLevel: 60, unit: 'strip', description: 'Sulfonylurea for type 2 diabetes' },
  { name: 'Sitagliptin 100mg', genericName: 'Sitagliptin', category: 'Diabetology', manufacturer: 'Zydus', price: 18.00, reorderLevel: 40, unit: 'strip', description: 'DPP-4 inhibitor for diabetes' },
  { name: 'Insulin Glargine 100IU/mL', genericName: 'Insulin Glargine', category: 'Diabetology', manufacturer: 'Abbott India', price: 450.00, reorderLevel: 15, unit: 'vial', description: 'Long-acting insulin analog' },
  { name: 'Voglibose 0.3mg', genericName: 'Voglibose', category: 'Diabetology', manufacturer: 'Mankind', price: 6.50, reorderLevel: 40, unit: 'strip', description: 'Alpha-glucosidase inhibitor' },

  // Gastrointestinal
  { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', category: 'Gastrointestinal', manufacturer: 'Alkem', price: 5.00, reorderLevel: 80, unit: 'strip', description: 'Proton pump inhibitor for acid reflux' },
  { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Gastrointestinal', manufacturer: 'Dr. Reddy\'s', price: 4.00, reorderLevel: 70, unit: 'strip', description: 'PPI for GERD and ulcers' },
  { name: 'Domperidone 10mg', genericName: 'Domperidone', category: 'Gastrointestinal', manufacturer: 'Torrent', price: 3.00, reorderLevel: 60, unit: 'strip', description: 'Antiemetic and prokinetic' },
  { name: 'Ranitidine 150mg', genericName: 'Ranitidine', category: 'Gastrointestinal', manufacturer: 'GSK', price: 3.50, reorderLevel: 60, unit: 'strip', description: 'H2 blocker for acidity' },
  { name: 'Ondansetron 4mg', genericName: 'Ondansetron', category: 'Gastrointestinal', manufacturer: 'Cipla', price: 6.00, reorderLevel: 40, unit: 'strip', description: 'Anti-nausea medication' },
  { name: 'Sucralfate 1g', genericName: 'Sucralfate', category: 'Gastrointestinal', manufacturer: 'Abbott India', price: 5.50, reorderLevel: 30, unit: 'bottle', description: 'Mucosal protectant for ulcers' },

  // Respiratory
  { name: 'Salbutamol Inhaler 100mcg', genericName: 'Salbutamol', category: 'Respiratory', manufacturer: 'Cipla', price: 120.00, reorderLevel: 20, unit: 'pcs', description: 'Bronchodilator for asthma relief' },
  { name: 'Montelukast 10mg', genericName: 'Montelukast', category: 'Respiratory', manufacturer: 'Sun Pharma', price: 8.00, reorderLevel: 50, unit: 'strip', description: 'Leukotriene receptor antagonist' },
  { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Respiratory', manufacturer: 'Mankind', price: 2.00, reorderLevel: 80, unit: 'strip', description: 'Antihistamine for allergies' },
  { name: 'Levocetrizine 5mg', genericName: 'Levocetirizine', category: 'Respiratory', manufacturer: 'Glenmark', price: 3.50, reorderLevel: 70, unit: 'strip', description: 'Second-gen antihistamine' },
  { name: 'Budesonide Inhaler 200mcg', genericName: 'Budesonide', category: 'Respiratory', manufacturer: 'Cipla', price: 250.00, reorderLevel: 15, unit: 'pcs', description: 'Inhaled corticosteroid for asthma' },
  { name: 'Ambroxol 30mg', genericName: 'Ambroxol', category: 'Respiratory', manufacturer: 'Alkem', price: 4.00, reorderLevel: 60, unit: 'strip', description: 'Mucolytic for cough and congestion' },

  // Dermatology
  { name: 'Fluconazole 150mg', genericName: 'Fluconazole', category: 'Dermatology', manufacturer: 'Glenmark', price: 15.00, reorderLevel: 30, unit: 'strip', description: 'Antifungal for skin infections' },
  { name: 'Clotrimazole Cream 1%', genericName: 'Clotrimazole', category: 'Dermatology', manufacturer: 'Glenmark', price: 45.00, reorderLevel: 25, unit: 'tube', description: 'Topical antifungal cream' },
  { name: 'Betamethasone Cream 0.1%', genericName: 'Betamethasone', category: 'Dermatology', manufacturer: 'GSK', price: 35.00, reorderLevel: 20, unit: 'tube', description: 'Topical corticosteroid' },
  { name: 'Mupirocin Ointment 2%', genericName: 'Mupirocin', category: 'Dermatology', manufacturer: 'Dr. Reddy\'s', price: 65.00, reorderLevel: 20, unit: 'tube', description: 'Topical antibiotic for skin infections' },
  { name: 'Calamine Lotion', genericName: 'Calamine', category: 'Dermatology', manufacturer: 'Mankind', price: 55.00, reorderLevel: 25, unit: 'bottle', description: 'Soothing lotion for rashes and itching' },

  // Vitamins & Supplements
  { name: 'Vitamin D3 60000IU', genericName: 'Cholecalciferol', category: 'Vitamins & Supplements', manufacturer: 'Abbott India', price: 30.00, reorderLevel: 50, unit: 'strip', description: 'Weekly vitamin D supplement' },
  { name: 'Calcium + Vitamin D3', genericName: 'Calcium Carbonate + D3', category: 'Vitamins & Supplements', manufacturer: 'Abbott India', price: 12.00, reorderLevel: 60, unit: 'strip', description: 'Bone health supplement' },
  { name: 'B-Complex Forte', genericName: 'Vitamin B Complex', category: 'Vitamins & Supplements', manufacturer: 'Abbott India', price: 8.00, reorderLevel: 50, unit: 'strip', description: 'Complete B vitamin supplementation' },
  { name: 'Iron + Folic Acid', genericName: 'Ferrous Fumarate + Folic Acid', category: 'Vitamins & Supplements', manufacturer: 'Mankind', price: 5.50, reorderLevel: 40, unit: 'strip', description: 'Iron supplement for anemia' },
  { name: 'Omega-3 Fish Oil 1000mg', genericName: 'Omega-3 Fatty Acids', category: 'Vitamins & Supplements', manufacturer: 'Sun Pharma', price: 15.00, reorderLevel: 30, unit: 'bottle', description: 'Heart and brain health supplement' },
  { name: 'Zinc Acetate 20mg', genericName: 'Zinc', category: 'Vitamins & Supplements', manufacturer: 'Cipla', price: 3.00, reorderLevel: 50, unit: 'strip', description: 'Immune support supplement' },

  // CNS / Neurological
  { name: 'Alprazolam 0.25mg', genericName: 'Alprazolam', category: 'CNS', manufacturer: 'Torrent', price: 4.00, reorderLevel: 20, unit: 'strip', description: 'Anxiolytic benzodiazepine' },
  { name: 'Escitalopram 10mg', genericName: 'Escitalopram', category: 'CNS', manufacturer: 'Torrent', price: 7.00, reorderLevel: 30, unit: 'strip', description: 'SSRI antidepressant' },
  { name: 'Gabapentin 300mg', genericName: 'Gabapentin', category: 'CNS', manufacturer: 'Zydus', price: 9.00, reorderLevel: 30, unit: 'strip', description: 'Anticonvulsant and neuropathic pain' },
  { name: 'Pregabalin 75mg', genericName: 'Pregabalin', category: 'CNS', manufacturer: 'Sun Pharma', price: 10.00, reorderLevel: 30, unit: 'strip', description: 'Neuropathic pain and seizures' },

  // Hormones & Endocrine
  { name: 'Levothyroxine 50mcg', genericName: 'Levothyroxine', category: 'Hormones', manufacturer: 'Abbott India', price: 3.50, reorderLevel: 60, unit: 'strip', description: 'Thyroid hormone replacement' },
  { name: 'Prednisolone 10mg', genericName: 'Prednisolone', category: 'Hormones', manufacturer: 'Cipla', price: 5.00, reorderLevel: 40, unit: 'strip', description: 'Corticosteroid anti-inflammatory' },

  // Urological
  { name: 'Tamsulosin 0.4mg', genericName: 'Tamsulosin', category: 'Urological', manufacturer: 'Aurobindo', price: 6.00, reorderLevel: 30, unit: 'strip', description: 'Alpha-blocker for BPH' },
  { name: 'Sildenafil 50mg', genericName: 'Sildenafil', category: 'Urological', manufacturer: 'Mankind', price: 25.00, reorderLevel: 20, unit: 'strip', description: 'PDE5 inhibitor' },

  // Ophthalmology
  { name: 'Ciprofloxacin Eye Drops 0.3%', genericName: 'Ciprofloxacin', category: 'Ophthalmology', manufacturer: 'Cipla', price: 40.00, reorderLevel: 20, unit: 'bottle', description: 'Antibiotic eye drops' },
  { name: 'Artificial Tears (CMC 0.5%)', genericName: 'Carboxymethylcellulose', category: 'Ophthalmology', manufacturer: 'Alkem', price: 80.00, reorderLevel: 25, unit: 'bottle', description: 'Lubricating eye drops' },

  // First Aid & OTC
  { name: 'ORS Powder (WHO Formula)', genericName: 'Oral Rehydration Salts', category: 'OTC', manufacturer: 'Mankind', price: 12.00, reorderLevel: 80, unit: 'sachet', description: 'Rehydration for diarrhea' },
  { name: 'Povidone Iodine Solution 5%', genericName: 'Povidone Iodine', category: 'OTC', manufacturer: 'Mankind', price: 50.00, reorderLevel: 30, unit: 'bottle', description: 'Antiseptic wound cleanser' },
  { name: 'Cough Syrup (Dextromethorphan)', genericName: 'Dextromethorphan', category: 'OTC', manufacturer: 'Cipla', price: 75.00, reorderLevel: 30, unit: 'bottle', description: 'Non-drowsy cough suppressant' },
];

const customersData = [
  { name: 'Arjun Patel', mobile: '9876543210', email: 'arjun.patel@gmail.com', address: '12, MG Road, Ahmedabad' },
  { name: 'Priya Sharma', mobile: '9876543211', email: 'priya.s@yahoo.com', address: '45, Residency Road, Bangalore' },
  { name: 'Vikram Singh', mobile: '9876543212', email: 'vikram.s@outlook.com', address: '78, Civil Lines, Jaipur' },
  { name: 'Lakshmi Iyer', mobile: '9876543213', email: 'lakshmi.iyer@gmail.com', address: '23, T Nagar, Chennai' },
  { name: 'Mohammed Ashraf', mobile: '9876543214', email: 'ashraf.m@hotmail.com', address: '56, Banjara Hills, Hyderabad' },
  { name: 'Sneha Desai', mobile: '9876543215', email: 'sneha.d@gmail.com', address: '89, Koregaon Park, Pune' },
  { name: 'Rajesh Kumar', mobile: '9876543216', email: 'rajesh.k@yahoo.in', address: '34, Lajpat Nagar, New Delhi' },
  { name: 'Ananya Bhattacharya', mobile: '9876543217', email: 'ananya.b@gmail.com', address: '67, Salt Lake, Kolkata' },
  { name: 'Deepak Nair', mobile: '9876543218', email: 'deepak.n@outlook.com', address: '90, MG Road, Kochi' },
  { name: 'Kavitha Reddy', mobile: '9876543219', email: 'kavitha.r@gmail.com', address: '11, Jubilee Hills, Hyderabad' },
  { name: 'Suresh Menon', mobile: '9876543220', email: 'suresh.m@yahoo.com', address: '44, Indiranagar, Bangalore' },
  { name: 'Meena Gupta', mobile: '9876543221', email: 'meena.g@gmail.com', address: '77, Gomti Nagar, Lucknow' },
  { name: 'Farhan Khan', mobile: '9876543222', email: 'farhan.k@hotmail.com', address: '22, Bandra West, Mumbai' },
  { name: 'Revathi Sundar', mobile: '9876543223', email: 'revathi.s@gmail.com', address: '55, Anna Nagar, Chennai' },
  { name: 'Nitin Joshi', mobile: '9876543224', email: 'nitin.j@outlook.com', address: '88, Aundh, Pune' },
  { name: 'Shweta Tiwari', mobile: '9876543225', email: 'shweta.t@gmail.com', address: '33, Vaishali Nagar, Jaipur' },
  { name: 'Amit Verma', mobile: '9876543226', email: 'amit.v@yahoo.com', address: '66, Sector 15, Noida' },
  { name: 'Pooja Krishnan', mobile: '9876543227', email: 'pooja.k@gmail.com', address: '99, Mylapore, Chennai' },
  { name: 'Harish Babu', mobile: '9876543228', email: 'harish.b@outlook.com', address: '21, Basavanagudi, Bangalore' },
  { name: 'Divya Pillai', mobile: '9876543229', email: 'divya.p@gmail.com', address: '54, Vyttila, Kochi' },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Supplier.deleteMany({}),
      Medicine.deleteMany({}),
      Batch.deleteMany({}),
      Purchase.deleteMany({}),
      Customer.deleteMany({}),
      Invoice.deleteMany({}),
      Sale.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    if (process.argv.includes('--clear')) {
      console.log('✅ Database cleared. Exiting.');
      process.exit(0);
    }

    // ── 1. Users ──────────────────────────────────────────────────────────
    console.log('👤 Creating users...');
    const adminUser = await User.create({
      name: 'Dr. Sanjay Kapoor',
      email: 'admin@pharmacy.com',
      password: 'admin123',
      role: 'admin',
    });
    const pharmacistUser = await User.create({
      name: 'Ravi Shankar',
      email: 'pharmacist@pharmacy.com',
      password: 'pharm123',
      role: 'pharmacist',
    });
    console.log(`   ✓ Admin: admin@pharmacy.com / admin123`);
    console.log(`   ✓ Pharmacist: pharmacist@pharmacy.com / pharm123`);

    // ── 2. Suppliers ──────────────────────────────────────────────────────
    console.log('🏭 Creating suppliers...');
    const suppliers = await Supplier.insertMany(suppliersData);
    console.log(`   ✓ ${suppliers.length} suppliers created`);

    // ── 3. Medicines ──────────────────────────────────────────────────────
    console.log('💊 Creating medicines...');
    const medicines = await Medicine.insertMany(
      medicinesData.map(m => ({ ...m, totalStock: 0 }))
    );
    console.log(`   ✓ ${medicines.length} medicines created`);

    // ── 4. Customers ──────────────────────────────────────────────────────
    console.log('👥 Creating customers...');
    const customers = await Customer.insertMany(customersData);
    console.log(`   ✓ ${customers.length} customers created`);

    // ── 5. Purchases & Batches ────────────────────────────────────────────
    console.log('📦 Creating purchases and batches...');
    let purchaseCount = 0;
    let batchCount = 0;

    // Spread purchases over 6 months — each medicine gets 2–4 purchase entries
    for (const med of medicines) {
      const numPurchases = randomInt(2, 4);
      for (let i = 0; i < numPurchases; i++) {
        const supplier = pick(suppliers);
        const purchaseDaysAgo = randomInt(1, 180);
        const purchaseDate = daysAgo(purchaseDaysAgo);
        const mfgDate = daysAgo(purchaseDaysAgo + randomInt(30, 180));
        const expiryDate = daysFromNow(randomInt(60, 730));
        const quantity = randomInt(20, 500);
        const unitCost = +(med.price * randomFloat(0.4, 0.7)).toFixed(2);
        const sellingPrice = med.price;
        const batchNumber = `B${String(purchaseCount + 1).padStart(4, '0')}`;

        const purchase = await Purchase.create({
          medicine: med._id,
          supplier: supplier._id,
          batchNumber,
          mfgDate,
          expiryDate,
          quantity,
          unitCost,
          sellingPrice,
          invoiceNumber: `PO-${Date.now()}-${purchaseCount}`,
          purchaseDate,
          notes: '',
          addedBy: pick([adminUser._id, pharmacistUser._id]),
        });

        // Create or update batch
        let batch = await Batch.findOne({ batchNumber, medicine: med._id });
        if (batch) {
          batch.quantity += quantity;
          await batch.save();
        } else {
          batch = await Batch.create({
            batchNumber,
            medicine: med._id,
            mfgDate,
            expiryDate,
            purchasePrice: unitCost,
            sellingPrice,
            quantity,
          });
          batchCount++;
        }

        // Update medicine stock
        await Medicine.findByIdAndUpdate(med._id, { $inc: { totalStock: quantity } });

        purchaseCount++;
      }
    }
    console.log(`   ✓ ${purchaseCount} purchases created`);
    console.log(`   ✓ ${batchCount} batches created`);

    // Add some nearly-expired batches for dashboard alerts
    console.log('⚠️  Adding nearly-expired batches for alerts...');
    const nearExpiryMeds = medicines.slice(0, 8);
    for (const med of nearExpiryMeds) {
      const batchNum = `BEXP${String(batchCount + 1).padStart(4, '0')}`;
      await Batch.create({
        batchNumber: batchNum,
        medicine: med._id,
        mfgDate: monthsAgo(18),
        expiryDate: daysFromNow(randomInt(5, 25)), // expiring in 5–25 days
        purchasePrice: +(med.price * 0.5).toFixed(2),
        sellingPrice: med.price,
        quantity: randomInt(5, 30),
      });
      batchCount++;
    }
    console.log(`   ✓ ${nearExpiryMeds.length} near-expiry batches added`);

    // ── 6. Invoices (Sales) ──────────────────────────────────────────────
    console.log('🧾 Creating invoices and sales...');
    let invoiceCount = 0;
    const allBatches = await Batch.find({ quantity: { $gt: 0 } }).populate('medicine');

    // Generate ~200 invoices spread over 6 months
    const totalInvoices = 200;
    for (let i = 0; i < totalInvoices; i++) {
      const saleDaysAgo = randomInt(0, 180);
      const saleDate = daysAgo(saleDaysAgo);
      const customer = pick(customers);
      const soldBy = pick([adminUser._id, pharmacistUser._id]);

      // Each invoice has 1–4 items
      const numItems = randomInt(1, 4);
      const invoiceItems = [];
      let subTotal = 0;

      // Pick random medicines with available batches
      const usedMedIds = new Set();
      for (let j = 0; j < numItems; j++) {
        // Find available batches
        const availableBatches = await Batch.find({ quantity: { $gt: 3 } });
        if (availableBatches.length === 0) break;

        const batch = pick(availableBatches);
        if (usedMedIds.has(batch.medicine.toString())) continue;
        usedMedIds.add(batch.medicine.toString());

        const maxQty = Math.min(batch.quantity, 10);
        const qty = randomInt(1, maxQty);
        const lineTotal = +(qty * batch.sellingPrice).toFixed(2);
        subTotal += lineTotal;

        invoiceItems.push({
          medicine: batch.medicine,
          batch: batch._id,
          quantity: qty,
          unitPrice: batch.sellingPrice,
          total: lineTotal,
        });

        // Deduct from batch
        batch.quantity -= qty;
        await batch.save();

        // Deduct from medicine stock
        await Medicine.findByIdAndUpdate(batch.medicine, {
          $inc: { totalStock: -qty },
        });
      }

      if (invoiceItems.length === 0) continue;

      const gst = +(subTotal * 0.12).toFixed(2);
      const discount = randomInt(0, 3) === 0 ? randomFloat(5, 50) : 0; // 33% chance of discount
      const grandTotal = +(subTotal + gst - discount).toFixed(2);
      const invoiceNumber = `INV-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(invoiceCount + 1).padStart(4, '0')}`;

      await Invoice.create({
        invoiceNumber,
        customer: customer._id,
        customerName: customer.name,
        customerPhone: customer.mobile,
        items: invoiceItems,
        subTotal,
        gst,
        discount,
        grandTotal,
        saleDate,
        soldBy,
      });

      // Update customer total purchases
      await Customer.findByIdAndUpdate(customer._id, {
        $inc: { totalPurchases: grandTotal },
      });

      invoiceCount++;
    }
    console.log(`   ✓ ${invoiceCount} invoices created`);

    // ── 7. Make some medicines low-stock for dashboard alerts ─────────────
    console.log('📉 Setting some medicines to low stock...');
    const lowStockMeds = medicines.slice(10, 18);
    for (const med of lowStockMeds) {
      const currentMed = await Medicine.findById(med._id);
      if (currentMed.totalStock > currentMed.reorderLevel) {
        await Medicine.findByIdAndUpdate(med._id, {
          totalStock: randomInt(2, Math.min(currentMed.reorderLevel, 10)),
        });
      }
    }
    console.log(`   ✓ ${lowStockMeds.length} medicines set to low stock`);

    // ── 8. Audit Logs ────────────────────────────────────────────────────
    console.log('📋 Creating audit log entries...');
    const auditEntries = [
      { user: adminUser._id, action: 'Login', module: 'Auth', description: 'Admin logged in' },
      { user: pharmacistUser._id, action: 'Login', module: 'Auth', description: 'Pharmacist logged in' },
      { user: adminUser._id, action: 'Create', module: 'Medicine', description: 'Bulk imported 60+ medicines' },
      { user: adminUser._id, action: 'Create', module: 'Supplier', description: 'Added 12 pharmaceutical suppliers' },
      { user: pharmacistUser._id, action: 'Purchase', module: 'Purchase', description: `Processed ${purchaseCount} purchase orders` },
      { user: pharmacistUser._id, action: 'Sale', module: 'Invoice', description: `Generated ${invoiceCount} invoices` },
      { user: adminUser._id, action: 'Create', module: 'Customer', description: 'Registered 20 customers' },
    ];
    await AuditLog.insertMany(auditEntries);
    console.log(`   ✓ ${auditEntries.length} audit entries created`);

    // ── Summary ──────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  🎉 Database seeded successfully!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  👤 Users:       2 (admin + pharmacist)`);
    console.log(`  🏭 Suppliers:   ${suppliers.length}`);
    console.log(`  💊 Medicines:   ${medicines.length}`);
    console.log(`  👥 Customers:   ${customers.length}`);
    console.log(`  📦 Purchases:   ${purchaseCount}`);
    console.log(`  🧪 Batches:     ${batchCount}`);
    console.log(`  🧾 Invoices:    ${invoiceCount}`);
    console.log(`  📋 Audit Logs:  ${auditEntries.length}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n  Login credentials:');
    console.log('  📧 Admin:      admin@pharmacy.com / admin123');
    console.log('  📧 Pharmacist: pharmacist@pharmacy.com / pharm123');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

seed();
