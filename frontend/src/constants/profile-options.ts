interface OptionType {
  value: string;
  label: string;
  color?: string;
  gradient?: string;
}

export const EYE_COLOR_OPTIONS: OptionType[] = [
  { value: 'dark-brown', label: 'Dark Brown', color: '#5D4037' },
  { value: 'light-brown', label: 'Light Brown', color: '#A1887F' },
  { value: 'blue', label: 'Blue', color: '#2196F3' },
  { value: 'hazel', label: 'Hazel', gradient: 'linear-gradient(180deg, #215313 0%, #7B4A0A 100%)' },
  { value: 'green', label: 'Green', color: '#66BB6A' },
  { value: 'grey', label: 'Grey', color: '#9E9E9E' },
  { value: 'amber', label: 'Amber', color: '#FF8F00' },
  { value: 'heterochromia', label: 'Heterochromia', gradient: 'linear-gradient(180deg, #735735 50%, #128BE1 50%)' },
  { value: 'black', label: 'Black', color: '#000000' },
];

export const HAIR_COLOR_OPTIONS: OptionType[] = [
  { value: 'black', label: 'Black', color: '#000000' },
  { value: 'dark-brown', label: 'Dark Brown', color: '#3E2723' },
  { value: 'brown', label: 'Brown', color: '#5D4037' },
  { value: 'blonde', label: 'Blonde', color: '#bca99a' },
  { value: 'red', label: 'Red', color: '#BF360C' },
  { value: 'grey', label: 'Grey', color: '#9E9E9E' },
  { value: 'white', label: 'White', color: '#FFFFFF' },
  { value: 'purple', label: 'Purple', color: '#462c6b' },
  { value: 'blue', label: 'Blue', color: '#2196F3' },
  { value: 'green', label: 'Green', color: '#23845f' },
  { value: 'orange', label: 'Orange', color: '#d36609' },
  { value: 'pink', label: 'Pink', color: '#e36d86' },
  { value: 'pastel-pink', label: 'Pastel Pink', color: '#e0adb0' },
];

export const HAIR_LENGTH_OPTIONS: OptionType[] = [
  { value: 'bald', label: 'Bald/Shaved' },
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
  { value: 'very-long', label: 'Very Long' },
];

export const MALE_HAIRSTYLE_OPTIONS: OptionType[] = [
  { value: 'bald-head', label: 'Bald Head' },
  { value: 'balding-top', label: 'Balding Top' },
  { value: 'straight-hair', label: 'Straight Hair' },
  { value: 'wavy-hair', label: 'Wavy Hair' },
  { value: 'curly-hair', label: 'Curly Hair' },
  { value: 'afro', label: 'Afro' },
  { value: 'dreadlocks', label: 'Dreadlocks' },
  { value: 'cornrows', label: 'Cornrows' },
  { value: 'slicked-back', label: 'Slicked Back' },
  { value: 'comb-over', label: 'Comb Over' },
  { value: 'receding-hairline', label: 'Receding Hairline' },
  { value: 'undercut', label: 'Undercut' },
  { value: 'man-bun', label: 'Man Bun' },
  { value: 'mohawk', label: 'Mohawk' },
  { value: 'crew-cut', label: 'Crew Cut' },
  { value: 'faux-hawk', label: 'Faux Hawk' },
  { value: 'buzzcut', label: 'Buzzcut' },
];

export const FEMALE_HAIRSTYLE_OPTIONS: OptionType[] = [
  { value: 'straight-hair', label: 'Straight Hair' },
  { value: 'wavy-hair', label: 'Wavy Hair' },
  { value: 'curly-hair', label: 'Curly Hair' },
  { value: 'afro', label: 'Afro' },
  { value: 'dreadlocks', label: 'Dreadlocks' },
  { value: 'cornrows', label: 'Cornrows' },
  { value: 'braided-hair', label: 'Braided Hair' },
  { value: 'updo', label: 'Updo' },
  { value: 'ponytail', label: 'Ponytail' },
  { value: 'hair-highlights', label: 'Hair Highlights' },
  { value: 'bangs', label: 'Bangs' },
  { value: 'pixie-cut', label: 'Pixie Cut' },
  { value: 'layered-hair', label: 'Layered Hair' },
  { value: 'twists', label: 'Twists' },
];

export const AGE_RANGE_OPTIONS: OptionType[] = [
  { value: '18-25', label: '18 to 25 years' },
  { value: '26-30', label: '26 to 30 years' },
  { value: '31-35', label: '31 to 35 years' },
  { value: '36-40', label: '36 to 40 years' },
  { value: '41-50', label: '41 to 50 years' },
  { value: '50+', label: 'Over 50 years' },
];

export const BODY_TYPE_OPTIONS: OptionType[] = [
  { value: 'slim', label: 'Slim' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'average', label: 'Average' },
  { value: 'muscular', label: 'Muscular' },
  { value: 'plus-size', label: 'Plus Size' },
];

export const HEIGHT_RANGE_OPTIONS: OptionType[] = [
  { value: 'under-160', label: 'Under 160 cm' },
  { value: '160-170', label: '160 to 170 cm' },
  { value: '170-180', label: '170 to 180 cm' },
  { value: '180-190', label: '180 to 190 cm' },
  { value: 'over-190', label: 'Over 190 cm' },
];

export const WEIGHT_RANGE_OPTIONS: OptionType[] = [
  { value: 'under-60', label: 'Under 60 KG' },
  { value: '60-70', label: '60 to 70 KG' },
  { value: '71-80', label: '71 to 80 KG' },
  { value: '81-90', label: '81 to 90 KG' },
  { value: '91-100', label: '91 to 100 KG' },
  { value: 'over-100', label: 'Over 100 KG' },
];

export const ETHNICITY_OPTIONS: OptionType[] = [
  { value: 'caucasian', label: 'Caucasian' },
  { value: 'black', label: 'Black' },
  { value: 'asian', label: 'Asian' },
  { value: 'hispanic', label: 'Hispanic' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'indian', label: 'Indian' },
  { value: 'mixed', label: 'Mixed' },
];

export const GLASSES_OPTIONS: OptionType[] = [
  { value: 'no', label: 'No glasses' },
  { value: 'yes', label: 'Glasses' },
  { value: 'sun', label: 'Sunglasses' },
]; 