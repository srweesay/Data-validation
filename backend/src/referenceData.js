// Reference datasets used by the validation engine.
// NOTE: The Ethiopian bank SWIFT list below covers the codes named explicitly in
// the project brief plus a set of well-known Ethiopian banks. For a production
// deployment this list should be confirmed against an authoritative source
// (e.g. the National Bank of Ethiopia / SWIFT registry) and kept up to date.

export const ETHIOPIAN_BANK_SWIFT_CODES = [
  'CBETETAA', // Commercial Bank of Ethiopia
  'ABYSETAA', // Bank of Abyssinia
  'AWINETAA', // Awash Bank
  'DASHETAA', // Dashen Bank
  'UNTOETAA', // United Bank
  'NIBIETAA', // Nib International Bank
  'WLGRETAA', // Wegagen Bank
  'ZEMEETAA', // Zemen Bank
  'OIBEETAA', // Oromia International Bank
  'LIBEETAA', // Lion International Bank
  'BUNAETAA', // Buna International Bank
  'COABETAA', // Cooperative Bank of Oromia
  'ENAAETAA', // Enat Bank
  'ADIBETAA', // Addis International Bank
  'DEBUETAA', // Debub Global Bank
  'ABAYETAA', // Abay Bank
  'BRHNETAA', // Berhan Bank
  'HIJRETAA', // Hijra Bank
  'SHABETAA', // Shabelle Bank
  'SIINETAA', // Siinqee Bank
  'GDAAETAA', // Goh Betoch Bank
  'AMHRETAA', // Amhara Bank
];

// A compact ISO-3166 country name list (short names as commonly used).
export const ISO_COUNTRY_NAMES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia',
  'Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium',
  'Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
  'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad',
  'Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czechia',
  'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador',
  'Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland',
  'France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea',
  'Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein',
  'Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands',
  'Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco',
  'Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger',
  'Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia',
  'Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore',
  'Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain',
  'Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania',
  'Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan',
  'Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay',
  'Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

export const ISO_COUNTRY_NAMES_LOWER = new Set(ISO_COUNTRY_NAMES.map((c) => c.toLowerCase()));
export const ETHIOPIAN_BANK_SWIFT_SET = new Set(ETHIOPIAN_BANK_SWIFT_CODES);
