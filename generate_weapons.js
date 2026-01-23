const fs = require('fs');
const path = require('path');

const rarities = ['common', 'rare', 'epic', 'legendary'];
const baseWeaponTypes = [
  '검', '도끼', '창', '궁', '지팡이', '단검', '망치', '철퇴', '너클', '낫', '부메랑', '채찍'
];
const adjectives = [
  '연습용', '낡은', '투박한', '단단한', '날카로운', '무거운', '가벼운', '신속한', '강력한', '거대한',
  '고대의', '신비한', '마법의', '축복받은', '저주받은', '불타는', '차가운', '빛나는', '어두운', '천상의'
];

const levelPrefixes = [
  { min: 0, max: 0, prefix: '' },
  { min: 1, max: 3, prefix: '강화된' },
  { min: 4, max: 6, prefix: '정교한' },
  { min: 7, max: 9, prefix: '명품' },
  { min: 10, max: 12, prefix: '달인의' },
  { min: 13, max: 15, prefix: '전설적인' },
  { min: 16, max: 18, prefix: '환상적인' },
  { min: 19, max: 19, prefix: '초월적인' },
  { min: 20, max: 20, prefix: '신격의' }
];

function getLevelPrefix(level) {
  const found = levelPrefixes.find(p => level >= p.min && level <= p.max);
  return found ? found.prefix : '';
}

function generateWeapons() {
  const weapons = [];
  let currentId = 100; // Start from 100 to avoid conflict with initial templates (1-17)

  for (let b = 1; b <= 120; b++) {
    const rarityIndex = b <= 60 ? 0 : b <= 96 ? 1 : b <= 114 ? 2 : 3;
    const rarity = rarities[rarityIndex];
    const type = baseWeaponTypes[Math.floor(Math.random() * baseWeaponTypes.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const baseName = `${adj} ${type}`;
    const isHidden = b > 100; // 20 hidden weapons
    
    const baseAttack = (rarityIndex + 1) * 10 + Math.floor(Math.random() * 10);
    const sellBase = (rarityIndex + 1) * 10;
    const sellPerLevel = (rarityIndex + 1) * 5;

    for (let l = 0; l <= 20; l++) {
      const prefix = getLevelPrefix(l);
      const name = prefix ? `${prefix} ${baseName}` : baseName;
      
      weapons.push({
        id: currentId++,
        base_weapon_id: b,
        name: name,
        level: l,
        rarity: rarity,
        base_attack: baseAttack,
        can_double_enhance: rarity === 'legendary' ? 1 : 0,
        double_enhance_rate: rarity === 'legendary' ? 15.00 : 0.00,
        sell_price_base: sellBase,
        sell_price_per_level: sellPerLevel,
        description: `${rarity} 등급의 ${name}입니다.`,
        is_hidden: isHidden ? 1 : 0
      });
    }
  }
  return weapons;
}

const weapons = generateWeapons();
const header = 'id,base_weapon_id,name,level,rarity,base_attack,can_double_enhance,double_enhance_rate,sell_price_base,sell_price_per_level,description,is_hidden\n';
const rows = weapons.map(w => 
  `${w.id},${w.base_weapon_id},"${w.name}",${w.level},${w.rarity},${w.base_attack},${w.can_double_enhance},${w.double_enhance_rate},${w.sell_price_base},${w.sell_price_per_level},"${w.description}",${w.is_hidden}`
).join('\n');

const dataDir = path.join(__dirname, 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(path.join(dataDir, 'weapons.csv'), header + rows, { encoding: 'utf8' });
console.log('Successfully generated 2520 weapons data in server/data/weapons.csv as UTF-8');
