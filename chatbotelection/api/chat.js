// /api/chat.js
module.exports = async (req, res) => {
  // Set CORS headers for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Gemini API Error:', apiResponse.status, errorText);
      return res.status(apiResponse.status).json({ error: `Failed to get response from AI service. Status: ${apiResponse.status}` });
    }

    const data = await apiResponse.json();

    // More robust check for the response text
    const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!botResponse) {
      console.error('Invalid response structure from Gemini API:', JSON.stringify(data));
      return res.status(500).json({ error: 'Received an invalid response from the AI service.' });
    }

    return res.status(200).json({ response: botResponse });

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred on the server.' });
  }
};
