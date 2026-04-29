const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

export default async function handler(req, res) {
    // Cabeceras de seguridad y tipo de contenido
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const url = "https://www.flalottery.com/exptkt/p3.csv";
    const counts = {};

    try {
        const response = await axios.get(url, { timeout: 8000 });
        const stream = Readable.from(response.data).pipe(csv());

        for await (const row of stream) {
            const year = parseInt(row.Year);
            const midday = row.Midday?.trim();

            // Filtro: Solo sorteos de la tarde desde 2012
            if (year >= 2012 && midday && midday !== "") {
                const num = midday.padStart(3, '0');
                counts[num] = (counts[num] || 0) + 1;
            }
        }

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([numero, apariciones]) => ({ numero, apariciones }));

        return res.status(200).json(sorted);

    } catch (error) {
        return res.status(500).json({ error: "Fallo en la conexión oficial" });
    }
}
