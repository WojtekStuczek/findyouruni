export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY || process.env.VITE_WEB3FORMS_ACCESS_KEY;
    
    if (!accessKey) {
      return res.status(500).json({ success: false, message: "WEB3FORMS_ACCESS_KEY is not set on the server." });
    }

    const body = {
      ...req.body,
      access_key: accessKey
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error("Error submitting to Web3Forms:", error);
    res.status(500).json({ success: false, message: "Failed to submit form" });
  }
}
