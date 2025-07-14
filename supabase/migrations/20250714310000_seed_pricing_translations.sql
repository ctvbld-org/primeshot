-- Data Migration: Populate translations for pricing tables
-- This file can be safely dropped later if needed
-- Populates the translations JSONB columns with professional translations for all supported languages

-- Update subscriptions with translations
UPDATE subscriptions SET translations = '{
  "en": {
    "name": "Basic", 
    "description": "Includes 40 credits per month, plus 1 FaceModel (30 credits value)."
  },
  "es": {
    "name": "Básico", 
    "description": "Incluye 40 créditos por mes, más 1 FaceModel (valor de 30 créditos)."
  },
  "fr": {
    "name": "Basique", 
    "description": "Comprend 40 crédits par mois, plus 1 FaceModel (valeur de 30 crédits)."
  },
  "it": {
    "name": "Base", 
    "description": "Include 40 crediti al mese, più 1 FaceModel (valore di 30 crediti)."
  },
  "pt": {
    "name": "Básico", 
    "description": "Inclui 40 créditos por mês, mais 1 FaceModel (valor de 30 créditos)."
  },
  "de": {
    "name": "Basis", 
    "description": "Beinhaltet 40 Credits pro Monat, plus 1 FaceModel (Wert von 30 Credits)."
  },
  "nl": {
    "name": "Basis", 
    "description": "Bevat 40 credits per maand, plus 1 FaceModel (waarde van 30 credits)."
  },
  "zh": {
    "name": "基础版", 
    "description": "每月包含40个积分，外加1个FaceModel（价值30积分）。"
  },
  "ja": {
    "name": "ベーシック", 
    "description": "月40クレジット、FaceModel1個（30クレジット相当）を含みます。"
  }
}' WHERE name = 'basic';

UPDATE subscriptions SET translations = '{
  "en": {
    "name": "Standard", 
    "description": "Includes 180 credits per month, plus 1 FaceModel (30 credits value)."
  },
  "es": {
    "name": "Estándar", 
    "description": "Incluye 180 créditos por mes, más 1 FaceModel (valor de 30 créditos)."
  },
  "fr": {
    "name": "Standard", 
    "description": "Comprend 180 crédits par mois, plus 1 FaceModel (valeur de 30 crédits)."
  },
  "it": {
    "name": "Standard", 
    "description": "Include 180 crediti al mese, più 1 FaceModel (valore di 30 crediti)."
  },
  "pt": {
    "name": "Padrão", 
    "description": "Inclui 180 créditos por mês, mais 1 FaceModel (valor de 30 créditos)."
  },
  "de": {
    "name": "Standard", 
    "description": "Beinhaltet 180 Credits pro Monat, plus 1 FaceModel (Wert von 30 Credits)."
  },
  "nl": {
    "name": "Standaard", 
    "description": "Bevat 180 credits per maand, plus 1 FaceModel (waarde van 30 credits)."
  },
  "zh": {
    "name": "标准版", 
    "description": "每月包含180个积分，外加1个FaceModel（价值30积分）。"
  },
  "ja": {
    "name": "スタンダード", 
    "description": "月180クレジット、FaceModel1個（30クレジット相当）を含みます。"
  }
}' WHERE name = 'standard';

UPDATE subscriptions SET translations = '{
  "en": {
    "name": "Pro", 
    "description": "Includes 450 credits per month, plus 3 FaceModels (90 credits value)."
  },
  "es": {
    "name": "Pro", 
    "description": "Incluye 450 créditos por mes, más 3 FaceModels (valor de 90 créditos)."
  },
  "fr": {
    "name": "Pro", 
    "description": "Comprend 450 crédits par mois, plus 3 FaceModels (valeur de 90 crédits)."
  },
  "it": {
    "name": "Pro", 
    "description": "Include 450 crediti al mese, più 3 FaceModels (valore di 90 crediti)."
  },
  "pt": {
    "name": "Pro", 
    "description": "Inclui 450 créditos por mês, mais 3 FaceModels (valor de 90 créditos)."
  },
  "de": {
    "name": "Pro", 
    "description": "Beinhaltet 450 Credits pro Monat, plus 3 FaceModels (Wert von 90 Credits)."
  },
  "nl": {
    "name": "Pro", 
    "description": "Bevat 450 credits per maand, plus 3 FaceModels (waarde van 90 credits)."
  },
  "zh": {
    "name": "专业版", 
    "description": "每月包含450个积分，外加3个FaceModel（价值90积分）。"
  },
  "ja": {
    "name": "プロ", 
    "description": "月450クレジット、FaceModel3個（90クレジット相当）を含みます。"
  }
}' WHERE name = 'pro';

-- Update credit_packs with translations
UPDATE credit_packs SET translations = '{
  "en": {
    "name": "90 Credits", 
    "description": "90 credits pack with 60 days validity"
  },
  "es": {
    "name": "90 Créditos", 
    "description": "Paquete de 90 créditos con validez de 60 días"
  },
  "fr": {
    "name": "90 Crédits", 
    "description": "Pack de 90 crédits valable 60 jours"
  },
  "it": {
    "name": "90 Crediti", 
    "description": "Pacchetto di 90 crediti con validità di 60 giorni"
  },
  "pt": {
    "name": "90 Créditos", 
    "description": "Pacote de 90 créditos com validade de 60 dias"
  },
  "de": {
    "name": "90 Credits", 
    "description": "90 Credits Paket mit 60 Tagen Gültigkeit"
  },
  "nl": {
    "name": "90 Credits", 
    "description": "90 credits pakket geldig voor 60 dagen"
  },
  "zh": {
    "name": "90积分", 
    "description": "90积分套餐，有效期60天"
  },
  "ja": {
    "name": "90クレジット", 
    "description": "90クレジットパック（有効期限60日）"
  }
}' WHERE name = '90 Credits';

UPDATE credit_packs SET translations = '{
  "en": {
    "name": "180 Credits", 
    "description": "180 credits pack with 60 days validity"
  },
  "es": {
    "name": "180 Créditos", 
    "description": "Paquete de 180 créditos con validez de 60 días"
  },
  "fr": {
    "name": "180 Crédits", 
    "description": "Pack de 180 crédits valable 60 jours"
  },
  "it": {
    "name": "180 Crediti", 
    "description": "Pacchetto di 180 crediti con validità di 60 giorni"
  },
  "pt": {
    "name": "180 Créditos", 
    "description": "Pacote de 180 créditos com validade de 60 dias"
  },
  "de": {
    "name": "180 Credits", 
    "description": "180 Credits Paket mit 60 Tagen Gültigkeit"
  },
  "nl": {
    "name": "180 Credits", 
    "description": "180 credits pakket geldig voor 60 dagen"
  },
  "zh": {
    "name": "180积分", 
    "description": "180积分套餐，有效期60天"
  },
  "ja": {
    "name": "180クレジット", 
    "description": "180クレジットパック（有効期限60日）"
  }
}' WHERE name = '180 Credits';

UPDATE credit_packs SET translations = '{
  "en": {
    "name": "360 Credits", 
    "description": "360 credits pack with 60 days validity"
  },
  "es": {
    "name": "360 Créditos", 
    "description": "Paquete de 360 créditos con validez de 60 días"
  },
  "fr": {
    "name": "360 Crédits", 
    "description": "Pack de 360 crédits valable 60 jours"
  },
  "it": {
    "name": "360 Crediti", 
    "description": "Pacchetto di 360 crediti con validità di 60 giorni"
  },
  "pt": {
    "name": "360 Créditos", 
    "description": "Pacote de 360 créditos com validade de 60 dias"
  },
  "de": {
    "name": "360 Credits", 
    "description": "360 Credits Paket mit 60 Tagen Gültigkeit"
  },
  "nl": {
    "name": "360 Credits", 
    "description": "360 credits pakket geldig voor 60 dagen"
  },
  "zh": {
    "name": "360积分", 
    "description": "360积分套餐，有效期60天"
  },
  "ja": {
    "name": "360クレジット", 
    "description": "360クレジットパック（有効期限60日）"
  }
}' WHERE name = '360 Credits'; 