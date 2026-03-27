require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

function getISOWeekData(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Monday = 1, Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
}

app.get('/', (req, res) => {
    const startStr = process.env.START_DATE;
    if (!startStr) return res.status(500).send("START_DATE not configured.");

    const startDate = new Date(startStr);
    const currentDate = new Date();
    
    // Calculate total weeks (stateless - calculated on every request)
    const timeDiff = currentDate.getTime() - startDate.getTime();
    const totalWeeks = Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000));

    const iso = getISOWeekData(currentDate);
    
    // Result format: "TotalWeeks Year-wWeek"
    res.send(`${totalWeeks} ${iso.year}-w${iso.week}`);
});

app.listen(PORT, () => console.log(`API active on port ${PORT}`));
