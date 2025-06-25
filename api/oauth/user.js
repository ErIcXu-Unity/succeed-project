export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const userResponse = await fetch(
      `https://moodle.telt.unsw.edu.au/webservice/rest/server.php?wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`
    );

    const userData = await userResponse.json();
    
    if (!userResponse.ok || userData.exception) {
      throw new Error(userData.message || 'Failed to get user info');
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('User info error:', error);
    res.status(400).json({ error: error.message });
  }
}
