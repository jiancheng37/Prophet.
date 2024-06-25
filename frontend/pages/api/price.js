export default async function handler(req, res) {
  const response = await fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD&api_key=6113743f746dae36c48c05b10adb7c3281861cb17157c03c2b116c007030a7af`
  )
  const data = await response.json()
  res.status(200).json(data)
}
