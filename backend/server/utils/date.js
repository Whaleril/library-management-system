function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(input) {
  const date = new Date(input);

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(" ");
}

function addDays(input, days) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}

module.exports = {
  formatDateTime,
  addDays,
};
