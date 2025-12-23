import type { LineId, StationId } from "./stations";

export interface Edge {
  from: StationId;
  to: StationId;
  line: LineId;
  timeMin: number;
  distanceKm: number;
}

/* ---------------- YELLOW LINE ---------------- */
/* Samaypur Badli → HUDA City Centre */

const yellowLine: Edge[] = [
  { from: "SAMAYPUR_BADLI", to: "ROHINI_SECTOR_18_19", line: "Yellow", timeMin: 2, distanceKm: 1.4 },
  { from: "ROHINI_SECTOR_18_19", to: "HAIDERPUR_BADLI_MOR", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "HAIDERPUR_BADLI_MOR", to: "JAHANGIRPURI", line: "Yellow", timeMin: 3, distanceKm: 1.5 },
  { from: "JAHANGIRPURI", to: "ADARSH_NAGAR", line: "Yellow", timeMin: 2, distanceKm: 1.1 },
  { from: "ADARSH_NAGAR", to: "AZADPUR", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "AZADPUR", to: "MODEL_TOWN", line: "Yellow", timeMin: 2, distanceKm: 1.1 },
  { from: "MODEL_TOWN", to: "GTB_NAGAR", line: "Yellow", timeMin: 2, distanceKm: 0.9 },
  { from: "GTB_NAGAR", to: "VIDHAN_SABHA", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "VIDHAN_SABHA", to: "CIVIL_LINES", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "CIVIL_LINES", to: "KASHMERE_GATE", line: "Yellow", timeMin: 2, distanceKm: 1.4 },
  { from: "KASHMERE_GATE", to: "CHANDNI_CHOWK", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "CHANDNI_CHOWK", to: "CHAWRI_BAZAR", line: "Yellow", timeMin: 2, distanceKm: 0.8 },
  { from: "CHAWRI_BAZAR", to: "NEW_DELHI", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "NEW_DELHI", to: "RAJIV_CHOWK", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "RAJIV_CHOWK", to: "PATEL_CHOWK", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "PATEL_CHOWK", to: "CENTRAL_SECRETARIAT", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "CENTRAL_SECRETARIAT", to: "UDYOG_BHAWAN", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "UDYOG_BHAWAN", to: "LOK_KALYAN_MARG", line: "Yellow", timeMin: 2, distanceKm: 1.1 },
  { from: "LOK_KALYAN_MARG", to: "JOR_BAGH", line: "Yellow", timeMin: 2, distanceKm: 1.3 },
  { from: "JOR_BAGH", to: "DILLI_HAAT_INA", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "DILLI_HAAT_INA", to: "AIIMS", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "AIIMS", to: "GREEN_PARK", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "GREEN_PARK", to: "HAUZ_KHAS", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "HAUZ_KHAS", to: "MALVIYA_NAGAR", line: "Yellow", timeMin: 2, distanceKm: 1.3 },
  { from: "MALVIYA_NAGAR", to: "SAKET", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "SAKET", to: "QUTAB_MINAR", line: "Yellow", timeMin: 2, distanceKm: 1.1 },
  { from: "QUTAB_MINAR", to: "CHHATARPUR", line: "Yellow", timeMin: 3, distanceKm: 1.5 },
  { from: "CHHATARPUR", to: "SULTANPUR", line: "Yellow", timeMin: 2, distanceKm: 1.4 },
  { from: "SULTANPUR", to: "GHITORNI", line: "Yellow", timeMin: 3, distanceKm: 1.6 },
  { from: "GHITORNI", to: "ARJAN_GARH", line: "Yellow", timeMin: 3, distanceKm: 2.0 },
  { from: "ARJAN_GARH", to: "GURU_DRONACHARYA", line: "Yellow", timeMin: 4, distanceKm: 2.2 },
  { from: "GURU_DRONACHARYA", to: "SIKANDERPUR", line: "Yellow", timeMin: 2, distanceKm: 1.0 },
  { from: "SIKANDERPUR", to: "MG_ROAD", line: "Yellow", timeMin: 2, distanceKm: 1.2 },
  { from: "MG_ROAD", to: "IFFCO_CHOWK", line: "Yellow", timeMin: 2, distanceKm: 1.1 },
  { from: "IFFCO_CHOWK", to: "HUDA_CITY_CENTRE", line: "Yellow", timeMin: 2, distanceKm: 1.3 },
];

/* ---------------- BLUE LINE ---------------- */
/* Dwarka Sec 21 → Noida City Centre */

export const BLUE_LINE_MAIN: Edge[] = [
  { from: "DWARKA_SECTOR_21", to: "DWARKA_SECTOR_8", line: "Blue", timeMin: 3, distanceKm: 2.2 },
  { from: "DWARKA_SECTOR_8", to: "DWARKA_SECTOR_9", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "DWARKA_SECTOR_9", to: "DWARKA_SECTOR_10", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "DWARKA_SECTOR_10", to: "DWARKA_SECTOR_11", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "DWARKA_SECTOR_11", to: "DWARKA_SECTOR_12", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "DWARKA_SECTOR_12", to: "DWARKA_SECTOR_13", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "DWARKA_SECTOR_13", to: "DWARKA_SECTOR_14", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "DWARKA_SECTOR_14", to: "DWARKA_MOR", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "DWARKA_MOR", to: "NAWADA", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "NAWADA", to: "UTTAM_NAGAR_WEST", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "UTTAM_NAGAR_WEST", to: "UTTAM_NAGAR_EAST", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "UTTAM_NAGAR_EAST", to: "JANAKPURI_WEST", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "JANAKPURI_WEST", to: "JANAKPURI_EAST", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "JANAKPURI_EAST", to: "TILAK_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "TILAK_NAGAR", to: "SUBHASH_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "SUBHASH_NAGAR", to: "TAGORE_GARDEN", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "TAGORE_GARDEN", to: "RAJOURI_GARDEN", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "RAJOURI_GARDEN", to: "RAMESH_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "RAMESH_NAGAR", to: "MOTI_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "MOTI_NAGAR", to: "KIRTI_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "KIRTI_NAGAR", to: "SHADIPUR", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "SHADIPUR", to: "PATEL_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "PATEL_NAGAR", to: "RAJENDRA_PLACE", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "RAJENDRA_PLACE", to: "KAROL_BAGH", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "KAROL_BAGH", to: "JHANDEWALAN", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "JHANDEWALAN", to: "RK_ASHRAM", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "RK_ASHRAM", to: "RAJIV_CHOWK", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "RAJIV_CHOWK", to: "BARAKHAMBA_ROAD", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "BARAKHAMBA_ROAD", to: "MANDI_HOUSE", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "MANDI_HOUSE", to: "SUPREME_COURT", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "SUPREME_COURT", to: "INDRAPRASTHA", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "INDRAPRASTHA", to: "YAMUNA_BANK", line: "Blue", timeMin: 2, distanceKm: 1.3 },
  { from: "YAMUNA_BANK", to: "AKSHARDHAM", line: "Blue", timeMin: 3, distanceKm: 1.6 },
  { from: "AKSHARDHAM", to: "MAYUR_VIHAR_PHASE_1", line: "Blue", timeMin: 2, distanceKm: 1.4 },
  { from: "MAYUR_VIHAR_PHASE_1", to: "MAYUR_VIHAR_EXTENSION", line: "Blue", timeMin: 2, distanceKm: 1.3 },
  { from: "MAYUR_VIHAR_EXTENSION", to: "NEW_ASHOK_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "NEW_ASHOK_NAGAR", to: "NOIDA_SECTOR_15", line: "Blue", timeMin: 2, distanceKm: 1.3 },
  { from: "NOIDA_SECTOR_15", to: "NOIDA_SECTOR_16", line: "Blue", timeMin: 2, distanceKm: 0.9 },
  { from: "NOIDA_SECTOR_16", to: "NOIDA_SECTOR_18", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "NOIDA_SECTOR_18", to: "BOTANICAL_GARDEN", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "BOTANICAL_GARDEN", to: "GOLF_COURSE", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "GOLF_COURSE", to: "NOIDA_CITY_CENTRE", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "NOIDA_CITY_CENTRE", to: "NOIDA_SECTOR_34", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "NOIDA_SECTOR_34", to: "NOIDA_SECTOR_52", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "NOIDA_SECTOR_52", to: "NOIDA_SECTOR_61", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "NOIDA_SECTOR_61", to: "NOIDA_SECTOR_59", line: "Blue", timeMin: 2, distanceKm: 1.0 },
  { from: "NOIDA_SECTOR_59", to: "NOIDA_SECTOR_62", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "NOIDA_SECTOR_62", to: "NOIDA_ELECTRONIC_CITY", line: "Blue", timeMin: 2, distanceKm: 1.2 },
];

export const BLUE_LINE_VAISHALI: Edge[] = [
  { from: "YAMUNA_BANK", to: "LAXMI_NAGAR", line: "Blue", timeMin: 2, distanceKm: 1.3 },
  { from: "LAXMI_NAGAR", to: "NIRMAN_VIHAR", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "NIRMAN_VIHAR", to: "PREET_VIHAR", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "PREET_VIHAR", to: "KARKARDUMA", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "KARKARDUMA", to: "ANAND_VIHAR_ISBT", line: "Blue", timeMin: 2, distanceKm: 1.1 },
  { from: "ANAND_VIHAR_ISBT", to: "KAUSHAMBI", line: "Blue", timeMin: 2, distanceKm: 1.2 },
  { from: "KAUSHAMBI", to: "VAISHALI", line: "Blue", timeMin: 2, distanceKm: 1.3 },
];



/* ---------------- PINK LINE ---------------- */
/* Majlis Park → Shiv Vihar */

const pinkLine: Edge[] = [
  { from: "MAJLIS_PARK", to: "AZADPUR_PINK", line: "Pink", timeMin: 2, distanceKm: 1.2 },
  { from: "AZADPUR_PINK", to: "NETAJI_SUBHASH_PLACE", line: "Pink", timeMin: 2, distanceKm: 1.3 },
  { from: "NETAJI_SUBHASH_PLACE", to: "SHAKURPUR", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "SHAKURPUR", to: "PUNJABI_BAGH_WEST", line: "Pink", timeMin: 2, distanceKm: 1.2 },
  { from: "PUNJABI_BAGH_WEST", to: "ESI_BASAIDARAPUR", line: "Pink", timeMin: 2, distanceKm: 1.1 },
  { from: "ESI_BASAIDARAPUR", to: "MAYAPURI", line: "Pink", timeMin: 2, distanceKm: 1.3 },
  { from: "MAYAPURI", to: "NARAINA_VIHAR", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "NARAINA_VIHAR", to: "DELHI_CANTT", line: "Pink", timeMin: 2, distanceKm: 1.5 },
  { from: "DELHI_CANTT", to: "DURGABAI_DESHMUKH_SOUTH_CAMPUS", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "DURGABAI_DESHMUKH_SOUTH_CAMPUS", to: "SIR_VISHWESHWARAIAH_MOTI_BAGH", line: "Pink", timeMin: 2, distanceKm: 1.2 },
  { from: "SIR_VISHWESHWARAIAH_MOTI_BAGH", to: "BHIKAJI_CAMA_PLACE", line: "Pink", timeMin: 2, distanceKm: 1.1 },
  { from: "BHIKAJI_CAMA_PLACE", to: "SAROJINI_NAGAR", line: "Pink", timeMin: 2, distanceKm: 1.0 },
  { from: "SAROJINI_NAGAR", to: "DILLI_HAAT_INA", line: "Pink", timeMin: 2, distanceKm: 0.8 },
  { from: "DILLI_HAAT_INA", to: "SOUTH_EXTENSION", line: "Pink", timeMin: 2, distanceKm: 1.1 },
  { from: "SOUTH_EXTENSION", to: "LAJPAT_NAGAR", line: "Pink", timeMin: 2, distanceKm: 1.2 },
  { from: "LAJPAT_NAGAR", to: "VINOBAPURI", line: "Pink", timeMin: 2, distanceKm: 1.1 },
  { from: "VINOBAPURI", to: "ASHRAM", line: "Pink", timeMin: 2, distanceKm: 1.3 },
  { from: "ASHRAM", to: "SARAI_KALE_KHAN_NIZAMUDDIN", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "SARAI_KALE_KHAN_NIZAMUDDIN", to: "MAYUR_VIHAR_PHASE_1_PINK", line: "Pink", timeMin: 2, distanceKm: 1.6 },
  { from: "MAYUR_VIHAR_PHASE_1_PINK", to: "TRILOKPURI_SANJAY_LAKE", line: "Pink", timeMin: 2, distanceKm: 1.5 },
  { from: "TRILOKPURI_SANJAY_LAKE", to: "EAST_VINOD_NAGAR_MAYUR_VIHAR_II", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "EAST_VINOD_NAGAR_MAYUR_VIHAR_II", to: "MANDI_HOUSE_PINK", line: "Pink", timeMin: 2, distanceKm: 1.5 },
  { from: "MANDI_HOUSE_PINK", to: "JAMA_MASJID", line: "Pink", timeMin: 2, distanceKm: 1.3 },
  { from: "JAMA_MASJID", to: "SEELAMPUR_PINK", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "SEELAMPUR_PINK", to: "SHAHDARA_PINK", line: "Pink", timeMin: 2, distanceKm: 1.6 },
  { from: "SHAHDARA_PINK", to: "WELCOME_PINK", line: "Pink", timeMin: 2, distanceKm: 1.3 },
  { from: "WELCOME_PINK", to: "JAFRABAD", line: "Pink", timeMin: 2, distanceKm: 1.2 },
  { from: "JAFRABAD", to: "MAUJPUR_BABARPUR", line: "Pink", timeMin: 2, distanceKm: 1.4 },
  { from: "MAUJPUR_BABARPUR", to: "GOKULPURI", line: "Pink", timeMin: 2, distanceKm: 1.6 },
  { from: "GOKULPURI", to: "JOHAR_ENCLAVE", line: "Pink", timeMin: 2, distanceKm: 1.5 },
  { from: "JOHAR_ENCLAVE", to: "SHIV_VIHAR", line: "Pink", timeMin: 2, distanceKm: 1.3 },
];


/* ---------------- EXPORT UNDIRECTED GRAPH ---------------- */

export const EDGES: Edge[] = [
  ...yellowLine,
  ...BLUE_LINE_MAIN,
  ...BLUE_LINE_VAISHALI,
  ...pinkLine,
  ...yellowLine.map(e => ({ ...e, from: e.to, to: e.from })),
  ...BLUE_LINE_MAIN.map(e => ({ ...e, from: e.to, to: e.from })),
  ...BLUE_LINE_VAISHALI.map(e => ({ ...e, from: e.to, to: e.from })),
  ...pinkLine.map(e => ({ ...e, from: e.to, to: e.from })),
];

