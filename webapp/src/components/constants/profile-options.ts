export interface OptionType {
  value: string;
  label: string;
  color?: string;
  gradient?: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  options: OptionType[];
  isRequired?: boolean;
  genderSpecific?: boolean;
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
  { value: 'auburn', label: 'Auburn', color: '#A0522D' },
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



export const AGE_RANGE_OPTIONS: OptionType[] = [
  { value: '18-25', label: '18 to 25 years' },
  { value: '26-30', label: '26 to 30 years' },
  { value: '31-35', label: '31 to 35 years' },
  { value: '36-40', label: '36 to 40 years' },
  { value: '41-45', label: '41 to 45 years' },
  { value: '46-50', label: '46 to 50 years' },
  { value: '51-55', label: '51 to 55 years' },
  { value: '56-60', label: '56 to 60 years' },
  { value: '61-65', label: '61 to 65 years' },
  { value: '66-70', label: '66 to 70 years' },
  { value: '71-75', label: '71 to 75 years' },
  { value: '76-80', label: '76 to 80 years' },
  { value: '81-85', label: '81 to 85 years' },
  { value: '86-90', label: '86 to 90 years' },
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
];

export const PROFILE_FORM_FIELDS: FormFieldConfig[] = [
  {
    name: 'gender',
    label: 'GENDER',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' }
    ],
    isRequired: false,
  },
  {
    name: 'eyeColor',
    label: 'EYE COLOR',
    options: EYE_COLOR_OPTIONS,
    isRequired: true,
  },
  {
    name: 'hairColor',
    label: 'HAIR COLOR',
    options: HAIR_COLOR_OPTIONS,
    isRequired: true,
  },

  {
    name: 'age',
    label: 'AGE',
    options: AGE_RANGE_OPTIONS,
    isRequired: true,
  },
  {
    name: 'bodyType',
    label: 'BODY TYPE',
    options: BODY_TYPE_OPTIONS,
    isRequired: true,
  },
  {
    name: 'height',
    label: 'HEIGHT',
    options: HEIGHT_RANGE_OPTIONS,
    isRequired: true,
  },
  {
    name: 'weight',
    label: 'WEIGHT',
    options: WEIGHT_RANGE_OPTIONS,
    isRequired: true,
  },
  {
    name: 'ethnicity',
    label: 'ETHNICITY',
    options: ETHNICITY_OPTIONS,
    isRequired: true,
  },
  {
    name: 'glasses',
    label: 'GLASSES',
    options: GLASSES_OPTIONS,
    isRequired: true,
  },
]; 