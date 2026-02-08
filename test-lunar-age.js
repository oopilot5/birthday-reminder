// Test lunar birthday age calculation
const { Lunar, Solar } = require('lunar-javascript');

// Convert lunar 1983-10-26 to solar
const lunarBirth = Lunar.fromYmd(1983, 10, 26);
const solarBirth = lunarBirth.getSolar();
console.log(`Lunar 1983-10-26 -> Solar ${solarBirth.getYear()}-${solarBirth.getMonth()}-${solarBirth.getDay()}`);

// Birth datetime: 1983-10-26 (lunar) 06:00 -> solar date 06:00
const birthDateTime = new Date(solarBirth.getYear(), solarBirth.getMonth() - 1, solarBirth.getDay(), 6, 0, 0);
console.log(`Birth datetime: ${birthDateTime.toISOString()}`);

// Reference datetime: 2026-02-07 23:51
const refDateTime = new Date(2026, 1, 7, 23, 51, 0);
console.log(`Reference datetime: ${refDateTime.toISOString()}`);

// Calculate relativedelta
let years = refDateTime.getFullYear() - birthDateTime.getFullYear();
let months = refDateTime.getMonth() - birthDateTime.getMonth();
let days = refDateTime.getDate() - birthDateTime.getDate();
let hours = refDateTime.getHours() - birthDateTime.getHours();
let minutes = refDateTime.getMinutes() - birthDateTime.getMinutes();
let seconds = refDateTime.getSeconds() - birthDateTime.getSeconds();

console.log(`\nBefore normalization:`);
console.log(`years=${years}, months=${months}, days=${days}, hours=${hours}, minutes=${minutes}, seconds=${seconds}`);

// Normalize seconds
if (seconds < 0) {
  seconds += 60;
  minutes--;
}

// Normalize minutes
if (minutes < 0) {
  minutes += 60;
  hours--;
}

// Normalize hours
if (hours < 0) {
  hours += 24;
  days--;
}

// Normalize days
if (days < 0) {
  const prevMonth = new Date(refDateTime.getFullYear(), refDateTime.getMonth(), 0);
  days += prevMonth.getDate();
  months--;
}

// Normalize months
if (months < 0) {
  months += 12;
  years--;
}

console.log(`\nAfter normalization:`);
console.log(`年龄：${years} 岁 ${months} 月 ${days} 天 ${hours} 时 ${minutes} 分`);
console.log(`\nExpected: 年龄：42 岁 2 月 8 天 17 时 51 分`);
