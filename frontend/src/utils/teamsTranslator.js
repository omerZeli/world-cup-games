/** @type {Record<string, string>} */
const TEAMS_HE = {
  // South America
  Argentina:              'ארגנטינה',
  Brazil:                 'ברזיל',
  Uruguay:                'אורוגוואי',
  Colombia:               'קולומביה',
  Ecuador:                'אקוואדור',
  Paraguay:               'פרגוואי',

  // North & Central America / Caribbean
  'United States':        'ארצות הברית',
  USA:                    'ארצות הברית',
  Mexico:                 'מקסיקו',
  Canada:                 'קנדה',
  Panama:                 'פנמה',
  Curacao:                'קוראסאו',
  Curaçao:                'קוראסאו',
  Haiti:                  'האיטי',

  // Europe
  France:                 'צרפת',
  Germany:                'גרמניה',
  Spain:                  'ספרד',
  England:                'אנגליה',
  Portugal:               'פורטוגל',
  Netherlands:            'הולנד',
  Belgium:                'בלגיה',
  Croatia:                'קרואטיה',
  Switzerland:            'שווייץ',
  Sweden:                 'שוודיה',
  Norway:                 'נורווגיה',
  Austria:                'אוסטריה',
  Turkey:                 'טורקיה',
  Türkiye:                'טורקיה',
  'Czech Republic':       'צ\'כיה',
  Czechia:                'צ\'כיה',
  Scotland:               'סקוטלנד',
  'Bosnia and Herzegovina': 'בוסניה והרצגובינה',

  // Africa
  Morocco:                'מרוקו',
  Senegal:                'סנגל',
  Ghana:                  'גאנה',
  'Ivory Coast':          'חוף השנהב',
  "Côte d'Ivoire":        'חוף השנהב',
  Tunisia:                'תוניסיה',
  Algeria:                'אלג\'יריה',
  Egypt:                  'מצרים',
  'South Africa':         'דרום אפריקה',
  'Cabo Verde':           'כף ורדה',
  'Cape Verde Islands':   'כף ורדה',
  'DR Congo':             'קונגו הדמוקרטית',
  'Congo DR':             'קונגו הדמוקרטית',
  'Democratic Republic of the Congo': 'קונגו הדמוקרטית',

  // Asia & Oceania
  Japan:                  'יפן',
  'South Korea':          'קוריאה הדרומית',
  Korea:                  'קוריאה הדרומית',
  'IR Iran':              'איראן',
  Iran:                   'איראן',
  'Saudi Arabia':         'ערב הסעודית',
  Qatar:                  'קטר',
  Australia:              'אוסטרליה',
  Iraq:                   'עיראק',
  Jordan:                 'ירדן',
  Uzbekistan:             'אוזבקיסטן',
  'New Zealand':          'ניו זילנד'
};

/**
 * Returns the Hebrew translation of a national team name.
 * Falls back to the original English name if no mapping exists.
 *
 * @param {string} englishName
 * @returns {string}
 */
export function translateTeam(englishName) {
  return TEAMS_HE[englishName] ?? englishName;
}

export default TEAMS_HE;
