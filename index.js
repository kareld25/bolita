const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

export default async function handler(req, res) {
    const url = "https://www.flalottery.com/exptkt/p3.csv";
    const counts = {};

    try {
        const response = await axios.get(url);
        const stream = Readable.from(response.data).pipe(csv());

        for await (const row of stream) {
            const year = parseInt(row.Year);
            const midday = row.Midday?.trim();

            // Filtro verídico: Tarde y desde 2012
            if (year >= 2012 && midday) {
                const num = midday.padStart(3, '0');
                counts[num] = (counts[num] || 0) + 1;
            }
        }

        // Ordenar Top 5
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([numero, apariciones]) => ({ numero, apariciones }));

        res.status(200).json(sorted);
    } catch (error) {
        res.status(500).json({ error: "Error conectando con Florida Lottery" });
    }
}