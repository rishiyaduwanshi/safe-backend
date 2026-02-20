import { faker } from '@faker-js/faker';
import dayjs from 'dayjs';

// ─── State Code → State Info Map ────────────────────────────────────────────

const STATE_MAP: Record<string, { state: string; cities: string[] }> = {
    DL: { state: 'Delhi', cities: ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Laxmi Nagar'] },
    HR: { state: 'Haryana', cities: ['Gurugram', 'Faridabad', 'Panipat', 'Hisar', 'Karnal'] },
    PB: { state: 'Punjab', cities: ['Ludhiana', 'Amritsar', 'Phagwara', 'Jalandhar', 'Patiala'] },
    MH: { state: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'] },
    UP: { state: 'Uttar Pradesh', cities: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida'] },
    RJ: { state: 'Rajasthan', cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner'] },
    GJ: { state: 'Gujarat', cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'] },
    KA: { state: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'] },
    TN: { state: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'] },
    WB: { state: 'West Bengal', cities: ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur'] },
    MP: { state: 'Madhya Pradesh', cities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'] },
    AP: { state: 'Andhra Pradesh', cities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore'] },
    TS: { state: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'] },
    BR: { state: 'Bihar', cities: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'] },
    OR: { state: 'Odisha', cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Sambalpur', 'Berhampur'] },
};

const VEHICLE_TYPES = ['Two Wheeler', 'Four Wheeler', 'Commercial Vehicle', 'Three Wheeler'];
const LOCALITIES = ['Gandhi Nagar', 'Sector 14', 'Model Town', 'Civil Lines', 'Rajpur Road', 'MG Road'];
const LAST_NAMES = ['Sharma', 'Verma', 'Singh', 'Gupta', 'Kumar', 'Patel', 'Agarwal', 'Mishra', 'Joshi', 'Yadav'];
const EMERGENCY_FN = ['Sunita', 'Ramesh', 'Meena', 'Suresh', 'Geeta', 'Mahesh', 'Rekha', 'Dinesh', 'Anita', 'Rajesh'];

const PINCODE_PREFIX: Record<string, string> = {
    DL: '11', HR: '12', PB: '14', MH: '40', UP: '20',
    RJ: '30', GJ: '38', KA: '56', TN: '60', WB: '70',
    MP: '46', AP: '51', TS: '50', BR: '80', OR: '75',
};

// ─── Seed — combines DL number + user's name ──────────────────────────────────
// Same user + same DL  → identical seed → same data every time (consistent).
// Different user + same DL → different seed → different data (realistic).

function buildSeed(dlNumber: string, userName: string): number {
    let hash = 5381;
    const str = `${dlNumber.toUpperCase()}::${userName.toLowerCase()}`;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash * 33) ^ str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

// ─── Parse state code from DL number ────────────────────────────────────────
// Handles formats: HR-0619850123456, DL-14 20110012345, PB20240012345

function parseStateCode(dlNumber: string): string {
    const code = dlNumber.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    return STATE_MAP[code] ? code : 'DL';
}

// ─── Main service function ───────────────────────────────────────────────────

export interface LicenseData {
    name: string;
    driverId: string;
    licenseNumber: string;
    phone: string;
    email: string;
    address: string;
    emergencyContact: {
        name: string;
        phone: string;
    };
    vehicleType: string;
    issueDate: string;
    expiryDate: string;
    status: 'Valid' | 'Expired' | 'Suspended';
    state: string;
    city: string;
    pincode: string;
}

// userName always comes from the authenticated user's JWT.
export function lookupLicense(dlNumber: string, userName: string): LicenseData {
    faker.seed(buildSeed(dlNumber, userName));

    const stateCode = parseStateCode(dlNumber);
    const stateInfo = STATE_MAP[stateCode] ?? STATE_MAP['DL']!;
    const city = faker.helpers.arrayElement(stateInfo.cities);
    const state = stateInfo.state;
    const pincode = `${PINCODE_PREFIX[stateCode] ?? '11'}${faker.string.numeric(4)}`;

    // Use the real user's name — split out last name for emergency contact (family feel)
    const parts = userName.trim().split(' ');
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : faker.helpers.arrayElement(LAST_NAMES);

    const emergencyName = `${faker.helpers.arrayElement(EMERGENCY_FN)} ${lastName}`;
    const emergencyPhone = `+91 ${faker.string.numeric(5)} ${faker.string.numeric(5)}`;

    // Issue date: 1–15 years ago; DL validity is 20 years in India
    const issueDateObj = faker.date.between({
        from: dayjs().subtract(15, 'year').toDate(),
        to: dayjs().subtract(1, 'year').toDate(),
    });
    const issueDate = dayjs(issueDateObj).format('DD-MMMM-YYYY');
    const expiryDate = dayjs(issueDateObj).add(20, 'year').format('DD-MMMM-YYYY');
    const isExpired = dayjs(issueDateObj).add(20, 'year').isBefore(dayjs());

    const firstName = parts[0]!.toLowerCase();
    const phone = `+91 ${faker.string.numeric(5)} ${faker.string.numeric(5)}`;
    const email = `${firstName}.${lastName.toLowerCase()}${faker.string.numeric(2)}@gmail.com`;
    const driverId = `${stateCode}-${faker.string.numeric(14)}`;

    return {
        name: userName.trim(),
        driverId,
        licenseNumber: dlNumber.toUpperCase(),
        phone,
        email,
        address: `${faker.string.numeric(3)}, ${faker.helpers.arrayElement(LOCALITIES)}, ${city}, ${state} ${pincode}`,
        emergencyContact: { name: emergencyName, phone: emergencyPhone },
        vehicleType: faker.helpers.arrayElement(VEHICLE_TYPES),
        issueDate,
        expiryDate,
        status: isExpired ? 'Expired' : 'Valid',
        state,
        city,
        pincode,
    };
}
