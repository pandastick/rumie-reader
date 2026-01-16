/**
 * Netlify Serverless Function: CORS Proxy for n8n Webhook
 * 
 * This function makes server-side requests to the n8n webhook,
 * bypassing CORS restrictions that affect browser-based requests.
 */

export async function handler(event, context) {
  // CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get webhook URL from environment variable
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'N8N_WEBHOOK_URL environment variable not configured' 
        })
      };
    }

    console.log('Proxying request to:', webhookUrl);

    // Make the request to n8n (server-side, no CORS issues)
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Received data records:', Array.isArray(data) ? data.length : 'not an array');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch data from n8n',
        message: error.message 
      })
    };
  }
}
