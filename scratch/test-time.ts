const now = new Date();
const istOffsetMinutes = 5.5 * 60;
const istDate = new Date(now.getTime() + istOffsetMinutes * 60 * 1000);
const currentHour = istDate.getUTCHours();

const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
const istHour = istNow.getUTCHours();

console.log('now.toISOString():', now.toISOString());
console.log('now.toString():', now.toString());
console.log('currentHour (calculateBasicIncome version):', currentHour);
console.log('istHour (teamUtils/User version):', istHour);
console.log('Session Type:', istHour < 12 ? 'morning' : 'evening');
