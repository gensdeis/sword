const fs = require('fs');
const path = require('path');

const rarities = ['common', 'rare', 'epic', 'legendary'];
const baseWeaponTypes = [
  '\uAC80', // 검
  '\uB3C4\uB07C', // 도끼
  '\uCC3D', // 창
  '\uAD81', // 궁
  '\uC9C0\uD321\uC774', // 지팡이
  '\uB2E8\uAC80', // 단검
  '\uB9DD\uCE58', // 망치
  '\uCC20\uD1F4', // 철퇴
  '\uB108\uD074', // 너클
  '\uB0AF', // 낫
  '\uBD80\uBA54\uB791', // 부메랑
  '\uCC44\uCC0D' // 채찍
];
const adjectives = [
  '\uC5F0\uC2B5\uC6A9', // 연습용
  '\uB0A1\uC740', // 낡은
  '\uD22C\uBC15\uD55C', // 투박한
  '\uB2E8\uB2E8\uD55C', // 단단한
  '\uB0A0\uCE74\uB85C\uC6B4', // 날카로운
  '\uBB34\uAC70\uC6B4', // 무거운
  '\uAC00\uBCBC\uC6B4', // 가벼운
  '\uC2E0\uC14D\uD55C', // 신속한
  '\uAC15\uB825\uD55C', // 강력한
  '\uAC70\uB300\uD55C', // 거대한
  '\uACE0\uB300\uC758', // 고대의
  '\uC2E0\uBE44\uD55C', // 신비한
  '\uB9C8\uBC95\uC758', // 마법의
  '\uCD95\uBCF5\uBC1B\uC740', // 축복받은
  '\uC800\uC8FC\uBC1B\uC740', // 저주받은
  '\uBD88\uD0C0\uB294', // 불타는
  '\uCC28\uAC00\uC6B4', // 차가운
  '\uBE5B\uB098\uB294', // 빛나는
  '\uC5B4\uB450\uC6B4', // 어두운
  '\uCC9C\uC0C1\uC758' // 천상의
];

const levelPrefixes = [
  { min: 0, max: 0, prefix: '' },
  { min: 1, max: 3, prefix: '\uAC15\uD654\uB41C' }, // 강화된
  { min: 4, max: 6, prefix: '\uC815\uAD50\uD55C' }, // 정교한
  { min: 7, max: 9, prefix: '\uBA85\uD488' }, // 명품
  { min: 10, max: 12, prefix: '\uB2EC\uC778\uC758' }, // 달인의
  { min: 13, max: 15, prefix: '\uC804\uC124\uC801\uC778' }, // 전설적인
  { min: 16, max: 18, prefix: '\uD658\uC0C1\uC801\uC778' }, // 환상적인
  { min: 19, max: 19, prefix: '\uCD08\uC6D4\uC801\uC778' }, // 초월적인
  { min: 20, max: 20, prefix: '\uC2E0\uACA9\uC758' } // 신격의
];

function getLevelPrefix(level) {
  const found = levelPrefixes.find(p => level >= p.min && level <= p.max);
  return found ? found.prefix : '';
}

function generateWeapons() {
  const weapons = [];
  let currentId = 100;

  for (let b = 1; b <= 120; b++) {
    const rarityIndex = b <= 60 ? 0 : b <= 96 ? 1 : b <= 114 ? 2 : 3;
    const rarity = rarities[rarityIndex];
    const type = baseWeaponTypes[Math.floor(Math.random() * baseWeaponTypes.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const baseName = `${adj} ${type}`;
    const isHidden = b > 100;
    
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
        description: `${rarity} \uB4F1\uAE09\uC758 ${name}\uC785\uB2C8\uB2E4.`,
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

const BOM = '\uFEFF';
fs.writeFileSync(path.join(dataDir, 'weapons.csv'), BOM + header + rows, { encoding: 'utf8' });
console.log('Successfully generated 2520 weapons data in server/data/weapons.csv as UTF-8 with BOM');
