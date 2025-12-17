// src/waspasLogic.js

// 1. Kriterlerin Tanımlanması
// type: 1 -> Fayda (Benefit/Maximization)
// type: -1 -> Maliyet (Cost/Minimization)
export const CRITERIA = [
  { key: "hardness", name: "Hardness", type: 1, weight: 0.1761 },
  { key: "thickness", name: "Thickness", type: 1, weight: 0.2042 },
  { key: "aesthetic", name: "Aesthetic", type: 1, weight: 0.2668 },
  { key: "adhesion", name: "Adhesion", type: 1, weight: 0.1243 },
  { key: "cost", name: "Cost", type: -1, weight: 0.2286 }
];

// 2. Alternatiflerin ve Ham Verilerin Tanımlanması
// Kitaptaki 'Electroplating System Selection' verileri
export const ALTERNATIVES = [
  { name: "Silver", hardness: 350, thickness: 20, aesthetic: 4, adhesion: 4, cost: 2 },
  { name: "Gold", hardness: 250, thickness: 25, aesthetic: 5, adhesion: 3, cost: 3 },
  { name: "Lead", hardness: 150, thickness: 30, aesthetic: 3, adhesion: 1, cost: 1 },
  { name: "Rhodium", hardness: 400, thickness: 20, aesthetic: 2, adhesion: 3, cost: 2 },
  { name: "Nickel", hardness: 550, thickness: 30, aesthetic: 1, adhesion: 2, cost: 1 },
  { name: "Chromium", hardness: 600, thickness: 35, aesthetic: 1, adhesion: 5, cost: 1 },
  { name: "Platinum", hardness: 580, thickness: 30, aesthetic: 4, adhesion: 4, cost: 3 }
];

// 3. Normalizasyon İşlemi
export const normalizeData = (data, criteria) => {
  // Önce her sütun için Min ve Max değerleri buluyoruz
  const limits = {};
  criteria.forEach(c => {
    const values = data.map(item => item[c.key]);
    limits[c.key] = {
      max: Math.max(...values),
      min: Math.min(...values)
    };
  });

  // Her satırı (alternatifi) kriter tipine göre normalize ediyoruz
  return data.map(item => {
    const normItem = { name: item.name };
    criteria.forEach(c => {
      let val = item[c.key];
      
      // Formüller:
      // Fayda (1): x_ij / max_j
      // Maliyet (-1): min_j / x_ij
      if (c.type === 1) {
        normItem[c.key] = val / limits[c.key].max;
      } else {
        normItem[c.key] = limits[c.key].min / val;
      }
    });
    return normItem;
  });
};

// 4. WASPAS Hesaplaması (WSM + WPM)
export const calculateWASPAS = (normalizedData, criteria, lambdaVal) => {
  return normalizedData.map(item => {
    let q1 = 0; // Weighted Sum Model (Ağırlıklı Toplam)
    let q2 = 1; // Weighted Product Model (Ağırlıklı Çarpım)

    criteria.forEach(c => {
      const val = item[c.key];
      const w = c.weight;

      // Q1: Değer * Ağırlık toplamı
      q1 += val * w;

      // Q2: Değer ^ Ağırlık çarpımı
      q2 *= Math.pow(val, w);
    });

    // Final Q: Lambda ile birleştirme formülü
    const finalQ = (lambdaVal * q1) + ((1 - lambdaVal) * q2);

    return {
      name: item.name,
      q1: q1,
      q2: q2,
      finalQ: finalQ
    };
  })
  // Sonuçları finalQ puanına göre sırala (Büyükten küçüğe)
  .sort((a, b) => b.finalQ - a.finalQ)
  // Sıralama numarasını (Rank) ekle
  .map((item, index) => ({ ...item, rank: index + 1 }));
};