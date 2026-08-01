const { Parser } = require('json2csv');

function sendDataset(res, req, rows, filename) {
  const format = String(req.query.format || 'json').toLowerCase();

  if (format === 'csv') {
    const parser = new Parser();
    const csv = rows.length ? parser.parse(rows) : '';
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`${filename}.csv`);
    return res.send(csv);
  }

  return res.status(200).json({
    success: true,
    dataset: filename,
    count: rows.length,
    data: rows,
  });
}

module.exports = { sendDataset };
