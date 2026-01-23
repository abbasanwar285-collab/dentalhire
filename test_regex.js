const text = "النجف";
const pattern = "النجف";
const regex = new RegExp(`\\b${pattern}\\b`, 'i');
console.log(`Testing '${pattern}' in '${text}':`, regex.test(text));

const text2 = "hello";
const pattern2 = "hello";
const regex2 = new RegExp(`\\b${pattern2}\\b`, 'i');
console.log(`Testing '${pattern2}' in '${text2}':`, regex2.test(text2));

const text3 = "حي النجف";
console.log(`Testing '${pattern}' in '${text3}':`, regex.test(text3));
