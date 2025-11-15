import fetch from 'node-fetch'

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  const email = process.env.GF_TEST_EMAIL
  const password = process.env.GF_TEST_PASSWORD
  if (!email || !password) {
    console.error('GF_TEST_EMAIL e GF_TEST_PASSWORD são obrigatórios')
    process.exit(1)
  }

  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`)
  const csrfJson = await csrfRes.json()
  const csrfToken = csrfJson.token || csrfJson.csrf || csrfJson.value
  const cookies = csrfRes.headers.get('set-cookie') || ''

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      'Cookie': cookies,
    },
    body: JSON.stringify({ email, password })
  })
  const loginJson = await loginRes.json()
  const setCookie = loginRes.headers.get('set-cookie')
  console.log(JSON.stringify({ status: loginRes.status, body: loginJson, cookie: setCookie }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

