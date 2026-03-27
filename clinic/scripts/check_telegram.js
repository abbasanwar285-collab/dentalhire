
const token = '8398653513:AAHe3pWLdPasT40a63izzxLhFEn_Mh9D7gQ';
const url = `https://api.telegram.org/bot${token}/getUpdates`;

try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
} catch (error) {
    console.error('Error:', error);
}
