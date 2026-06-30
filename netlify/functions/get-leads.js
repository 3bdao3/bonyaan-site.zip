exports.handler = async function (event, context) {
  const TOKEN = process.env.NETLIFY_API_TOKEN;
  const SITE_ID = process.env.NETLIFY_SITE_ID;

  if (!TOKEN || !SITE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing NETLIFY_API_TOKEN or NETLIFY_SITE_ID environment variables. Set them in Netlify Site settings -> Environment variables.'
      })
    };
  }

  try {
    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (!formsRes.ok) {
      const txt = await formsRes.text();
      return { statusCode: formsRes.status, body: JSON.stringify({ error: 'Failed to fetch forms', details: txt }) };
    }

    const forms = await formsRes.json();
    const contactForm = forms.find(f => f.name === 'contact');

    if (!contactForm) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }

    const subsRes = await fetch(
      `https://api.netlify.com/api/v1/forms/${contactForm.id}/submissions?per_page=100`,
      { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (!subsRes.ok) {
      const txt = await subsRes.text();
      return { statusCode: subsRes.status, body: JSON.stringify({ error: 'Failed to fetch submissions', details: txt }) };
    }

    const submissions = await subsRes.json();

    const leads = submissions.map(s => ({
      id: s.id,
      date: new Date(s.created_at).toLocaleString('ar-EG'),
      created_at: s.created_at,
      name: s.data.name || '',
      phone: s.data.phone || '',
      email: s.data.email || '',
      type: s.data['project-type'] || '',
      msg: s.data.message || '',
      status: 'جديد'
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leads)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
