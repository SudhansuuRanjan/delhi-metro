// data/stations.ts

export type StationId =
  // ---------------- Yellow Line ----------------
  | "SAMAYPUR_BADLI"
  | "ROHINI_SECTOR_18_19"
  | "HAIDERPUR_BADLI_MOR"
  | "JAHANGIRPURI"
  | "ADARSH_NAGAR"
  | "AZADPUR"
  | "MODEL_TOWN"
  | "GTB_NAGAR"
  | "VIDHAN_SABHA"
  | "CIVIL_LINES"
  | "KASHMERE_GATE"
  | "CHANDNI_CHOWK"
  | "CHAWRI_BAZAR"
  | "NEW_DELHI"
  | "RAJIV_CHOWK"
  | "PATEL_CHOWK"
  | "CENTRAL_SECRETARIAT"
  | "UDYOG_BHAWAN"
  | "LOK_KALYAN_MARG"
  | "JOR_BAGH"
  | "INA"
  | "AIIMS"
  | "GREEN_PARK"
  | "HAUZ_KHAS"
  | "MALVIYA_NAGAR"
  | "SAKET"
  | "QUTAB_MINAR"
  | "CHHATARPUR"
  | "SULTANPUR"
  | "GHITORNI"
  | "ARJAN_GARH"
  | "GURU_DRONACHARYA"
  | "SIKANDERPUR"
  | "MG_ROAD"
  | "IFFCO_CHOWK"
  | "HUDA_CITY_CENTRE"

  // ---------------- Blue Line ----------------
  | "DWARKA_SECTOR_21"
  | "DWARKA_SECTOR_8"
  | "DWARKA_SECTOR_9"
  | "DWARKA_SECTOR_10"
  | "DWARKA_SECTOR_11"
  | "DWARKA_SECTOR_12"
  | "DWARKA_SECTOR_13"
  | "DWARKA_SECTOR_14"
  | "DWARKA_MOR"
  | "NAWADA"
  | "UTTAM_NAGAR_WEST"
  | "UTTAM_NAGAR_EAST"
  | "JANAKPURI_WEST"
  | "JANAKPURI_EAST"
  | "TILAK_NAGAR"
  | "SUBHASH_NAGAR"
  | "TAGORE_GARDEN"
  | "RAJOURI_GARDEN"
  | "RAMESH_NAGAR"
  | "MOTI_NAGAR"
  | "KIRTI_NAGAR"
  | "SHADIPUR"
  | "PATEL_NAGAR"
  | "RAJENDRA_PLACE"
  | "KAROL_BAGH"
  | "JHANDEWALAN"
  | "RK_ASHRAM"
  | "BARAKHAMBA_ROAD"
  | "MANDI_HOUSE"
  | "SUPREME_COURT"
  | "INDRAPRASTHA"
  | "YAMUNA_BANK"
  | "AKSHARDHAM"
  | "MAYUR_VIHAR_PHASE_1"
  | "MAYUR_VIHAR_EXTENSION"
  | "NEW_ASHOK_NAGAR"
  | "NOIDA_SECTOR_15"
  | "NOIDA_SECTOR_16"
  | "NOIDA_SECTOR_18"
  | "BOTANICAL_GARDEN"
  | "GOLF_COURSE"
  | "NOIDA_CITY_CENTRE"
  | "NOIDA_SECTOR_34"
  | "NOIDA_SECTOR_52"
  | "NOIDA_SECTOR_61"
  | "NOIDA_SECTOR_59"
  | "NOIDA_SECTOR_62"
  | "NOIDA_ELECTRONIC_CITY"
  | "LAXMI_NAGAR"
  | "NIRMAN_VIHAR"
  | "PREET_VIHAR"
  | "KARKARDUMA"
  | "ANAND_VIHAR_ISBT"
  | "KAUSHAMBI"
  | "VAISHALI"

  // ---------------- Pink Line ----------------
  | "MAJLIS_PARK"
  | "AZADPUR_PINK"
  | "NETAJI_SUBHASH_PLACE"
  | "SHAKURPUR"
  | "PUNJABI_BAGH_WEST"
  | "ESI_BASAIDARAPUR"
  | "MAYAPURI"
  | "NARAINA_VIHAR"
  | "DELHI_CANTT"
  | "DURGABAI_DESHMUKH_SOUTH_CAMPUS"
  | "SIR_VISHWESHWARAIAH_MOTI_BAGH"
  | "BHIKAJI_CAMA_PLACE"
  | "SAROJINI_NAGAR"
  | "DILLI_HAAT_INA"
  | "SOUTH_EXTENSION"
  | "LAJPAT_NAGAR"
  | "VINOBAPURI"
  | "ASHRAM"
  | "SARAI_KALE_KHAN_NIZAMUDDIN"
  | "MAYUR_VIHAR_PHASE_1_PINK"
  | "TRILOKPURI_SANJAY_LAKE"
  | "EAST_VINOD_NAGAR_MAYUR_VIHAR_II"
  | "MANDI_HOUSE_PINK"
  | "JAMA_MASJID"
  | "SEELAMPUR_PINK"
  | "SHAHDARA_PINK"
  | "WELCOME_PINK"
  | "JAFRABAD"
  | "MAUJPUR_BABARPUR"
  | "GOKULPURI"
  | "JOHAR_ENCLAVE"
  | "SHIV_VIHAR";


export type LineId =
  | "Yellow"
  | "Blue"
  | "Red"
  | "Green"
  | "Violet"
  | "Pink"
  | "Magenta"
  | "Grey"
  | "Orange"
  | "Rapid";


export interface Station {
  id: StationId;
  name: string;
  lines: LineId[];
}

export const LINE_COLORS: Record<LineId, string> = {
  Yellow: "#FFD800",   // Yellow Line
  Blue: "#1E90FF",     // Blue Line
  Red: "#E53935",      // Red Line
  Green: "#2ECC71",    // Green Line
  Violet: "#8E44AD",   // Violet Line
  Pink: "#FF69B4",     // Pink Line
  Magenta: "#C2185B",  // Magenta Line
  Grey: "#9E9E9E",     // Grey Line
  Orange: "#FF8C00",   // Airport Express
  Rapid: "#00C4CC",    // Rapid Metro (Gurgaon)
};


export const STATIONS: Station[] = [
  // ---------- Yellow Line ----------
  { id: "SAMAYPUR_BADLI", name: "Samaypur Badli", lines: ["Yellow"] },
  { id: "ROHINI_SECTOR_18_19", name: "Rohini Sector 18–19", lines: ["Yellow"] },
  { id: "HAIDERPUR_BADLI_MOR", name: "Haiderpur Badli Mor", lines: ["Yellow"] },
  { id: "JAHANGIRPURI", name: "Jahangirpuri", lines: ["Yellow"] },
  { id: "ADARSH_NAGAR", name: "Adarsh Nagar", lines: ["Yellow"] },
  { id: "AZADPUR", name: "Azadpur", lines: ["Yellow"] },
  { id: "MODEL_TOWN", name: "Model Town", lines: ["Yellow"] },
  { id: "GTB_NAGAR", name: "GTB Nagar", lines: ["Yellow"] },
  { id: "VIDHAN_SABHA", name: "Vidhan Sabha", lines: ["Yellow"] },
  { id: "CIVIL_LINES", name: "Civil Lines", lines: ["Yellow"] },
  { id: "KASHMERE_GATE", name: "Kashmere Gate", lines: ["Yellow"] },
  { id: "CHANDNI_CHOWK", name: "Chandni Chowk", lines: ["Yellow"] },
  { id: "CHAWRI_BAZAR", name: "Chawri Bazar", lines: ["Yellow"] },
  { id: "NEW_DELHI", name: "New Delhi", lines: ["Yellow"] },
  { id: "RAJIV_CHOWK", name: "Rajiv Chowk", lines: ["Yellow", "Blue"] },
  { id: "PATEL_CHOWK", name: "Patel Chowk", lines: ["Yellow"] },
  { id: "CENTRAL_SECRETARIAT", name: "Central Secretariat", lines: ["Yellow"] },
  { id: "UDYOG_BHAWAN", name: "Udyog Bhawan", lines: ["Yellow"] },
  { id: "LOK_KALYAN_MARG", name: "Lok Kalyan Marg", lines: ["Yellow"] },
  { id: "JOR_BAGH", name: "Jor Bagh", lines: ["Yellow"] },
  { id: "DILLI_HAAT_INA", name: "", lines: ["Yellow"] },
  { id: "AIIMS", name: "AIIMS", lines: ["Yellow"] },
  { id: "GREEN_PARK", name: "Green Park", lines: ["Yellow"] },
  { id: "HAUZ_KHAS", name: "Hauz Khas", lines: ["Yellow"] },
  { id: "MALVIYA_NAGAR", name: "Malviya Nagar", lines: ["Yellow"] },
  { id: "SAKET", name: "Saket", lines: ["Yellow"] },
  { id: "QUTAB_MINAR", name: "Qutab Minar", lines: ["Yellow"] },
  { id: "CHHATARPUR", name: "Chhatarpur", lines: ["Yellow"] },
  { id: "SULTANPUR", name: "Sultanpur", lines: ["Yellow"] },
  { id: "GHITORNI", name: "Ghitorni", lines: ["Yellow"] },
  { id: "ARJAN_GARH", name: "Arjan Garh", lines: ["Yellow"] },
  { id: "GURU_DRONACHARYA", name: "Guru Dronacharya", lines: ["Yellow"] },
  { id: "SIKANDERPUR", name: "Sikanderpur", lines: ["Yellow"] },
  { id: "MG_ROAD", name: "MG Road", lines: ["Yellow"] },
  { id: "IFFCO_CHOWK", name: "IFFCO Chowk", lines: ["Yellow"] },
  { id: "HUDA_CITY_CENTRE", name: "HUDA City Centre", lines: ["Yellow"] },

  // ---------- Blue Line ----------
{ id: "DWARKA_SECTOR_21", name: "Dwarka Sector 21", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_8", name: "Dwarka Sector 8", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_9", name: "Dwarka Sector 9", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_10", name: "Dwarka Sector 10", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_11", name: "Dwarka Sector 11", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_12", name: "Dwarka Sector 12", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_13", name: "Dwarka Sector 13", lines: ["Blue"] },
  { id: "DWARKA_SECTOR_14", name: "Dwarka Sector 14", lines: ["Blue"] },
  { id: "DWARKA_MOR", name: "Dwarka Mor", lines: ["Blue"] },
  { id: "NAWADA", name: "Nawada", lines: ["Blue"] },
  { id: "UTTAM_NAGAR_WEST", name: "Uttam Nagar West", lines: ["Blue"] },
  { id: "UTTAM_NAGAR_EAST", name: "Uttam Nagar East", lines: ["Blue"] },
  { id: "JANAKPURI_WEST", name: "Janakpuri West", lines: ["Blue"] },
  { id: "JANAKPURI_EAST", name: "Janakpuri East", lines: ["Blue"] },
  { id: "TILAK_NAGAR", name: "Tilak Nagar", lines: ["Blue"] },
  { id: "SUBHASH_NAGAR", name: "Subhash Nagar", lines: ["Blue"] },
  { id: "TAGORE_GARDEN", name: "Tagore Garden", lines: ["Blue"] },
  { id: "RAJOURI_GARDEN", name: "Rajouri Garden", lines: ["Blue"] },
  { id: "RAMESH_NAGAR", name: "Ramesh Nagar", lines: ["Blue"] },
  { id: "MOTI_NAGAR", name: "Moti Nagar", lines: ["Blue"] },
  { id: "KIRTI_NAGAR", name: "Kirti Nagar", lines: ["Blue"] },
  { id: "SHADIPUR", name: "Shadipur", lines: ["Blue"] },
  { id: "PATEL_NAGAR", name: "Patel Nagar", lines: ["Blue"] },
  { id: "RAJENDRA_PLACE", name: "Rajendra Place", lines: ["Blue"] },
  { id: "KAROL_BAGH", name: "Karol Bagh", lines: ["Blue"] },
  { id: "JHANDEWALAN", name: "Jhandewalan", lines: ["Blue"] },
  { id: "RK_ASHRAM", name: "RK Ashram Marg", lines: ["Blue"] },
  { id: "BARAKHAMBA_ROAD", name: "Barakhamba Road", lines: ["Blue"] },
  { id: "MANDI_HOUSE", name: "Mandi House", lines: ["Blue"] },
  { id: "SUPREME_COURT", name: "Supreme Court", lines: ["Blue"] },
  { id: "INDRAPRASTHA", name: "Indraprastha", lines: ["Blue"] },
  { id: "YAMUNA_BANK", name: "Yamuna Bank", lines: ["Blue"] },
  { id: "AKSHARDHAM", name: "Akshardham", lines: ["Blue"] },
  { id: "MAYUR_VIHAR_PHASE_1", name: "Mayur Vihar Phase I", lines: ["Blue"] },
  { id: "MAYUR_VIHAR_EXTENSION", name: "Mayur Vihar Extension", lines: ["Blue"] },
  { id: "NEW_ASHOK_NAGAR", name: "New Ashok Nagar", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_15", name: "Noida Sector 15", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_16", name: "Noida Sector 16", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_18", name: "Noida Sector 18", lines: ["Blue"] },
  { id: "BOTANICAL_GARDEN", name: "Botanical Garden", lines: ["Blue"] },
  { id: "GOLF_COURSE", name: "Golf Course", lines: ["Blue"] },
  { id: "NOIDA_CITY_CENTRE", name: "Noida City Centre", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_34", name: "Noida Sector 34", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_52", name: "Noida Sector 52", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_61", name: "Noida Sector 61", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_59", name: "Noida Sector 59", lines: ["Blue"] },
  { id: "NOIDA_SECTOR_62", name: "Noida Sector 62", lines: ["Blue"] },
  { id: "NOIDA_ELECTRONIC_CITY", name: "Noida Electronic City", lines: ["Blue"] },
  { id: "LAXMI_NAGAR", name: "Laxmi Nagar", lines: ["Blue"] },
  { id: "NIRMAN_VIHAR", name: "Nirman Vihar", lines: ["Blue"] },
  { id: "PREET_VIHAR", name: "Preet Vihar", lines: ["Blue"] },
  { id: "KARKARDUMA", name: "Karkarduma", lines: ["Blue"] },
  { id: "ANAND_VIHAR_ISBT", name: "Anand Vihar ISBT", lines: ["Blue"] },
  { id: "KAUSHAMBI", name: "Kaushambi", lines: ["Blue"] },
  { id: "VAISHALI", name: "Vaishali", lines: ["Blue"] },

    // ---------- Pink Line ----------
  { id: "MAJLIS_PARK", name: "Majlis Park", lines: ["Pink"] },
  { id: "AZADPUR_PINK", name: "Azadpur", lines: ["Pink"] },
  { id: "NETAJI_SUBHASH_PLACE", name: "Netaji Subhash Place", lines: ["Pink"] },
  { id: "SHAKURPUR", name: "Shakurpur", lines: ["Pink"] },
  { id: "PUNJABI_BAGH_WEST", name: "Punjabi Bagh West", lines: ["Pink"] },
  { id: "ESI_BASAIDARAPUR", name: "ESI-Basaidarapur", lines: ["Pink"] },
  { id: "MAYAPURI", name: "Mayapuri", lines: ["Pink"] },
  { id: "NARAINA_VIHAR", name: "Naraina Vihar", lines: ["Pink"] },
  { id: "DELHI_CANTT", name: "Delhi Cantt", lines: ["Pink"] },
  {
    id: "DURGABAI_DESHMUKH_SOUTH_CAMPUS",
    name: "Durgabai Deshmukh South Campus",
    lines: ["Pink"],
  },
  {
    id: "SIR_VISHWESHWARAIAH_MOTI_BAGH",
    name: "Sir Vishweshwaraiah Moti Bagh",
    lines: ["Pink"],
  },
  { id: "BHIKAJI_CAMA_PLACE", name: "Bhikaji Cama Place", lines: ["Pink"] },
  { id: "SAROJINI_NAGAR", name: "Sarojini Nagar", lines: ["Pink"] },
  { id: "DILLI_HAAT_INA", name: "Dilli Haat – INA", lines: ["Pink"] },
  { id: "SOUTH_EXTENSION", name: "South Extension", lines: ["Pink"] },
  { id: "LAJPAT_NAGAR", name: "Lajpat Nagar", lines: ["Pink"] },
  { id: "VINOBAPURI", name: "Vinobapuri", lines: ["Pink"] },
  { id: "ASHRAM", name: "Ashram", lines: ["Pink"] },
  { id: "SARAI_KALE_KHAN_NIZAMUDDIN", name: "Sarai Kale Khan – Nizamuddin", lines: ["Pink"] },
  { id: "MAYUR_VIHAR_PHASE_1_PINK", name: "Mayur Vihar Phase I", lines: ["Pink"] },
  { id: "TRILOKPURI_SANJAY_LAKE", name: "Trilokpuri Sanjay Lake", lines: ["Pink"] },
  {
    id: "EAST_VINOD_NAGAR_MAYUR_VIHAR_II",
    name: "East Vinod Nagar – Mayur Vihar II",
    lines: ["Pink"],
  },
  { id: "MANDI_HOUSE_PINK", name: "Mandi House", lines: ["Pink"] },
  { id: "JAMA_MASJID", name: "Jama Masjid", lines: ["Pink"] },
  { id: "SEELAMPUR_PINK", name: "Seelampur", lines: ["Pink"] },
  { id: "SHAHDARA_PINK", name: "Shahdara", lines: ["Pink"] },
  { id: "WELCOME_PINK", name: "Welcome", lines: ["Pink"] },
  { id: "JAFRABAD", name: "Jafrabad", lines: ["Pink"] },
  { id: "MAUJPUR_BABARPUR", name: "Maujpur–Babarpur", lines: ["Pink"] },
  { id: "GOKULPURI", name: "Gokulpuri", lines: ["Pink"] },
  { id: "JOHAR_ENCLAVE", name: "Johar Enclave", lines: ["Pink"] },
  { id: "SHIV_VIHAR", name: "Shiv Vihar", lines: ["Pink"] },

];

export const STATION_BY_ID: Record<StationId, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s])
) as Record<StationId, Station>;
