// src/ui/utils/format.js

export const formatNumber = (num) => {
  return num.toLocaleString('ru-RU');
};

export const formatDistance = (distance) => {
  return `${Math.floor(distance)} м`;
};
