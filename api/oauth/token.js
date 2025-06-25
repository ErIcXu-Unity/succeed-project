export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirect_uri, client_id } = req.body;
  const client_secret = process.env.MOODLE_CLIENT_SECRET;

  try {
    const tokenResponse = await fetch('https://moodle.telt.unsw.edu.au/admin/oauth2/token.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        code,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error || 'Token exchange failed');
    }

    res.status(200).json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(400).json({ error: error.message });
  }
}
