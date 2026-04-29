const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

export default async function handler(req, res) {
    // Configuración de cabeceras para evitar bloqueos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const counts = {};
    const url = "https://www.flalottery.com/exptkt/p3.csv";

    try {
        // Descarga de datos oficiales
        const { data } = await axios.get(url, { timeout: 8000 });
        const stream = Readable.from(data).pipe(csv());

        for await (const row of stream) {
            const year = parseInt(row.Year);
            const num = row.Midday?.trim();

            // Filtro: Solo Tarde y desde 2012
            if (year >= 2012 && num) {
                const formatted = num.padStart(3, '0');
                counts[formatted] = (counts[formatted] || 0) + 1;
            }
        }

        // Ordenar y tomar los 5 mejores
        const result = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([numero, apariciones]) => ({ numero, apariciones }));

        return res.status(200).json(result);
    } catch (e) {
        return res.status(500).json({ error: "Error al conectar con la lotería" });
    }
}
